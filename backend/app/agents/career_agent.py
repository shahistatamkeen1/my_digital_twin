from app.agents.base import validate_agent_definition
from app.agents.contracts import AgentDefinition, AgentName


CAREER_AGENT = validate_agent_definition(
    AgentDefinition(
        name=AgentName.career,
        display_name="Career Twin",
        description=(
            "Plans job-search, resume, interview, application, compensation, "
            "and career-growth actions."
        ),
        supported_tasks=[
            "job search strategy",
            "resume and ATS improvement",
            "interview preparation",
            "application planning",
            "career goal and compensation planning",
        ],
        required_context=[
            "career memory",
            "resume context",
            "applications",
            "career roadmap",
        ],
        timeout_seconds=45,
        max_retries=2,
        estimated_cost_category="standard",
    )
)
