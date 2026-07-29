from fastapi import APIRouter

from app.agents.contracts import AgentDefinition
from app.agents.registry import list_agent_definitions


router = APIRouter()


@router.get(
    "/",
    response_model=list[AgentDefinition],
    summary="List enabled Digital Twin agents",
)
def get_agents() -> list[AgentDefinition]:
    return list_agent_definitions(enabled_only=True)
