from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.agents.contracts import (
    AgentRunCreate,
    AgentRunDetail,
    AgentRunStatus,
    AgentRunSummary,
    AgentStepRead,
)
from app.agents.registry import get_agent_definition
from app.agents.router import route_agent_goal
from app.api.exceptions import APIError
from app.models.agent_run import AgentRun, AgentStep


RETRYABLE_RUN_STATUSES = {
    AgentRunStatus.failed.value,
    AgentRunStatus.cancelled.value,
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


def _step_read(step: AgentStep) -> AgentStepRead:
    return AgentStepRead.model_validate(step)


def run_summary(run: AgentRun) -> AgentRunSummary:
    return AgentRunSummary.model_validate(run)


def run_detail(run: AgentRun) -> AgentRunDetail:
    payload = AgentRunSummary.model_validate(run).model_dump()
    payload["steps"] = [_step_read(step) for step in run.steps]
    return AgentRunDetail.model_validate(payload)


def create_agent_run(
    db: Session,
    data: AgentRunCreate,
    *,
    retry_of_run_id: int | None = None,
) -> AgentRun:
    routing = route_agent_goal(data.goal, data.preferred_agents)

    run = AgentRun(
        retry_of_run_id=retry_of_run_id,
        goal=data.goal,
        status=AgentRunStatus.planned.value,
        execution_mode=routing.execution_mode.value,
        selected_agents=[item.value for item in routing.selected_agents],
        preferred_agents=[item.value for item in data.preferred_agents],
        include_weekly_plan=data.include_weekly_plan,
        routing_reason=routing.reason,
        request_payload={
            "context": data.context,
            "matched_keywords": {
                name.value: keywords
                for name, keywords in routing.matched_keywords.items()
            },
        },
        result_payload=None,
        total_tokens=0,
        estimated_cost=0.0,
    )
    db.add(run)
    db.flush()

    for position, agent_name in enumerate(routing.selected_agents, start=1):
        definition = get_agent_definition(agent_name)
        db.add(
            AgentStep(
                agent_run_id=run.id,
                agent_name=agent_name.value,
                step_order=position,
                status="planned",
                input_payload={
                    "goal": data.goal,
                    "required_context": definition.required_context,
                    "include_weekly_plan": data.include_weekly_plan,
                    "request_context": data.context,
                },
                timeout_seconds=definition.timeout_seconds,
                max_retries=definition.max_retries,
                requires_approval=definition.requires_approval,
            )
        )

    db.commit()
    db.refresh(run)
    return run


def get_agent_run(db: Session, run_id: int) -> AgentRun:
    return _require_owned_run(db, run_id)


def retry_agent_run(db: Session, run_id: int) -> AgentRun:
    original = _require_owned_run(db, run_id)

    if original.status not in RETRYABLE_RUN_STATUSES:
        raise APIError(
            status_code=409,
            code="AGENT_RUN_NOT_RETRYABLE",
            message=(
                "Only failed or cancelled agent runs can be retried."
            ),
            details={"status": original.status},
        )

    data = AgentRunCreate(
        goal=original.goal,
        preferred_agents=original.preferred_agents,
        include_weekly_plan=original.include_weekly_plan,
        context={
            **dict(original.request_payload.get("context", {})),
            "retry_source_run_id": original.id,
        },
    )
    return create_agent_run(db, data, retry_of_run_id=original.id)


def delete_agent_run(db: Session, run_id: int) -> None:
    run = _require_owned_run(db, run_id)

    if run.status == AgentRunStatus.running.value:
        raise APIError(
            status_code=409,
            code="AGENT_RUN_ACTIVE",
            message="A running agent workflow cannot be deleted.",
        )

    db.delete(run)
    db.commit()


def serialize_collection_result(
    result: list[AgentRun] | dict[str, Any],
) -> list[dict[str, Any]] | dict[str, Any]:
    if isinstance(result, dict):
        return {
            **result,
            "items": [run_summary(item).model_dump() for item in result["items"]],
        }
    return [run_summary(item).model_dump() for item in result]
