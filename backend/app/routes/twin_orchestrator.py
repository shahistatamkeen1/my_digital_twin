from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import ask_ai, ask_ai_json
from app.services.career_context_service import get_career_context
from app.services.finance_context_service import get_finance_context
from app.services.health_context_service import get_health_context
from app.services.personal_memory_service import get_personal_memory_context

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


def calculate_career_score(career_context):
    if not career_context:
        return 0

    score = 0

    memory = career_context.get("memory", {})
    application_summary = career_context.get("application_summary", {})
    roadmap_summary = career_context.get("roadmap_summary", {})

    if memory.get("career_goal"):
        score += 15

    if memory.get("target_role"):
        score += 15

    if memory.get("current_skills"):
        score += 10

    if memory.get("skills_to_learn"):
        score += 10

    total_applications = application_summary.get("total_applications", 0)
    applied = application_summary.get("applied", 0)
    interviews = application_summary.get("interviews", 0)

    score += min(total_applications * 5, 20)
    score += min(applied * 5, 15)
    score += min(interviews * 10, 15)

    roadmap_progress = roadmap_summary.get("progress", 0)
    score += min(round(roadmap_progress * 0.1), 10)

    return min(score, 100)


def calculate_finance_score(finance_context):
    if not finance_context:
        return 0

    score = 0

    memory = finance_context.get("finance_memory", {})
    summary = finance_context.get("tracked_summary", {})
    goals = finance_context.get("savings_goals", [])

    planned_income = memory.get("planned_monthly_income", 0)
    target_savings = memory.get("target_monthly_savings", 0)
    financial_goal = memory.get("financial_goal", "")
    budget_preference = memory.get("budget_preference", "")

    tracked_income = summary.get("tracked_income", 0)
    tracked_expenses = summary.get("tracked_expenses", 0)
    tracked_savings = summary.get("tracked_savings", 0)

    if planned_income > 0:
        score += 20

    if target_savings > 0:
        score += 15

    if financial_goal:
        score += 15

    if budget_preference:
        score += 10

    if tracked_income > 0:
        score += 15

    if tracked_income > 0:
        savings_rate = (tracked_savings / tracked_income) * 100

        if savings_rate >= 30:
            score += 20
        elif savings_rate >= 15:
            score += 15
        elif savings_rate >= 5:
            score += 10

    if tracked_expenses > 0:
        score += 5

    if len(goals) > 0:
        score += 10

    return min(score, 100)


def calculate_health_score(health_context):
    if not health_context:
        return 0

    score = 0

    memory = health_context.get("health_memory", {})
    habit_summary = health_context.get("habit_summary", {})

    health_goal = memory.get("health_goal", "")
    diet_preference = memory.get("diet_preference", "")
    fitness_level = memory.get("fitness_level", "")

    sleep_goal = memory.get("sleep_goal_hours", 8)
    water_goal = memory.get("water_goal_cups", 8)
    workout_goal = memory.get("workout_goal_minutes", 30)

    avg_sleep = habit_summary.get("avg_sleep", 0)
    avg_water = habit_summary.get("avg_water", 0)
    avg_workout = habit_summary.get("avg_workout", 0)
    habit_count = habit_summary.get("habit_count", 0)

    if health_goal:
        score += 15

    if diet_preference:
        score += 10

    if fitness_level:
        score += 10

    if habit_count > 0:
        score += 15

    if sleep_goal > 0:
        score += min(round((avg_sleep / sleep_goal) * 20), 20)

    if water_goal > 0:
        score += min(round((avg_water / water_goal) * 15), 15)

    if workout_goal > 0:
        score += min(round((avg_workout / workout_goal) * 20), 20)

    return min(score, 100)


def get_highest_roi_focus(career_score, finance_score, health_score):
    scores = {
        "Career": career_score,
        "Finance": finance_score,
        "Health": health_score,
    }

    lowest_area = min(scores, key=scores.get)

    if lowest_area == "Career":
        return "Career growth has the biggest opportunity right now. Focus on skill building, applications, and interview readiness."

    if lowest_area == "Finance":
        return "Financial stability has the biggest opportunity right now. Focus on tracking expenses, savings goals, and budget discipline."

    return "Health sustainability has the biggest opportunity right now. Focus on sleep, hydration, workouts, and daily wellness habits."


@router.post("/")
def twin_orchestrator(
    request: TwinOrchestratorRequest,
    db: Session = Depends(get_db)
):
    routing = route_twins(request.message)

    personal_context = get_personal_memory_context(db)

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

    career_score = calculate_career_score(career_context)
    finance_score = calculate_finance_score(finance_context)
    health_score = calculate_health_score(health_context)

    overall_score = round(
        (career_score + finance_score + health_score) / 3
    )

    highest_roi_focus = get_highest_roi_focus(
        career_score,
        finance_score,
        health_score
    )

    system_prompt = """
You are the Master Digital Twin Executive Advisor.

You combine:
- Personal Memory
- Career Twin
- Finance Twin
- Health Twin

Your job is not to summarize each twin separately.
Your job is to create one unified executive recommendation.

Use Personal Memory for:
- user's name
- location
- timezone
- current status
- daily schedule
- long-term goals
- communication style
- life priorities

Use Career Twin for:
- job search
- applications
- career goals
- skills
- resume
- interview readiness
- salary growth

Use Finance Twin for:
- planned monthly income
- tracked income
- expenses
- savings
- target monthly savings
- budget
- investments
- affordability decisions

Use Health Twin for:
- sleep
- hydration
- workout habits
- wellness goals
- diet preferences
- health sustainability

Finance context meaning:
- planned_monthly_income comes from Finance Memory.
- tracked_income comes from recorded transactions.
- target_monthly_savings comes from Finance Memory.
- tracked_savings comes from transactions.
Do not confuse planned income with tracked income.

Rules:
- Do not dump raw context or internal JSON.
- Be concise, practical, and action-focused.
- Think like a personal chief of staff.
- Prioritize actions with the highest life impact.
- Connect career, finance, and health together.
- Do not provide legal, tax, investment, medical, immigration, or guaranteed financial advice.
- For health topics, do not provide diagnosis, treatment, medication advice, or emergency advice.

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
Overall Twin Score: {overall_score}

Calculated Highest ROI Focus:
{highest_roi_focus}

Career Twin:
{career_context if career_context else "Career Twin was not selected for this question."}

Finance Twin:
{finance_context if finance_context else "Finance Twin was not selected for this question."}

Health Twin:
{health_context if health_context else "Health Twin was not selected for this question."}

IMPORTANT:

The weakest area is:
{highest_roi_focus}

Your Highest ROI Action and Weekly Plan
must align with the weakest area.

Do not contradict the calculated focus.

Create an executive-level recommendation.
Identify the single most important thing the user should focus on.

Prioritize:
1. Career growth
2. Financial stability
3. Health sustainability

Output:
Executive Summary
Highest ROI Action
Top 3 Priorities
Risks & Bottlenecks
Weekly Action Plan
Expected Outcome
"""

    reply = ask_ai(system_prompt, user_prompt, temperature=0.4)

    return {
        "reply": reply,
        "routing": routing,
        "focus_scores": {
            "career_score": career_score,
            "finance_score": finance_score,
            "health_score": health_score,
            "overall_score": overall_score,
            "highest_roi_focus": highest_roi_focus,
        },
        "used_career_context": routing["use_career"],
        "used_finance_context": routing["use_finance"],
        "used_health_context": routing["use_health"],
    }