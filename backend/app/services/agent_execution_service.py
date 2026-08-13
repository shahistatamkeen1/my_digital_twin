from __future__ import annotations

from concurrent.futures import Future, ThreadPoolExecutor
from dataclasses import dataclass
import logging
from time import perf_counter, sleep
from typing import Any

from sqlalchemy.orm import Session

from app.agents.contracts import (
    AgentExecutionProvider,
    AgentName,
    AgentRunExecuteRequest,
    AgentRunStatus,
    AgentStepStatus,
)
from app.agents.executor import (
    AgentInvocationResult,
    calculate_estimated_cost,
    context_manifest,
    invoke_agent,
    load_agent_context,
)
from app.api.exceptions import APIError
from app.config import settings
from app.models.agent_run import AgentRun, AgentStep
from app.models.common import utc_now
from app.services.agent_checkpoint_service import (
    append_workflow_event,
    checkpoint_approval,
    mark_checkpoint_terminal,
    pause_for_next_approval,
    require_pending_checkpoint,
)
from app.services.agent_synthesis_service import (
    SynthesisResult,
    synthesize_agent_results,
)


logger = logging.getLogger("my_digital_twin.agent_execution")


@dataclass(frozen=True)
class StepOutcome:
    step_id: int
    agent_name: AgentName
    result: AgentInvocationResult | None
    attempts: int
    error: str | None


ACTIVE_RUN_STATUSES = {
    AgentRunStatus.running.value,
    AgentRunStatus.awaiting_approval.value,
    AgentRunStatus.resuming.value,
    AgentRunStatus.synthesizing.value,
}

