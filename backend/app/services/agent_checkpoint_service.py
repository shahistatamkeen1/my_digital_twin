from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.agents.contracts import AgentRunExecuteRequest, AgentRunStatus, AgentStepStatus
from app.api.exceptions import APIError
from app.models.agent_approval import AgentApproval
from app.models.agent_checkpoint import AgentCheckpoint, AgentWorkflowEvent
from app.models.agent_run import AgentRun, AgentStep
from app.models.common import utc_now
from app.schemas.agent_approval import AgentApprovalCreate, ApprovalActionType
from app.schemas.agent_checkpoint import RejectionPolicy, WorkflowEventRead
from app.services.agent_approval_service import create_agent_approval, get_agent_approval


SENSITIVE_ACTIONS = {item.value for item in ApprovalActionType}


def append_workflow_event(
    db: Session,
    run: AgentRun,
    *,
    event_type: str,
    step_id: int | None = None,
    approval_id: int | None = None,
    event_payload: dict[str, Any] | None = None,
    note: str | None = None,
) -> AgentWorkflowEvent:
    event = AgentWorkflowEvent(
        agent_run_id=run.id,
        agent_step_id=step_id,
        approval_id=approval_id,
        event_type=event_type,
        event_payload=event_payload or {},
        note=note,
    )
    db.add(event)
    return event


def workflow_timeline(db: Session, run_id: int) -> list[WorkflowEventRead]:
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if run is None:
        raise APIError(
            status_code=404,
            code="AGENT_RUN_NOT_FOUND",
            message="The requested agent run was not found.",
        )
    return [
        WorkflowEventRead.model_validate(item)
        for item in run.workflow_events
    ]


def _approval_actions(run: AgentRun) -> dict[str, Any]:
    context = dict((run.request_payload or {}).get("context", {}))
    raw = context.get("approval_actions", {})
    return raw if isinstance(raw, dict) else {}


def _approval_resolutions(run: AgentRun) -> dict[str, Any]:
    payload = dict(run.request_payload or {})
    raw = payload.get("approval_resolutions", {})
    return raw if isinstance(raw, dict) else {}


def _gate_for_step(run: AgentRun, step: AgentStep) -> dict[str, Any] | None:
    actions = _approval_actions(run)
    raw = actions.get(step.agent_name)
    if not isinstance(raw, dict):
        return None

    action_type = str(raw.get("action_type", "")).strip()
    if action_type not in SENSITIVE_ACTIONS:
        return None

    summary = " ".join(str(raw.get("action_summary", "")).split())
    if len(summary) < 5:
        raise APIError(
            status_code=422,
            code="APPROVAL_ACTION_INVALID",
            message=(
                f"Approval action for {step.agent_name} must include an "
                "action_summary with at least five characters."
            ),
        )

    policy_value = str(
        raw.get("rejection_policy", RejectionPolicy.skip_and_continue.value)
    )
    try:
        rejection_policy = RejectionPolicy(policy_value)
    except ValueError as exc:
        raise APIError(
            status_code=422,
            code="APPROVAL_REJECTION_POLICY_INVALID",
            message="Unsupported approval rejection policy.",
            details={"rejection_policy": policy_value},
        ) from exc

    proposed_payload = raw.get("proposed_payload", {})
    if not isinstance(proposed_payload, dict):
        raise APIError(
            status_code=422,
            code="APPROVAL_PAYLOAD_INVALID",
            message="proposed_payload must be a JSON object.",
        )

    expires = raw.get("expires_in_minutes", 1440)
    if expires is not None:
        try:
            expires = int(expires)
        except (TypeError, ValueError) as exc:
            raise APIError(
                status_code=422,
                code="APPROVAL_EXPIRY_INVALID",
                message="expires_in_minutes must be an integer or null.",
            ) from exc

    return {
        "action_type": action_type,
        "action_summary": summary,
        "proposed_payload": proposed_payload,
        "expires_in_minutes": expires,
        "rejection_policy": rejection_policy.value,
    }


