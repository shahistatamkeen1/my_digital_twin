from __future__ import annotations

from datetime import timedelta
import hashlib
import json
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.exceptions import APIError
from app.models.agent_action_outbox import (
    AgentActionOutbox,
    AgentActionOutboxEvent,
)
from app.models.agent_approval import AgentApproval
from app.models.common import utc_now
from app.schemas.agent_action_outbox import (
    ActionOutboxDetail,
    ActionOutboxEventRead,
    ActionOutboxStatus,
    ActionOutboxSummary,
)


RETRY_BACKOFF_SECONDS = (0, 30, 120, 300)


def _require_owned_entry(db: Session, outbox_id: int) -> AgentActionOutbox:
    entry = (
        db.query(AgentActionOutbox)
        .filter(AgentActionOutbox.id == outbox_id)
        .with_for_update()
        .first()
    )
    if entry is None:
        raise APIError(
            status_code=404,
            code="ACTION_OUTBOX_NOT_FOUND",
            message="The requested action outbox entry was not found.",
        )
    return entry


def _append_event(
    db: Session,
    entry: AgentActionOutbox,
    *,
    event_type: str,
    previous_status: str | None,
    new_status: str,
    attempt_number: int | None = None,
    note: str | None = None,
    event_payload: dict[str, Any] | None = None,
) -> None:
    db.add(
        AgentActionOutboxEvent(
            outbox_id=entry.id,
            event_type=event_type,
            previous_status=previous_status,
            new_status=new_status,
            attempt_number=attempt_number,
            note=note,
            event_payload=event_payload or {},
        )
    )


def outbox_summary(entry: AgentActionOutbox) -> ActionOutboxSummary:
    return ActionOutboxSummary.model_validate(entry)


def outbox_detail(entry: AgentActionOutbox) -> ActionOutboxDetail:
    payload = ActionOutboxSummary.model_validate(entry).model_dump()
    payload["events"] = [
        ActionOutboxEventRead.model_validate(event)
        for event in entry.events
    ]
    return ActionOutboxDetail.model_validate(payload)


def serialize_outbox_collection(
    result: list[AgentActionOutbox] | dict[str, Any],
) -> list[dict[str, Any]] | dict[str, Any]:
    if isinstance(result, dict):
        return {
            **result,
            "items": [
                outbox_summary(item).model_dump()
                for item in result["items"]
            ],
        }
    return [outbox_summary(item).model_dump() for item in result]


def enqueue_approved_action(
    db: Session,
    approval: AgentApproval,
    *,
    commit: bool = True,
) -> AgentActionOutbox:
    if approval.status != "approved":
        raise APIError(
            status_code=409,
            code="ACTION_OUTBOX_APPROVAL_REQUIRED",
            message="Only approved actions can be placed in the action outbox.",
            details={"approval_status": approval.status},
        )

    existing = (
        db.query(AgentActionOutbox)
        .filter(AgentActionOutbox.approval_id == approval.id)
        .first()
    )
    if existing is not None:
        return existing

    execution_payload = dict(
        approval.decision_payload
        if approval.decision_payload is not None
        else approval.proposed_payload or {}
    )
    entry = AgentActionOutbox(
        approval_id=approval.id,
        agent_run_id=approval.agent_run_id,
        agent_step_id=approval.agent_step_id,
        idempotency_key=f"approval:{approval.id}:action:v1",
        action_type=approval.action_type,
        action_summary=approval.action_summary,
        execution_payload=execution_payload,
        execution_mode="dry_run",
        status=ActionOutboxStatus.queued.value,
        attempt_count=0,
        max_attempts=3,
    )
    db.add(entry)
    db.flush()
    _append_event(
        db,
        entry,
        event_type="queued",
        previous_status=None,
        new_status=ActionOutboxStatus.queued.value,
        event_payload={
            "approval_id": approval.id,
            "action_type": approval.action_type,
            "execution_mode": "dry_run",
        },
    )
    if commit:
        db.commit()
        db.refresh(entry)
    return entry


def enqueue_approval_by_id(
    db: Session,
    approval_id: int,
) -> AgentActionOutbox:
    approval = (
        db.query(AgentApproval)
        .filter(AgentApproval.id == approval_id)
        .first()
    )
    if approval is None:
        raise APIError(
            status_code=404,
            code="AGENT_APPROVAL_NOT_FOUND",
            message="The requested approval was not found.",
        )
    return enqueue_approved_action(db, approval)


