from app.agents.base import validate_agent_definition
from app.agents.contracts import AgentDefinition, AgentName


FINANCE_AGENT = validate_agent_definition(
    AgentDefinition(
        name=AgentName.finance,
        display_name="Finance Twin",
        description=(
            "Plans budgets, affordability, expenses, savings goals, and "
            "financial trade-offs without providing regulated advice."
        ),
        supported_tasks=[
            "budget planning",
            "expense and affordability analysis",
            "savings goal planning",
            "relocation cost planning",
            "financial trade-off analysis",
        ],
        required_context=[
            "finance memory",
            "transactions",
            "savings goals",
            "budget summary",
        ],
        timeout_seconds=40,
        max_retries=2,
        estimated_cost_category="standard",
    )
)
