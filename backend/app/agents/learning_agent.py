from app.agents.base import validate_agent_definition
from app.agents.contracts import AgentDefinition, AgentName


LEARNING_AGENT = validate_agent_definition(
    AgentDefinition(
        name=AgentName.learning,
        display_name="Learning Twin",
        description=(
            "Plans skills, certifications, study schedules, courses, and "
            "professional-development roadmaps."
        ),
        supported_tasks=[
            "skill-gap planning",
            "certification planning",
            "course and resource planning",
            "study schedule creation",
            "learning roadmap design",
        ],
        required_context=[
            "learning memory",
            "learning progress",
            "current and target skill levels",
            "certification goals",
        ],
        timeout_seconds=45,
        max_retries=2,
        estimated_cost_category="standard",
    )
)