def get_action_outbox_entry(
    db: Session,
    outbox_id: int,
) -> AgentActionOutbox:
    return _require_owned_entry(db, outbox_id)


def _dispatch_dry_run(entry: AgentActionOutbox) -> dict[str, Any]:
    encoded = json.dumps(
        entry.execution_payload or {},
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    return {
        "delivery_status": "simulated",
        "execution_mode": "dry_run",
        "receipt_id": str(uuid5(NAMESPACE_URL, entry.idempotency_key)),
        "action_type": entry.action_type,
        "payload_sha256": hashlib.sha256(encoded).hexdigest(),
        "message": (
            "The approved action completed in dry-run mode. No external "
            "email, calendar event, application, financial change, or data "
            "mutation was performed."
        ),
    }


def dispatch_action_outbox_entry(
    db: Session,
    outbox_id: int,
) -> AgentActionOutbox:
    entry = _require_owned_entry(db, outbox_id)

    if entry.status == ActionOutboxStatus.succeeded.value:
        return entry
    if entry.status != ActionOutboxStatus.queued.value:
        raise APIError(
            status_code=409,
            code="ACTION_OUTBOX_NOT_DISPATCHABLE",
            message="Only queued action outbox entries can be dispatched.",
            details={"status": entry.status},
        )
    if entry.attempt_count >= entry.max_attempts:
        previous = entry.status
        entry.status = ActionOutboxStatus.dead_lettered.value
        entry.next_attempt_at = None
        _append_event(
            db,
            entry,
            event_type="dead_lettered",
            previous_status=previous,
            new_status=entry.status,
            attempt_number=entry.attempt_count,
            note="The action exhausted its bounded dispatch attempts.",
        )
        db.commit()
        raise APIError(
            status_code=409,
            code="ACTION_OUTBOX_ATTEMPTS_EXHAUSTED",
            message="This action has exhausted its dispatch attempts.",
        )
    if entry.next_attempt_at is not None and entry.next_attempt_at > utc_now():
        raise APIError(
            status_code=409,
            code="ACTION_OUTBOX_BACKOFF_ACTIVE",
            message="This action is waiting for its retry backoff window.",
            details={"next_attempt_at": entry.next_attempt_at.isoformat()},
        )

    previous = entry.status
    entry.status = ActionOutboxStatus.dispatching.value
    entry.attempt_count += 1
    entry.claimed_at = utc_now()
    entry.dispatched_at = entry.claimed_at
    entry.last_error = None
    entry.next_attempt_at = None
    _append_event(
        db,
        entry,
        event_type="dispatch_started",
        previous_status=previous,
        new_status=entry.status,
        attempt_number=entry.attempt_count,
    )
    db.commit()
    db.refresh(entry)

    try:
        result = _dispatch_dry_run(entry)
    except Exception as exc:  # noqa: BLE001 - persisted as outbox state
        error = f"{type(exc).__name__}: {exc}"
        previous = entry.status
        entry.last_error = error
        entry.completed_at = None
        if entry.attempt_count >= entry.max_attempts:
            entry.status = ActionOutboxStatus.dead_lettered.value
            entry.next_attempt_at = None
            event_type = "dead_lettered"
        else:
            entry.status = ActionOutboxStatus.failed.value
            delay_index = min(entry.attempt_count, len(RETRY_BACKOFF_SECONDS) - 1)
            entry.next_attempt_at = utc_now() + timedelta(
                seconds=RETRY_BACKOFF_SECONDS[delay_index]
            )
            event_type = "dispatch_failed"
        _append_event(
            db,
            entry,
            event_type=event_type,
            previous_status=previous,
            new_status=entry.status,
            attempt_number=entry.attempt_count,
            note=error,
            event_payload={
                "next_attempt_at": (
                    entry.next_attempt_at.isoformat()
                    if entry.next_attempt_at is not None
                    else None
                )
            },
        )
        db.commit()
        db.refresh(entry)
        return entry

    previous = entry.status
    entry.status = ActionOutboxStatus.succeeded.value
    entry.result_payload = result
    entry.completed_at = utc_now()
    entry.next_attempt_at = None
    _append_event(
        db,
        entry,
        event_type="dispatch_succeeded",
        previous_status=previous,
        new_status=entry.status,
        attempt_number=entry.attempt_count,
        event_payload={"receipt_id": result["receipt_id"]},
    )
    db.commit()
    db.refresh(entry)
    return entry


def retry_action_outbox_entry(
    db: Session,
    outbox_id: int,
) -> AgentActionOutbox:
    entry = _require_owned_entry(db, outbox_id)
    if entry.status != ActionOutboxStatus.failed.value:
        raise APIError(
            status_code=409,
            code="ACTION_OUTBOX_NOT_RETRYABLE",
            message="Only failed action outbox entries can be retried.",
            details={"status": entry.status},
        )
    if entry.attempt_count >= entry.max_attempts:
        raise APIError(
            status_code=409,
            code="ACTION_OUTBOX_ATTEMPTS_EXHAUSTED",
            message="This action has exhausted its dispatch attempts.",
        )

    previous = entry.status
    entry.status = ActionOutboxStatus.queued.value
    entry.next_attempt_at = None
    entry.claimed_at = None
    _append_event(
        db,
        entry,
        event_type="retry_scheduled",
        previous_status=previous,
        new_status=entry.status,
        attempt_number=entry.attempt_count,
        note="A user requested another controlled dispatch attempt.",
    )
    db.commit()
    db.refresh(entry)
    return entry


def cancel_action_outbox_entry(
    db: Session,
    outbox_id: int,
    *,
    reason: str | None = None,
) -> AgentActionOutbox:
    entry = _require_owned_entry(db, outbox_id)
    if entry.status not in {
        ActionOutboxStatus.queued.value,
        ActionOutboxStatus.failed.value,
    }:
        raise APIError(
            status_code=409,
            code="ACTION_OUTBOX_NOT_CANCELLABLE",
            message="Only queued or failed actions can be cancelled.",
            details={"status": entry.status},
        )

    previous = entry.status
    entry.status = ActionOutboxStatus.cancelled.value
    entry.cancelled_at = utc_now()
    entry.next_attempt_at = None
    _append_event(
        db,
        entry,
        event_type="cancelled",
        previous_status=previous,
        new_status=entry.status,
        attempt_number=entry.attempt_count,
        note=reason,
    )
    db.commit()
    db.refresh(entry)
    return entry


def dispatch_ready_actions(
    db: Session,
    *,
    limit: int,
) -> list[AgentActionOutbox]:
    ready = (
        db.query(AgentActionOutbox)
        .filter(
            AgentActionOutbox.status == ActionOutboxStatus.queued.value,
            or_(
                AgentActionOutbox.next_attempt_at.is_(None),
                AgentActionOutbox.next_attempt_at <= utc_now(),
            ),
        )
        .order_by(AgentActionOutbox.created_at.asc())
        .limit(limit)
        .all()
    )
    return [dispatch_action_outbox_entry(db, entry.id) for entry in ready]


def requeue_stale_dispatches(
    db: Session,
    *,
    stale_after_seconds: int = 300,
) -> int:
    cutoff = utc_now() - timedelta(seconds=stale_after_seconds)
    stale = (
        db.query(AgentActionOutbox)
        .filter(
            AgentActionOutbox.status == ActionOutboxStatus.dispatching.value,
            AgentActionOutbox.claimed_at.is_not(None),
            AgentActionOutbox.claimed_at <= cutoff,
        )
        .all()
    )
    for entry in stale:
        previous = entry.status
        attempts_exhausted = entry.attempt_count >= entry.max_attempts
        entry.status = (
            ActionOutboxStatus.dead_lettered.value
            if attempts_exhausted
            else ActionOutboxStatus.queued.value
        )
        entry.claimed_at = None
        entry.next_attempt_at = None
        entry.last_error = (
            "A stale dispatch claim exhausted the bounded attempts."
            if attempts_exhausted
            else "A stale dispatch claim was recovered."
        )
        _append_event(
            db,
            entry,
            event_type=("dead_lettered" if attempts_exhausted else "stale_requeued"),
            previous_status=previous,
            new_status=entry.status,
            attempt_number=entry.attempt_count,
            note=entry.last_error,
        )
    if stale:
        db.commit()
    return len(stale)
