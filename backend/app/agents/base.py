from __future__ import annotations

from app.agents.contracts import AgentDefinition


def validate_agent_definition(definition: AgentDefinition) -> AgentDefinition:
    """Return a validated immutable-style definition for registry use."""

    if not definition.supported_tasks:
        raise ValueError(f"{definition.name.value} must declare supported tasks.")
    if not definition.required_context:
        raise ValueError(f"{definition.name.value} must declare required context.")
    return definition
