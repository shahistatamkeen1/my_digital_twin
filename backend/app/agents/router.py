from __future__ import annotations

import re

from app.agents.contracts import (
    AgentName,
    AgentRoutingDecision,
    ExecutionMode,
)
from app.agents.registry import registered_agent_names


_AGENT_KEYWORDS: dict[AgentName, tuple[str, ...]] = {
    AgentName.career: (
        "application",
        "career",
        "company",
        "employer",
        "interview",
        "job",
        "promotion",
        "recruiter",
        "relocate",
        "relocation",
        "resume",
        "role",
        "salary",
    ),
    AgentName.finance: (
        "afford",
        "budget",
        "cost",
        "debt",
        "expense",
        "finance",
        "financial",
        "income",
        "investment",
        "money",
        "move",
        "relocate",
        "relocation",
        "rent",
        "save",
        "saving",
        "savings",
    ),
    AgentName.health: (
        "burnout",
        "diet",
        "energy",
        "exercise",
        "fitness",
        "habit",
        "health",
        "hydration",
        "mood",
        "sleep",
        "stress",
        "water",
        "wellness",
        "workout",
    ),
    AgentName.learning: (
        "certification",
        "course",
        "education",
        "exam",
        "learn",
        "learning",
        "prepare",
        "roadmap",
        "skill",
        "study",
        "training",
    ),
}


def _contains_keyword(text: str, keyword: str) -> bool:
    pattern = rf"(?<![a-z0-9]){re.escape(keyword)}(?![a-z0-9])"
    return re.search(pattern, text) is not None


def route_agent_goal(
    goal: str,
    preferred_agents: list[AgentName] | None = None,
) -> AgentRoutingDecision:
    normalized_goal = " ".join(goal.lower().split())
    preferred = list(dict.fromkeys(preferred_agents or []))

    matched_keywords: dict[AgentName, list[str]] = {}
    selected: list[AgentName] = []

    for agent_name in registered_agent_names():
        matches = [
            keyword
            for keyword in _AGENT_KEYWORDS[agent_name]
            if _contains_keyword(normalized_goal, keyword)
        ]
        if matches:
            matched_keywords[agent_name] = matches
            selected.append(agent_name)

    for agent_name in preferred:
        if agent_name not in selected:
            selected.append(agent_name)

    selected = [
        agent_name
        for agent_name in registered_agent_names()
        if agent_name in selected
    ]

    if not selected:
        selected = list(registered_agent_names())
        reason = (
            "No domain-specific signal was detected, so all enabled twins "
            "were selected for a safe cross-domain plan."
        )
    else:
        signal_agents = [name.value for name in matched_keywords]
        preferred_only = [
            name.value for name in preferred if name not in matched_keywords
        ]
        reason_parts: list[str] = []
        if signal_agents:
            reason_parts.append(
                "Matched domain signals for " + ", ".join(signal_agents)
            )
        if preferred_only:
            reason_parts.append(
                "included preferred agents " + ", ".join(preferred_only)
            )
        reason = "; ".join(reason_parts) + "."

    execution_mode = (
        ExecutionMode.single_agent
        if len(selected) == 1
        else ExecutionMode.parallel_then_synthesize
    )

    return AgentRoutingDecision(
        primary_goal=goal,
        selected_agents=selected,
        execution_mode=execution_mode,
        reason=reason,
        matched_keywords=matched_keywords,
    )
