from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import ask_ai, ask_ai_json
from app.services.career_context_service import get_career_context
from app.services.finance_context_service import get_finance_context
from app.services.health_context_service import get_health_context

router = APIRouter()


class TwinOrchestratorRequest(BaseModel):
    message: str


def route_twins(message: str):
    system_prompt = """
You are the Twin Router inside My Digital Twin.

Decide which specialized twins are needed to answer the user's question.

Available twins:
- career: jobs, resume, interviews, applications, skills, career goals, salary growth
- finance: income, expenses, savings, budget, financial goals, affordability, spending decisions
- health: sleep, hydration, workouts, wellness, mood, habits, diet preferences, fitness goals

Return ONLY valid JSON.
"""

    user_prompt = f"""
User Question:
{message}

Return JSON exactly like this:
{{
  "use_career": true,
  "use_finance": true,
  "use_health": true,
  "reason": "short reason"
}}
"""

    result = ask_ai_json(system_prompt, user_prompt, temperature=0.1)

    return {
        "use_career": bool(result.get("use_career", False)),
        "use_finance": bool(result.get("use_finance", False)),
        "use_health": bool(result.get("use_health", False)),
        "reason": result.get("reason", ""),
    }


@router.post("/")
def twin_orchestrator(
    request: TwinOrchestratorRequest,
    db: Session = Depends(get_db)
):
    routing = route_twins(request.message)

    career_context = None
    finance_context = None
    health_context = None

    if routing["use_career"]:
        career_context = get_career_context(db)

    if routing["use_finance"]:
        finance_context = get_finance_context(db)

    if routing["use_health"]:
        health_context = get_health_context(db)

    if (
        not routing["use_career"]
        and not routing["use_finance"]
        and not routing["use_health"]
    ):
        career_context = get_career_context(db)
        finance_context = get_finance_context(db)
        health_context = get_health_context(db)

        routing["use_career"] = True
        routing["use_finance"] = True
        routing["use_health"] = True
        routing["reason"] = "No specific twin was selected, so all available twins were used."

    system_prompt = """
You are the Twin Orchestrator inside My Digital Twin.

You coordinate specialized AI twins and provide one polished response.

Available twins:
- Career Twin
- Finance Twin
- Health Twin

Rules:
- Do not dump raw context or list internal JSON fields.
- Explain insights naturally.
- If using Career Twin data, mention it as "Career Twin".
- If using Finance Twin data, mention it as "Finance Twin".
- If using Health Twin data, mention it as "Health Twin".
- If using multiple twins, clearly combine the reasoning.
- Be practical, clear, and action-focused.
- Do not provide legal, tax, investment, medical, immigration, or guaranteed financial advice.
- For health topics, do not provide diagnosis, treatment, medication advice, or emergency advice.
- End with 3 clear next steps when appropriate.

Finance context meaning:
- planned_monthly_income comes from Finance Memory.
- tracked_income comes from recorded transactions.
- target_monthly_savings comes from Finance Memory.
- tracked_savings comes from transactions.
Do not confuse planned income with tracked income.
"""

    user_prompt = f"""
User Question:
{request.message}

Twin Router Decision:
{routing}

Career Twin Context:
{career_context if career_context else "Career Twin was not selected for this question."}

Finance Twin Context:
{finance_context if finance_context else "Finance Twin was not selected for this question."}

Health Twin Context:
{health_context if health_context else "Health Twin was not selected for this question."}
"""

    reply = ask_ai(system_prompt, user_prompt, temperature=0.4)

    return {
        "reply": reply,
        "routing": routing,
        "used_career_context": routing["use_career"],
        "used_finance_context": routing["use_finance"],
        "used_health_context": routing["use_health"],
    }