def pause_for_next_approval(
    db: Session,
    run: AgentRun,
    request: AgentRunExecuteRequest,
) -> AgentCheckpoint | None:
    resolutions = _approval_resolutions(run)

    for step in sorted(run.steps, key=lambda item: item.step_order):
        gate = _gate_for_step(run, step)
        if gate is None:
            continue

        resolution_key = str(step.id)
        if resolution_key in resolutions:
            continue

        existing = (
            db.query(AgentCheckpoint)
            .filter(
                AgentCheckpoint.agent_run_id == run.id,
                AgentCheckpoint.agent_step_id == step.id,
            )
            .order_by(AgentCheckpoint.id.desc())
            .first()
        )
        if existing is not None and existing.status == "pending":
            run.status = AgentRunStatus.awaiting_approval.value
            step.status = AgentStepStatus.awaiting_approval.value
            db.commit()
            db.refresh(run)
            return existing

        approval = create_agent_approval(
            db,
            AgentApprovalCreate(
                agent_run_id=run.id,
                agent_step_id=step.id,
                action_type=ApprovalActionType(gate["action_type"]),
                action_summary=gate["action_summary"],
                proposed_payload=gate["proposed_payload"],
                expires_in_minutes=gate["expires_in_minutes"],
            ),
        )

        execution_key = f"run:{run.id}:step:{step.id}:approval:v1"
        checkpoint = AgentCheckpoint(
            agent_run_id=run.id,
            agent_step_id=step.id,
            approval_id=approval.id,
            checkpoint_type="approval_gate",
            execution_key=execution_key,
            status="pending",
            rejection_policy=gate["rejection_policy"],
            workflow_state={
                "execution_request": request.model_dump(mode="json"),
                "step_order": step.step_order,
                "agent_name": step.agent_name,
                "action_type": gate["action_type"],
            },
            checkpoint_version=1,
            resume_count=0,
        )
        db.add(checkpoint)

        run.status = AgentRunStatus.awaiting_approval.value
        run.completed_at = None
        run.error_message = None
        step.status = AgentStepStatus.awaiting_approval.value
        step.completed_at = None

        append_workflow_event(
            db,
            run,
            event_type="approval_requested",
            step_id=step.id,
            approval_id=approval.id,
            event_payload={
                "action_type": gate["action_type"],
                "rejection_policy": gate["rejection_policy"],
            },
        )
        append_workflow_event(
            db,
            run,
            event_type="workflow_paused",
            step_id=step.id,
            approval_id=approval.id,
            note="Workflow paused pending explicit user approval.",
        )
        db.commit()
        db.refresh(checkpoint)
        db.refresh(run)
        return checkpoint

    return None


def require_pending_checkpoint(db: Session, run: AgentRun) -> AgentCheckpoint:
    checkpoint = (
        db.query(AgentCheckpoint)
        .filter(
            AgentCheckpoint.agent_run_id == run.id,
            AgentCheckpoint.status == "pending",
        )
        .order_by(AgentCheckpoint.id.asc())
        .first()
    )
    if checkpoint is None:
        raise APIError(
            status_code=409,
            code="AGENT_CHECKPOINT_NOT_FOUND",
            message="No pending durable checkpoint exists for this workflow.",
        )
    return checkpoint


def checkpoint_approval(db: Session, checkpoint: AgentCheckpoint) -> AgentApproval:
    if checkpoint.approval_id is None:
        raise APIError(
            status_code=409,
            code="CHECKPOINT_APPROVAL_MISSING",
            message="The durable checkpoint is not linked to an approval.",
        )
    return get_agent_approval(db, checkpoint.approval_id)


def persist_resolution(
    run: AgentRun,
    *,
    checkpoint: AgentCheckpoint,
    approval: AgentApproval,
) -> None:
    payload = dict(run.request_payload or {})
    resolutions = dict(payload.get("approval_resolutions", {}))
    resolutions[str(checkpoint.agent_step_id)] = {
        "checkpoint_id": checkpoint.id,
        "approval_id": approval.id,
        "status": approval.status,
        "decided_at": (
            approval.decided_at.isoformat()
            if approval.decided_at is not None
            else None
        ),
    }
    payload["approval_resolutions"] = resolutions
    run.request_payload = payload


def mark_checkpoint_terminal(
    db: Session,
    run: AgentRun,
    checkpoint: AgentCheckpoint,
    approval: AgentApproval,
    *,
    checkpoint_status: str,
    event_type: str,
    step_status: AgentStepStatus,
    note: str | None = None,
) -> None:
    if checkpoint.resume_count > 0 or checkpoint.status != "pending":
        raise APIError(
            status_code=409,
            code="AGENT_RUN_ALREADY_RESUMED",
            message="This workflow checkpoint has already been consumed.",
        )

    checkpoint.status = checkpoint_status
    checkpoint.resume_count += 1
    checkpoint.resumed_at = utc_now()
    checkpoint.resume_payload = {
        "approval_status": approval.status,
        "decision_payload": approval.decision_payload,
        "decision_note": approval.decision_note,
    }

    if checkpoint.agent_step_id is not None:
        step = (
            db.query(AgentStep)
            .filter(AgentStep.id == checkpoint.agent_step_id)
            .first()
        )
        if step is not None:
            step.status = step_status.value
            if step_status in {AgentStepStatus.rejected, AgentStepStatus.skipped}:
                step.completed_at = utc_now()

    persist_resolution(run, checkpoint=checkpoint, approval=approval)
    append_workflow_event(
        db,
        run,
        event_type=event_type,
        step_id=checkpoint.agent_step_id,
        approval_id=approval.id,
        note=note,
        event_payload={
            "checkpoint_id": checkpoint.id,
            "approval_status": approval.status,
            "rejection_policy": checkpoint.rejection_policy,
        },
    )