TERMINAL_RUN_STATUSES = {
    AgentRunStatus.completed.value,
    AgentRunStatus.partially_completed.value,
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


def _validate_provider(provider: AgentExecutionProvider) -> None:
    if (
        provider == AgentExecutionProvider.deterministic
        and not settings.agent_allow_deterministic_provider
    ):
        raise APIError(
            status_code=403,
            code="DETERMINISTIC_PROVIDER_DISABLED",
            message=(
                "Deterministic agent execution is disabled in this environment."
            ),
        )

    if (
        provider == AgentExecutionProvider.configured
        and not settings.openai_api_key
    ):
        raise APIError(
            status_code=503,
            code="AGENT_AI_NOT_CONFIGURED",
            message=(
                "OPENAI_API_KEY is not configured. Configure the AI provider "
                "or use deterministic execution in an allowed local environment."
            ),
        )


def _provider_for_call(
    requested: AgentExecutionProvider,
) -> AgentExecutionProvider:
    return (
        AgentExecutionProvider.configured
        if requested == AgentExecutionProvider.configured
        else AgentExecutionProvider.deterministic
    )


def _invoke_with_retries(
    *,
    step_id: int,
    agent_name: AgentName,
    goal: str,
    context: dict[str, Any],
    provider: AgentExecutionProvider,
    max_retries: int,
    allow_fallback: bool,
) -> StepOutcome:
    last_error: str | None = None
    attempts = 0

    for attempt in range(1, max_retries + 2):
        attempts = attempt
        try:
            result = invoke_agent(
                agent_name,
                goal,
                context,
                provider,
            )
            return StepOutcome(
                step_id=step_id,
                agent_name=agent_name,
                result=result,
                attempts=attempts,
                error=None,
            )
        except Exception as exc:  # noqa: BLE001 - captured as workflow state
            last_error = f"{type(exc).__name__}: {exc}"
            logger.warning(
                "Agent step attempt failed",
                extra={
                    "agent_name": agent_name.value,
                    "step_id": step_id,
                    "attempt": attempt,
                    "max_attempts": max_retries + 1,
                },
            )
            if attempt <= max_retries and settings.agent_retry_backoff_seconds:
                sleep(settings.agent_retry_backoff_seconds * attempt)

    if (
        allow_fallback
        and provider != AgentExecutionProvider.deterministic
        and settings.agent_allow_deterministic_provider
    ):
        try:
            fallback = invoke_agent(
                agent_name,
                goal,
                context,
                AgentExecutionProvider.deterministic,
                fallback_used=True,
            )
            return StepOutcome(
                step_id=step_id,
                agent_name=agent_name,
                result=fallback,
                attempts=attempts,
                error=last_error,
            )
        except Exception as exc:  # pragma: no cover - deterministic is pure
            last_error = f"{last_error}; fallback: {type(exc).__name__}: {exc}"

    return StepOutcome(
        step_id=step_id,
        agent_name=agent_name,
        result=None,
        attempts=attempts,
        error=last_error or "Agent execution failed.",
    )


def _prepare_run(
    db: Session,
    run: AgentRun,
    request: AgentRunExecuteRequest,
) -> dict[int, dict[str, Any]]:
    if run.status not in {
        AgentRunStatus.planned.value,
        AgentRunStatus.resuming.value,
    }:
        raise APIError(
            status_code=409,
            code="AGENT_RUN_NOT_EXECUTABLE",
            message="Only planned or resuming agent runs can be executed.",
            details={"status": run.status},
        )

    provider = _provider_for_call(request.provider)
    _validate_provider(provider)

    run.status = AgentRunStatus.running.value
    run.execution_provider = provider.value
    run.started_at = utc_now()
    run.completed_at = None
    run.error_message = None
    run.result_payload = None
    run.prompt_tokens = 0
    run.completion_tokens = 0
    run.total_tokens = 0
    run.estimated_cost = 0.0
    run.duration_ms = 0
    run.fallback_count = 0

    contexts: dict[int, dict[str, Any]] = {}
    for step in run.steps:
        if step.status in {
            AgentStepStatus.skipped.value,
            AgentStepStatus.rejected.value,
            AgentStepStatus.cancelled.value,
        }:
            continue
        agent_name = AgentName(step.agent_name)
        context = load_agent_context(db, agent_name)
        contexts[step.id] = context
        step.status = AgentStepStatus.running.value
        step.started_at = utc_now()
        step.completed_at = None
        step.output_payload = None
        step.error_message = None
        step.attempt_count = 0
        step.provider = provider.value
        step.model = None
        step.fallback_used = False
        step.prompt_tokens = 0
        step.completion_tokens = 0
        step.total_tokens = 0
        step.estimated_cost = 0.0
        step.duration_ms = 0
        step.input_payload = {
            **dict(step.input_payload or {}),
            "execution_provider": provider.value,
            "context_manifest": context_manifest(context),
        }

    db.commit()
    db.refresh(run)
    return contexts


def _execute_sequential(
    run: AgentRun,
    contexts: dict[int, dict[str, Any]],
    request: AgentRunExecuteRequest,
) -> list[StepOutcome]:
    outcomes: list[StepOutcome] = []
    provider = _provider_for_call(request.provider)

    for step in run.steps:
        if step.id not in contexts:
            continue
        outcomes.append(
            _invoke_with_retries(
                step_id=step.id,
                agent_name=AgentName(step.agent_name),
                goal=run.goal,
                context=contexts[step.id],
                provider=provider,
                max_retries=step.max_retries,
                allow_fallback=request.allow_fallback,
            )
        )
    return outcomes


def _execute_parallel(
    run: AgentRun,
    contexts: dict[int, dict[str, Any]],
    request: AgentRunExecuteRequest,
) -> list[StepOutcome]:
    provider = _provider_for_call(request.provider)
    max_workers = min(
        settings.agent_max_parallel_workers,
        max(1, len(run.steps)),
    )
    executor = ThreadPoolExecutor(
        max_workers=max_workers,
        thread_name_prefix="digital-twin-agent",
    )
    futures: list[tuple[AgentStep, Future[StepOutcome]]] = []

    try:
        for step in run.steps:
            if step.id not in contexts:
                continue
            future = executor.submit(
                _invoke_with_retries,
                step_id=step.id,
                agent_name=AgentName(step.agent_name),
                goal=run.goal,
                context=contexts[step.id],
                provider=provider,
                max_retries=step.max_retries,
                allow_fallback=request.allow_fallback,
            )
            futures.append((step, future))

        outcomes: list[StepOutcome] = []
        for step, future in futures:
            try:
                outcome = future.result(
                    timeout=max(
                        step.timeout_seconds * (step.max_retries + 1),
                        step.timeout_seconds,
                    )
                )
            except TimeoutError:
                future.cancel()
                outcome = StepOutcome(
                    step_id=step.id,
                    agent_name=AgentName(step.agent_name),
                    result=None,
                    attempts=max(1, step.max_retries + 1),
                    error=(
                        f"Agent step exceeded its {step.timeout_seconds}-second "
                        "attempt timeout."
                    ),
                )
            outcomes.append(outcome)
        return outcomes
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def _apply_step_outcomes(
    db: Session,
    run: AgentRun,
    outcomes: list[StepOutcome],
) -> tuple[dict[AgentName, dict[str, Any]], list[str], int]:
    contributions: dict[AgentName, dict[str, Any]] = {}
    failed_agents: list[str] = []
    fallback_count = 0

    by_id = {step.id: step for step in run.steps}
    for outcome in outcomes:
        step = by_id[outcome.step_id]
        step.attempt_count = outcome.attempts
        step.completed_at = utc_now()

        if outcome.result is None:
            step.status = AgentStepStatus.failed.value
            step.error_message = outcome.error
            failed_agents.append(outcome.agent_name.value)
            continue

        result = outcome.result
        step.status = AgentStepStatus.completed.value
        step.output_payload = result.payload
        step.error_message = outcome.error if result.fallback_used else None
        step.provider = result.provider
        step.model = result.model
        step.fallback_used = result.fallback_used
        step.prompt_tokens = result.usage.prompt_tokens
        step.completion_tokens = result.usage.completion_tokens
        step.total_tokens = result.usage.total_tokens
        step.estimated_cost = calculate_estimated_cost(result.usage)
        step.duration_ms = result.duration_ms
        contributions[outcome.agent_name] = result.payload
        fallback_count += int(result.fallback_used)

    db.commit()
    db.refresh(run)
    return contributions, failed_agents, fallback_count


def _cancelled_during_execution(db: Session, run: AgentRun) -> bool:
    db.refresh(run)
    return run.status == AgentRunStatus.cancelled.value


def _apply_synthesis(
    run: AgentRun,
    synthesis: SynthesisResult,
    *,
    failed_agents: list[str],
    fallback_count: int,
) -> None:
    synthesis_cost = calculate_estimated_cost(synthesis.usage)
    step_prompt = sum(step.prompt_tokens for step in run.steps)
    step_completion = sum(step.completion_tokens for step in run.steps)
    step_total = sum(step.total_tokens for step in run.steps)
    step_cost = sum(step.estimated_cost for step in run.steps)
    step_duration = sum(step.duration_ms for step in run.steps)

    run.prompt_tokens = step_prompt + synthesis.usage.prompt_tokens
    run.completion_tokens = step_completion + synthesis.usage.completion_tokens
    run.total_tokens = step_total + synthesis.usage.total_tokens
    run.estimated_cost = round(step_cost + synthesis_cost, 8)
    run.duration_ms = step_duration + synthesis.duration_ms
    run.fallback_count = fallback_count + int(synthesis.fallback_used)
    run.result_payload = {
        "unified_plan": synthesis.payload,
        "execution": {
            "provider": run.execution_provider,
            "synthesis_provider": synthesis.provider,
            "synthesis_model": synthesis.usage.model,
            "synthesis_duration_ms": synthesis.duration_ms,
            "synthesis_tokens": synthesis.usage.total_tokens,
            "failed_agents": failed_agents,
            "fallback_count": run.fallback_count,
        },
    }


def _execute_agent_run_internal(
    db: Session,
    run: AgentRun,
    request: AgentRunExecuteRequest,
) -> AgentRun:
    if pause_for_next_approval(db, run, request) is not None:
        return run

    started = perf_counter()
    contexts = _prepare_run(db, run, request)
    append_workflow_event(
        db,
        run,
        event_type="workflow_started",
        event_payload={
            "execution_mode": run.execution_mode,
            "provider": run.execution_provider,
        },
    )
    db.commit()

    logger.info(
        "Agent run execution started",
        extra={
            "agent_run_id": run.id,
            "execution_mode": run.execution_mode,
            "selected_agents": run.selected_agents,
            "provider": run.execution_provider,
        },
    )

    if (
        request.force_sequential
        or run.execution_mode in {"single_agent", "sequential"}
    ):
        outcomes = _execute_sequential(run, contexts, request)
    else:
        outcomes = _execute_parallel(run, contexts, request)

    if _cancelled_during_execution(db, run):
        return run

    contributions, failed_agents, fallback_count = _apply_step_outcomes(
        db,
        run,
        outcomes,
    )

    # Preserve contributions from an intentionally skipped approval-gated step.
    # Skipped steps are represented in the audit trail rather than synthesized
    # as if the sensitive action had executed.
    if _cancelled_during_execution(db, run):
        return run

    if not contributions:
        run.status = AgentRunStatus.failed.value
        run.error_message = "All executable selected agents failed or were skipped."
        run.completed_at = utc_now()
        run.duration_ms = max(0, round((perf_counter() - started) * 1000))
        append_workflow_event(
            db,
            run,
            event_type="workflow_failed",
            note=run.error_message,
        )
        db.commit()
        db.refresh(run)
        return run

    if failed_agents and not request.allow_partial:
        run.status = AgentRunStatus.failed.value
        run.error_message = (
            "One or more agents failed and partial completion was disabled."
        )
        run.result_payload = {
            "agent_contributions": {
                name.value: payload for name, payload in contributions.items()
            },
            "execution": {"failed_agents": failed_agents},
        }
        run.completed_at = utc_now()
        run.duration_ms = max(0, round((perf_counter() - started) * 1000))
        append_workflow_event(
            db,
            run,
            event_type="workflow_failed",
            note=run.error_message,
        )
        db.commit()
        db.refresh(run)
        return run

    run.status = AgentRunStatus.synthesizing.value
    append_workflow_event(
        db,
        run,
        event_type="workflow_synthesizing",
    )
    db.commit()
    db.refresh(run)

    provider = _provider_for_call(request.provider)
    synthesis: SynthesisResult | None = None
    synthesis_error: str | None = None

    try:
        synthesis = synthesize_agent_results(
            run.goal,
            contributions,
            provider,
            include_weekly_plan=run.include_weekly_plan,
        )
    except Exception as exc:  # noqa: BLE001 - persisted as workflow state
        synthesis_error = f"{type(exc).__name__}: {exc}"
        if (
            request.allow_fallback
            and provider != AgentExecutionProvider.deterministic
            and settings.agent_allow_deterministic_provider
        ):
            synthesis = synthesize_agent_results(
                run.goal,
                contributions,
                AgentExecutionProvider.deterministic,
                include_weekly_plan=run.include_weekly_plan,
                fallback_used=True,
            )

    if _cancelled_during_execution(db, run):
        return run

    if synthesis is None:
        run.status = AgentRunStatus.partially_completed.value
        run.error_message = f"Synthesis failed: {synthesis_error}"
        run.result_payload = {
            "agent_contributions": {
                name.value: payload for name, payload in contributions.items()
            },
            "execution": {
                "failed_agents": failed_agents,
                "synthesis_error": synthesis_error,
            },
        }
    else:
        _apply_synthesis(
            run,
            synthesis,
            failed_agents=failed_agents,
            fallback_count=fallback_count,
        )
        run.status = (
            AgentRunStatus.partially_completed.value
            if failed_agents
            else AgentRunStatus.completed.value
        )
        run.error_message = (
            f"Completed with failed agents: {', '.join(failed_agents)}"
            if failed_agents
            else None
        )

    run.completed_at = utc_now()
    run.duration_ms = max(
        run.duration_ms,
        max(0, round((perf_counter() - started) * 1000)),
    )
    append_workflow_event(
        db,
        run,
        event_type=(
            "workflow_completed"
            if run.status == AgentRunStatus.completed.value
            else "workflow_failed"
        ),
        event_payload={
            "status": run.status,
            "failed_agents": failed_agents,
        },
        note=run.error_message,
    )
    db.commit()
    db.refresh(run)

    logger.info(
        "Agent run execution finished",
        extra={
            "agent_run_id": run.id,
            "status": run.status,
            "total_tokens": run.total_tokens,
            "estimated_cost": run.estimated_cost,
            "duration_ms": run.duration_ms,
            "failed_agents": failed_agents,
        },
    )
    return run


def execute_agent_run(
    db: Session,
    run_id: int,
    request: AgentRunExecuteRequest,
) -> AgentRun:
    run = _require_owned_run(db, run_id)
    if run.status != AgentRunStatus.planned.value:
        raise APIError(
            status_code=409,
            code="AGENT_RUN_NOT_EXECUTABLE",
            message="Only planned agent runs can be executed.",
            details={"status": run.status},
        )
    return _execute_agent_run_internal(db, run, request)


def resume_agent_run(db: Session, run_id: int) -> AgentRun:
    run = _require_owned_run(db, run_id)
    if run.status != AgentRunStatus.awaiting_approval.value:
        raise APIError(
            status_code=409,
            code="AGENT_RUN_NOT_AWAITING_APPROVAL",
            message="Only workflows awaiting approval can be resumed.",
            details={"status": run.status},
        )

    checkpoint = require_pending_checkpoint(db, run)
    approval = checkpoint_approval(db, checkpoint)

    if checkpoint.resume_count > 0:
        raise APIError(
            status_code=409,
            code="AGENT_RUN_ALREADY_RESUMED",
            message="This workflow checkpoint has already been consumed.",
        )

    if approval.status == "pending":
        raise APIError(
            status_code=409,
            code="APPROVAL_DECISION_REQUIRED",
            message="Approve or reject the pending action before resuming.",
            details={"approval_id": approval.id},
        )

    if approval.status == "expired":
        checkpoint.status = "expired"
        run.status = AgentRunStatus.failed.value
        run.error_message = "Required approval expired before workflow resume."
        run.completed_at = utc_now()
        append_workflow_event(
            db,
            run,
            event_type="approval_expired",
            step_id=checkpoint.agent_step_id,
            approval_id=approval.id,
            note=run.error_message,
        )
        append_workflow_event(
            db,
            run,
            event_type="workflow_failed",
            note=run.error_message,
        )
        db.commit()
        db.refresh(run)
        raise APIError(
            status_code=409,
            code="APPROVAL_EXPIRED",
            message=run.error_message,
        )

    if approval.status == "cancelled":
        mark_checkpoint_terminal(
            db,
            run,
            checkpoint,
            approval,
            checkpoint_status="cancelled",
            event_type="approval_cancelled",
            step_status=AgentStepStatus.cancelled,
            note=approval.decision_note,
        )
        run.status = AgentRunStatus.cancelled.value
        run.error_message = "Required approval was cancelled."
        run.completed_at = utc_now()
        append_workflow_event(
            db,
            run,
            event_type="workflow_cancelled",
            note=run.error_message,
        )
        db.commit()
        db.refresh(run)
        return run

    if approval.status == "rejected":
        if checkpoint.rejection_policy == "stop_workflow":
            mark_checkpoint_terminal(
                db,
                run,
                checkpoint,
                approval,
                checkpoint_status="skipped",
                event_type="approval_rejected",
                step_status=AgentStepStatus.rejected,
                note=approval.decision_note,
            )
            run.status = AgentRunStatus.cancelled.value
            run.error_message = "Workflow stopped because the required action was rejected."
            run.completed_at = utc_now()
            append_workflow_event(
                db,
                run,
                event_type="workflow_cancelled",
                note=run.error_message,
            )
            db.commit()
            db.refresh(run)
            return run

        mark_checkpoint_terminal(
            db,
            run,
            checkpoint,
            approval,
            checkpoint_status="skipped",
            event_type="approval_rejected",
            step_status=AgentStepStatus.skipped,
            note=approval.decision_note,
        )
        append_workflow_event(
            db,
            run,
            event_type="step_skipped",
            step_id=checkpoint.agent_step_id,
            approval_id=approval.id,
            note="Rejected sensitive action skipped; workflow may continue.",
        )

    elif approval.status == "approved":
        mark_checkpoint_terminal(
            db,
            run,
            checkpoint,
            approval,
            checkpoint_status="resumed",
            event_type="approval_approved",
            step_status=AgentStepStatus.approved,
            note=approval.decision_note,
        )
    else:
        raise APIError(
            status_code=409,
            code="APPROVAL_STATUS_UNSUPPORTED",
            message="The approval is not in a resumable state.",
            details={"status": approval.status},
        )

    run.status = AgentRunStatus.resuming.value
    run.completed_at = None
    append_workflow_event(
        db,
        run,
        event_type="workflow_resumed",
        step_id=checkpoint.agent_step_id,
        approval_id=approval.id,
        event_payload={"checkpoint_id": checkpoint.id},
    )
    db.commit()
    db.refresh(run)

    try:
        execution_request = AgentRunExecuteRequest.model_validate(
            checkpoint.workflow_state.get("execution_request", {})
        )
    except Exception as exc:  # noqa: BLE001
        raise APIError(
            status_code=409,
            code="CHECKPOINT_STATE_INVALID",
            message="The durable checkpoint cannot reconstruct the execution request.",
        ) from exc

    return _execute_agent_run_internal(db, run, execution_request)

def cancel_agent_run(db: Session, run_id: int) -> AgentRun:
    run = _require_owned_run(db, run_id)

    if run.status in TERMINAL_RUN_STATUSES:
        raise APIError(
            status_code=409,
            code="AGENT_RUN_NOT_CANCELLABLE",
            message="A terminal agent run cannot be cancelled.",
            details={"status": run.status},
        )

    run.status = AgentRunStatus.cancelled.value
    run.error_message = "Cancelled by the user."
    run.completed_at = utc_now()

    for step in run.steps:
        if step.status in {
            AgentStepStatus.planned.value,
            AgentStepStatus.running.value,
            AgentStepStatus.awaiting_approval.value,
            AgentStepStatus.approved.value,
            AgentStepStatus.resuming.value,
        }:
            step.status = AgentStepStatus.cancelled.value
            step.error_message = "Cancelled by the user."
            step.completed_at = utc_now()

    append_workflow_event(
        db,
        run,
        event_type="workflow_cancelled",
        note=run.error_message,
    )
    db.commit()
    db.refresh(run)
    return run
