from app.agents.base import validate_agent_definition
from app.agents.contracts import AgentDefinition, AgentName


HEALTH_AGENT = validate_agent_definition(
    AgentDefinition(
        name=AgentName.health,
        display_name="Health Twin",
        description=(
            "Plans sustainable wellness, sleep, hydration, exercise, mood, "
            "and routine actions without diagnosing or treating conditions."
        ),
        supported_tasks=[
            "habit planning",
            "sleep and energy planning",
            "hydration and workout planning",
            "wellness routine design",
            "burnout-risk reduction",
        ],
        required_context=[
            "health memory",
            "recent habits",
            "wellness goals",
            "routine constraints",
        ],
        timeout_seconds=40,
        max_retries=2,
        estimated_cost_category="standard",
    )
)
