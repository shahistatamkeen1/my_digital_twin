import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agent_profile import AgentProfile
from app.models.agent_plan import AgentPlan
from app.models.agent_memory import AgentMemory

router = APIRouter()


def safe_json(value, default):
    try:
        if not value:
            return default
        return json.loads(value)
    except Exception:
        return default


def calculate_prediction(agent_name, profile, active_plan_count, memory_count):
    preferences = safe_json(profile.learned_preferences, {})
    risks = safe_json(profile.recurring_risks, [])

    confidence = profile.confidence_score or 0
    goals = preferences.get("primary_goals", [])

    base_score = confidence

    if memory_count >= 10:
        base_score += 10
    elif memory_count >= 5:
        base_score += 5

    if active_plan_count > 0:
        base_score += 10

    if risks:
        base_score -= min(len(risks) * 3, 15)

    prediction_score = max(0, min(base_score, 95))

    if "Career" in agent_name:
        prediction = "Moderate-to-high chance of stronger job search progress if weekly plan tasks are completed."
        metric = "Career Momentum"
    elif "Finance" in agent_name:
        prediction = "Financial stability can improve if income, expenses, and savings data are updated consistently."
        metric = "Financial Stability"
    elif "Health" in agent_name:
        prediction = "Wellness consistency can improve if sleep, hydration, and workout tracking become regular."
        metric = "Wellness Consistency"
    elif "Learning" in agent_name:
        prediction = "Skill growth is likely to improve if learning tasks are completed and applied to projects."
        metric = "Learning Momentum"
    else:
        prediction = "Progress is likely to improve with consistent planning and tracking."
        metric = "Overall Momentum"

    return {
        "agent_name": agent_name,
        "metric": metric,
        "prediction_score": prediction_score,
        "prediction": prediction,
        "goals_detected": goals,
        "risk_count": len(risks),
        "memory_count": memory_count,
        "active_plan_count": active_plan_count,
    }


@router.get("/")
def get_predictive_insights(db: Session = Depends(get_db)):
    profiles = db.query(AgentProfile).all()

    insights = []

    for profile in profiles:
        memory_count = (
            db.query(AgentMemory)
            .filter(AgentMemory.agent_name == profile.agent_name)
            .count()
        )

        active_plan_count = (
            db.query(AgentPlan)
            .filter(
                AgentPlan.agent_name == profile.agent_name,
                AgentPlan.status == "active",
            )
            .count()
        )

        insights.append(
            calculate_prediction(
                profile.agent_name,
                profile,
                active_plan_count,
                memory_count,
            )
        )

    overall_score = (
        int(sum(item["prediction_score"] for item in insights) / len(insights))
        if insights
        else 0
    )

    return {
        "overall_prediction_score": overall_score,
        "summary": "Predictive insights generated from agent memory, learned profiles, active plans, and risk signals.",
        "insights": insights,
    }