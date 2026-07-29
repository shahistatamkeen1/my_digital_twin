from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from typing import Any

from app.agents.contracts import (
    AgentContribution,
    AgentExecutionProvider,
    AgentName,
    UnifiedAgentPlan,
)
from app.services.ai_service import AIUsage, ask_ai_json_with_metadata


@dataclass(frozen=True)
class SynthesisResult:
    payload: dict[str, Any]
    usage: AIUsage
    duration_ms: int
    provider: str
    fallback_used: bool = False


def _deterministic_synthesis(
    goal: str,
    contributions: dict[AgentName, dict[str, Any]],
    *,
    include_weekly_plan: bool,
) -> dict[str, Any]:
    priorities: list[str] = []
    risks: list[str] = []
    success_metrics: list[str] = []

    for agent_name, raw in contributions.items():
        contribution = AgentContribution.model_validate(raw)
        priorities.extend(contribution.recommendations[:1])
        risks.extend(contribution.risks[:1])
        success_metrics.append(
            f"Complete one measurable {agent_name.value} action before the next checkpoint."
        )

    weekly_plan: list[dict[str, Any]] = []
    if include_weekly_plan:
        for index, (agent_name, raw) in enumerate(contributions.items(), start=1):
            contribution = AgentContribution.model_validate(raw)
            action = (
                contribution.recommendations[0]
                if contribution.recommendations
                else f"Review the {agent_name.value} contribution."
            )
            weekly_plan.append(
                {
                    "week": index,
                    "focus": agent_name.value,
                    "actions": [action],
                }
            )

    plan = UnifiedAgentPlan(
        summary=(
            f"Created a unified local-verification plan for: {goal}. "
            f"{len(contributions)} Digital Twin agents contributed."
        ),
        priorities=priorities,
        weekly_plan=weekly_plan,
        risks=list(dict.fromkeys(risks)),
        success_metrics=success_metrics,
        next_checkpoint="Review progress in seven days.",
        agent_contributions={
            name: AgentContribution.model_validate(payload)
            for name, payload in contributions.items()
        },
    )
    return plan.model_dump(mode="json")


def synthesize_agent_results(
    goal: str,
    contributions: dict[AgentName, dict[str, Any]],
    provider: AgentExecutionProvider,
    *,
    include_weekly_plan: bool,
    fallback_used: bool = False,
) -> SynthesisResult:
    started = perf_counter()

    if provider == AgentExecutionProvider.deterministic:
        payload = _deterministic_synthesis(
            goal,
            contributions,
            include_weekly_plan=include_weekly_plan,
        )
        usage = AIUsage(model="deterministic-local")
        resolved_provider = AgentExecutionProvider.deterministic.value
    else:
        system_prompt = """
You are the Master Digital Twin synthesis engine.

Combine completed Career, Finance, Health, and Learning agent contributions
into one practical cross-domain plan.

Return ONLY valid JSON with this exact structure:
{
  "summary": "A concise integrated summary.",
  "priorities": ["Priority 1", "Priority 2"],
  "weekly_plan": [
    {
      "week": 1,
      "focus": "career",
      "actions": ["Action 1"]
    }
  ],
  "risks": ["Risk 1"],
  "success_metrics": ["Metric 1"],
  "next_checkpoint": "A clear checkpoint date or interval.",
  "agent_contributions": {
    "career": {
      "summary": "",
      "key_data_points": [],
      "recommendations": [],
      "risks": [],
      "score": 0,
      "confidence": 0
    }
  }
}

Rules:
- Preserve the supplied agent contributions accurately.
- Resolve cross-domain conflicts instead of repeating four separate answers.
- Prioritize safe, measurable, and affordable actions.
- Do not diagnose, prescribe, promise financial outcomes, or invent user data.
- Weekly plan may be empty when it was not requested.
"""
        user_prompt = f"""
Goal:
{goal}

Include Weekly Plan:
{include_weekly_plan}

Completed Agent Contributions:
{{
    {", ".join(f'"{name.value}": {payload!r}' for name, payload in contributions.items())}
}}

Create the unified plan.
"""
        response = ask_ai_json_with_metadata(
            system_prompt,
            user_prompt,
            temperature=0.2,
        )
        if response.payload.get("error"):
            raise RuntimeError(str(response.payload["error"]))

        normalized = {
            **response.payload,
            "agent_contributions": {
                name.value: AgentContribution.model_validate(payload).model_dump()
                for name, payload in contributions.items()
            },
        }
        if not include_weekly_plan:
            normalized["weekly_plan"] = []

        payload = UnifiedAgentPlan.model_validate(normalized).model_dump(mode="json")
        usage = response.usage
        resolved_provider = "openai"

    return SynthesisResult(
        payload=payload,
        usage=usage,
        duration_ms=max(0, round((perf_counter() - started) * 1000)),
        provider=resolved_provider,
        fallback_used=fallback_used,
    )
