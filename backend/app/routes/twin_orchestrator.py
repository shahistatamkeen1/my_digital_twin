from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import ask_ai, ask_ai_json
from app.services.master_context_service import get_master_context

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
    master_context = get_master_context(db)

    personal_context = master_context["personal_memory"]

    career_context = (
        master_context["career_context"]
        if routing["use_career"]
        else None
    )

    finance_context = (
        master_context["finance_context"]
        if routing["use_finance"]
        else None
    )

    health_context = (
        master_context["health_context"]
        if routing["use_health"]
        else None
    )

    learning_context = (
        master_context["learning_context"]
        if routing["use_learning"]
        else None
    )

    if (
        not routing["use_career"]
        and not routing["use_finance"]
        and not routing["use_health"]
        and not routing["use_learning"]
    ):
        career_context = master_context["career_context"]
        finance_context = master_context["finance_context"]
        health_context = master_context["health_context"]
        learning_context = master_context["learning_context"]

        routing["use_career"] = True
        routing["use_finance"] = True
        routing["use_health"] = True
        routing["use_learning"] = True
        routing["reason"] = (
            "No specific twin was selected, so all available twins were used."
        )

    focus_scores = master_context["focus_scores"]

    career_score = focus_scores["career_score"]
    finance_score = focus_scores["finance_score"]
    health_score = focus_scores["health_score"]
    learning_score = focus_scores["learning_score"]
    overall_score = focus_scores["overall_score"]
    highest_roi_focus = focus_scores["highest_roi_focus"]

    system_prompt = """
You are the Master Digital Twin Executive Advisor.

You combine:
- Personal Memory
- Career Twin
- Finance Twin
- Health Twin
- Learning Twin

Your job is not to summarize each twin separately.
Your job is to create one unified executive recommendation.

Rules:
- Do not dump raw context or internal JSON.
- Be concise, practical, and action-focused.
- Think like a personal chief of staff.
- Prioritize actions with the highest life impact.
- Connect career, finance, health, and learning together.
- Do not provide legal, tax, investment, medical, immigration, or guaranteed financial advice.
- For health topics, do not provide diagnosis, treatment, medication advice, or emergency advice.
- Highest ROI Action and Weekly Plan must align with the calculated weakest area.

Always respond using this structure:

Executive Summary
Highest ROI Action
Top 3 Priorities
Risks & Bottlenecks
Weekly Action Plan
Expected Outcome
"""

    user_prompt = f"""
Question:
{request.message}

Twin Router Decision:
{routing}

Personal Memory:
{personal_context}

Focus Scores:
Career Score: {career_score}
Finance Score: {finance_score}
Health Score: {health_score}
Learning Score: {learning_score}
Overall Twin Score: {overall_score}

Calculated Highest ROI Focus:
{highest_roi_focus}

Career Twin:
{career_context if career_context else "Career Twin was not selected for this question."}

Finance Twin:
{finance_context if finance_context else "Finance Twin was not selected for this question."}

Health Twin:
{health_context if health_context else "Health Twin was not selected for this question."}

Learning Twin:
{learning_context if learning_context else "Learning Twin was not selected for this question."}

Create an executive-level recommendation.
Identify the single most important thing the user should focus on.
Do not contradict the calculated Highest ROI Focus.
"""

    reply = ask_ai(system_prompt, user_prompt, temperature=0.4)

    return {
        "reply": reply,
        "routing": routing,
        "focus_scores": focus_scores,
        "used_career_context": routing["use_career"],
        "used_finance_context": routing["use_finance"],
        "used_health_context": routing["use_health"],
        "used_learning_context": routing["use_learning"],
    }