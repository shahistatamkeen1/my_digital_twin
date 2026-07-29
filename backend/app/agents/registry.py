from __future__ import annotations

from app.agents.career_agent import CAREER_AGENT
from app.agents.contracts import AgentDefinition, AgentName
from app.agents.finance_agent import FINANCE_AGENT
from app.agents.health_agent import HEALTH_AGENT
from app.agents.learning_agent import LEARNING_AGENT


_AGENT_REGISTRY: dict[AgentName, AgentDefinition] = {
    definition.name: definition
    for definition in (
        CAREER_AGENT,
        FINANCE_AGENT,
        HEALTH_AGENT,
        LEARNING_AGENT,
    )
}


def list_agent_definitions(*, enabled_only: bool = True) -> list[AgentDefinition]:
    definitions = list(_AGENT_REGISTRY.values())
    if enabled_only:
        definitions = [item for item in definitions if item.enabled]
    return [item.model_copy(deep=True) for item in definitions]


def get_agent_definition(name: AgentName | str) -> AgentDefinition:
    resolved = name if isinstance(name, AgentName) else AgentName(name)
    return _AGENT_REGISTRY[resolved].model_copy(deep=True)


def registered_agent_names() -> tuple[AgentName, ...]:
    return tuple(_AGENT_REGISTRY)
