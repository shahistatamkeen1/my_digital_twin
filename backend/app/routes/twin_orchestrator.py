from unittest import result

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import ask_ai_json
from app.services.agent_reasoning_service import run_agent_reasoning

router = APIRouter()


class TwinOrchestratorRequest(BaseModel):
    message: str


def route_twins(message: str):
    system_prompt = """
You are the Twin Router inside My Digital Twin.

Decide which specialized twins are needed to answer the user's question.

Available twins:
- career: jobs, resume, interviews, applications, skills, career goals, salary growth
- finance: income, expenses, savings, budget, investments, financial goals, affordability, spending decisions
- health: sleep, hydration, workouts, wellness, mood, habits, diet preferences, fitness goals
- learning: courses, certifications, skills, study plans, learning roadmap, professional development

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
  "use_learning": true,
  "reason": "short reason"
}}
"""

    result = ask_ai_json(system_prompt, user_prompt, temperature=0.1)

    return {
        "use_career": bool(result.get("use_career", False)),
        "use_finance": bool(result.get("use_finance", False)),
        "use_health": bool(result.get("use_health", False)),
        "use_learning": bool(result.get("use_learning", False)),
        "reason": result.get("reason", ""),
    }


@router.post("/")
def twin_orchestrator(
    request: TwinOrchestratorRequest,
    db: Session = Depends(get_db),
):
    routing = route_twins(request.message)

    reasoning = run_agent_reasoning(
        question=request.message,
        routing=routing,
        db=db,
    )

    return {
        "reply": reasoning["advisor_response"],
        "agent_analysis": reasoning["agent_analysis"],
        "conflict_resolution": reasoning["conflict_resolution"],
        "routing": reasoning["routing"],
        "focus_scores": reasoning["focus_scores"],
        "used_career_context": reasoning["routing"]["use_career"],
        "used_finance_context": reasoning["routing"]["use_finance"],
        "used_health_context": reasoning["routing"]["use_health"],
        "used_learning_context": reasoning["routing"]["use_learning"],
    }