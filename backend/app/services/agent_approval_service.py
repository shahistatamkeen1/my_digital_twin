from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.api.exceptions import APIError
from app.models.agent_approval import AgentApproval, AgentApprovalEvent
from app.models.agent_run import AgentRun, AgentStep
from app.models.common import utc_now
from app.schemas.agent_approval import (
    AgentApprovalCreate,
    AgentApprovalDecision,
    AgentApprovalDetail,
    AgentApprovalEventRead,
    AgentApprovalSummary,
    ApprovalStatus,
)


TERMINAL_RUN_STATUSES = {
    "completed",
    "partially_completed",
    "failed",
    "cancelled",
}


def _require_owned_run(db: Session, run_id: int) -> AgentRun:
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if run is None:
        raise APIError(
            status_code=404,
            code="AGENT_RUN_NOT_FOUND",
            message="The requested agent run was not found.",
        )
    return run


def _require_owned_step(
    db: Session,
    *,
    run_id: int,
    step_id: int,
) -> AgentStep:
    step = (
        db.query(AgentStep)
        .filter(
            AgentStep.id == step_id,
            AgentStep.agent_run_id == run_id,
        )
        .first()
    )
    if step is None:
        raise APIError(
            status_code=404,
            code="AGENT_STEP_NOT_FOUND",
            message="The requested agent step was not found for this run.",
        )
    return step


def _require_owned_approval(db: Session, approval_id: int) -> AgentApproval:
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
    _expire_if_needed(db, approval)
    return approval


def _append_event(
    db: Session,
    approval: AgentApproval,
    *,
    event_type: str,
    previous_status: str | None,
    new_status: str,
    note: str | None = None,
    event_payload: dict[str, Any] | None = None,
) -> None:
    db.add(
        AgentApprovalEvent(
            approval_id=approval.id,
            event_type=event_type,
            previous_status=previous_status,
            new_status=new_status,
            note=note,
            event_payload=event_payload or {},
        )
    )


def _normalized_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _expire_if_needed(
    db: Session,
    approval: AgentApproval,
) -> bool:
    if approval.status != ApprovalStatus.pending.value:
        return False
    if approval.expires_at is None:
        return False
    if _normalized_utc(approval.expires_at) > utc_now():
        return False

    previous = approval.status
    approval.status = ApprovalStatus.expired.value
    approval.decision_note = "Approval expired before a decision was recorded."
    approval.decided_at = utc_now()
    _append_event(
        db,
        approval,
        event_type=ApprovalStatus.expired.value,
        previous_status=previous,
        new_status=approval.status,
        note=approval.decision_note,
    )
    db.commit()
    db.refresh(approval)
    return True


def expire_owned_pending_approvals(db: Session) -> int:
    pending = (
        db.query(AgentApproval)
        .filter(
            AgentApproval.status == ApprovalStatus.pending.value,
            AgentApproval.expires_at.is_not(None),
            AgentApproval.expires_at <= utc_now(),
        )
        .all()
    )
    count = 0
    for approval in pending:
        if _expire_if_needed(db, approval):
            count += 1
    return count


def approval_summary(approval: AgentApproval) -> AgentApprovalSummary:
    return AgentApprovalSummary.model_validate(approval)


def approval_detail(approval: AgentApproval) -> AgentApprovalDetail:
    payload = AgentApprovalSummary.model_validate(approval).model_dump()
    payload["events"] = [
        AgentApprovalEventRead.model_validate(event)
        for event in approval.events
    ]
    return AgentApprovalDetail.model_validate(payload)


def serialize_approval_collection(
    result: list[AgentApproval] | dict[str, Any],
) -> list[dict[str, Any]] | dict[str, Any]:
    if isinstance(result, dict):
        return {
            **result,
            "items": [
                approval_summary(item).model_dump()
                for item in result["items"]
            ],
        }
    return [approval_summary(item).model_dump() for item in result]


