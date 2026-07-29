from __future__ import annotations

from dataclasses import dataclass
import json
from time import perf_counter
from typing import Any, Callable

from sqlalchemy.orm import Session

from app.agents.contracts import (
    AgentContribution,
    AgentExecutionProvider,
    AgentName,
)
from app.config import settings
from app.services.ai_service import AIUsage
from app.services.career_agent import run_career_agent_with_metadata
from app.services.career_context_service import get_career_context
from app.services.finance_agent import run_finance_agent_with_metadata
from app.services.finance_context_service import get_finance_context
from app.services.health_agent import run_health_agent_with_metadata
from app.services.health_context_service import get_health_context
from app.services.learning_agent import run_learning_agent_with_metadata
from app.services.learning_context_service import get_learning_context


@dataclass(frozen=True)
class AgentInvocationResult:
    payload: dict[str, Any]
    usage: AIUsage
    duration_ms: int
    provider: str
    model: str | None
    fallback_used: bool = False


ContextLoader = Callable[[Session], dict[str, Any]]
AIExecutor = Callable[[str, dict[str, Any]], tuple[dict[str, Any], AIUsage]]


_CONTEXT_LOADERS: dict[AgentName, ContextLoader] = {
    AgentName.career: get_career_context,
    AgentName.finance: get_finance_context,
    AgentName.health: get_health_context,
    AgentName.learning: get_learning_context,
}

_AI_EXECUTORS: dict[AgentName, AIExecutor] = {
    AgentName.career: run_career_agent_with_metadata,
    AgentName.finance: run_finance_agent_with_metadata,
    AgentName.health: run_health_agent_with_metadata,
    AgentName.learning: run_learning_agent_with_metadata,
}


def load_agent_context(db: Session, agent_name: AgentName) -> dict[str, Any]:
    """Load only the authenticated user's context required by one domain."""

    return _CONTEXT_LOADERS[agent_name](db)


def context_manifest(context: dict[str, Any]) -> dict[str, Any]:
    """Return a non-sensitive execution audit summary instead of raw context."""

    record_counts: dict[str, int] = {}
    for key, value in context.items():
        if isinstance(value, list):
            record_counts[key] = len(value)
        elif isinstance(value, dict):
            record_counts[key] = len(value)

    encoded = json.dumps(context, default=str, separators=(",", ":"))
    return {
        "sections": sorted(context),
        "record_counts": record_counts,
        "serialized_bytes": len(encoded.encode("utf-8")),
    }


def _deterministic_payload(
    agent_name: AgentName,
    goal: str,
    context: dict[str, Any],
) -> dict[str, Any]:
    manifest = context_manifest(context)
    display = agent_name.value.title()

    recommendations = {
        AgentName.career: [
            "Prioritize the highest-impact career action connected to the goal.",
            "Review current applications, target-role gaps, and roadmap progress.",
        ],
        AgentName.finance: [
            "Compare the goal with current income, expenses, and savings capacity.",
            "Create a measurable monthly budget checkpoint before committing funds.",
        ],
        AgentName.health: [
            "Protect sleep, hydration, and sustainable workload while pursuing the goal.",
            "Use recent habit data to choose one routine improvement for this week.",
        ],
        AgentName.learning: [
            "Convert the goal into one measurable skill milestone.",
            "Schedule a focused learning block and verify progress at the next checkpoint.",
        ],
    }

    return AgentContribution(
        summary=(
            f"{display} Twin completed a deterministic local verification "
            f"analysis for: {goal}"
        ),
        key_data_points=[
            f"Loaded context sections: {', '.join(manifest['sections']) or 'none'}.",
            f"Context audit size: {manifest['serialized_bytes']} bytes.",
        ],
        recommendations=recommendations[agent_name],
        risks=[
            "Deterministic verification does not replace configured AI analysis.",
        ],
        score=70,
        confidence=100,
    ).model_dump()


def calculate_estimated_cost(usage: AIUsage) -> float:
    input_cost = (
        usage.prompt_tokens
        / 1_000_000
        * settings.agent_input_cost_per_million
    )
    output_cost = (
        usage.completion_tokens
        / 1_000_000
        * settings.agent_output_cost_per_million
    )
    return round(input_cost + output_cost, 8)


def invoke_agent(
    agent_name: AgentName,
    goal: str,
    context: dict[str, Any],
    provider: AgentExecutionProvider,
    *,
    fallback_used: bool = False,
) -> AgentInvocationResult:
    started = perf_counter()

    if provider == AgentExecutionProvider.deterministic:
        payload = _deterministic_payload(agent_name, goal, context)
        usage = AIUsage(model="deterministic-local")
        resolved_provider = AgentExecutionProvider.deterministic.value
    else:
        payload, usage = _AI_EXECUTORS[agent_name](goal, context)
        if payload.get("error"):
            raise RuntimeError(str(payload["error"]))
        payload = AgentContribution.model_validate(payload).model_dump()
        resolved_provider = "openai"

    duration_ms = max(0, round((perf_counter() - started) * 1000))
    return AgentInvocationResult(
        payload=payload,
        usage=usage,
        duration_ms=duration_ms,
        provider=resolved_provider,
        model=usage.model,
        fallback_used=fallback_used,
    )