def create_agent_approval(
    db: Session,
    data: AgentApprovalCreate,
) -> AgentApproval:
    run = _require_owned_run(db, data.agent_run_id)
    if run.status in TERMINAL_RUN_STATUSES:
        raise APIError(
            status_code=409,
            code="APPROVAL_RUN_TERMINAL",
            message="Approvals cannot be requested for a terminal workflow.",
            details={"run_status": run.status},
        )

    if data.agent_step_id is not None:
        _require_owned_step(
            db,
            run_id=run.id,
            step_id=data.agent_step_id,
        )

    duplicate_query = db.query(AgentApproval).filter(
        AgentApproval.agent_run_id == run.id,
        AgentApproval.action_type == data.action_type.value,
        AgentApproval.status == ApprovalStatus.pending.value,
    )
    if data.agent_step_id is None:
        duplicate_query = duplicate_query.filter(
            AgentApproval.agent_step_id.is_(None)
        )
    else:
        duplicate_query = duplicate_query.filter(
            AgentApproval.agent_step_id == data.agent_step_id
        )

    duplicate = duplicate_query.first()
    if duplicate is not None:
        _expire_if_needed(db, duplicate)
        if duplicate.status == ApprovalStatus.pending.value:
            raise APIError(
                status_code=409,
                code="APPROVAL_ALREADY_PENDING",
                message=(
                    "A pending approval already exists for this run, step, "
                    "and action type."
                ),
                details={"approval_id": duplicate.id},
            )

    now = utc_now()
    expires_at = (
        now + timedelta(minutes=data.expires_in_minutes)
        if data.expires_in_minutes is not None
        else None
    )
    approval = AgentApproval(
        agent_run_id=run.id,
        agent_step_id=data.agent_step_id,
        action_type=data.action_type.value,
        action_summary=data.action_summary,
        proposed_payload=data.proposed_payload,
        status=ApprovalStatus.pending.value,
        requested_at=now,
        expires_at=expires_at,
    )
    db.add(approval)
    db.flush()
    _append_event(
        db,
        approval,
        event_type="requested",
        previous_status=None,
        new_status=ApprovalStatus.pending.value,
        event_payload={
            "action_type": data.action_type.value,
            "agent_run_id": run.id,
            "agent_step_id": data.agent_step_id,
            "expires_at": expires_at.isoformat() if expires_at else None,
        },
    )
    db.commit()
    db.refresh(approval)
    return approval


def get_agent_approval(db: Session, approval_id: int) -> AgentApproval:
    return _require_owned_approval(db, approval_id)


def _require_pending(
    db: Session,
    approval: AgentApproval,
) -> None:
    if _expire_if_needed(db, approval):
        raise APIError(
            status_code=409,
            code="APPROVAL_EXPIRED",
            message="The approval expired before a decision was recorded.",
        )
    if approval.status != ApprovalStatus.pending.value:
        raise APIError(
            status_code=409,
            code="APPROVAL_NOT_PENDING",
            message="Only pending approvals can receive a decision.",
            details={"status": approval.status},
        )


def approve_agent_approval(
    db: Session,
    approval_id: int,
    data: AgentApprovalDecision,
) -> AgentApproval:
    approval = _require_owned_approval(db, approval_id)
    _require_pending(db, approval)

    previous = approval.status
    approval.status = ApprovalStatus.approved.value
    approval.decision_note = data.decision_note
    approval.decision_payload = (
        data.decision_payload
        if data.decision_payload is not None
        else dict(approval.proposed_payload or {})
    )
    approval.decided_at = utc_now()
    _append_event(
        db,
        approval,
        event_type=ApprovalStatus.approved.value,
        previous_status=previous,
        new_status=approval.status,
        note=approval.decision_note,
        event_payload={
            "decision_payload": approval.decision_payload,
        },
    )
    db.commit()
    db.refresh(approval)
    return approval


def reject_agent_approval(
    db: Session,
    approval_id: int,
    data: AgentApprovalDecision,
) -> AgentApproval:
    approval = _require_owned_approval(db, approval_id)
    _require_pending(db, approval)

    previous = approval.status
    approval.status = ApprovalStatus.rejected.value
    approval.decision_note = data.decision_note
    approval.decision_payload = data.decision_payload
    approval.decided_at = utc_now()
    _append_event(
        db,
        approval,
        event_type=ApprovalStatus.rejected.value,
        previous_status=previous,
        new_status=approval.status,
        note=approval.decision_note,
        event_payload={
            "decision_payload": approval.decision_payload,
        },
    )
    db.commit()
    db.refresh(approval)
    return approval


def cancel_agent_approval(
    db: Session,
    approval_id: int,
    data: AgentApprovalDecision,
) -> AgentApproval:
    approval = _require_owned_approval(db, approval_id)
    _require_pending(db, approval)

    previous = approval.status
    approval.status = ApprovalStatus.cancelled.value
    approval.decision_note = data.decision_note
    approval.decision_payload = None
    approval.decided_at = utc_now()
    _append_event(
        db,
        approval,
        event_type=ApprovalStatus.cancelled.value,
        previous_status=previous,
        new_status=approval.status,
        note=approval.decision_note,
    )
    db.commit()
    db.refresh(approval)
    return approval
