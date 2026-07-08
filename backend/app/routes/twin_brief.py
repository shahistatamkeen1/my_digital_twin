from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.master_context_service import get_master_context
from app.services.executive_intelligence_service import generate_executive_intelligence

router = APIRouter()


@router.get("/")
def get_twin_brief(db: Session = Depends(get_db)):
    context = get_master_context(db)
    executive = generate_executive_intelligence(db)

    advisor = executive.get("advisor_response", {})
    focus_scores = executive.get("focus_scores", context.get("focus_scores", {}))

    weekly_wins = []

    career_context = context.get("career_context", {})
    finance_context = context.get("finance_context", {})
    health_context = context.get("health_context", {})
    learning_context = context.get("learning_context", {})

    application_summary = career_context.get("application_summary", {})
    finance_summary = finance_context.get("tracked_summary", {})
    health_summary = health_context.get("habit_summary", {})
    learning_summary = learning_context.get("learning_summary", {})

    if application_summary.get("total_applications", 0) > 0:
        weekly_wins.append(
            f"Tracked {application_summary.get('total_applications')} career applications."
        )

    if finance_summary.get("tracked_savings", 0) > 0:
        weekly_wins.append(
            f"Saved ${finance_summary.get('tracked_savings')} based on tracked transactions."
        )

    if health_summary.get("habit_count", 0) > 0:
        weekly_wins.append(
            f"Logged {health_summary.get('habit_count')} health habit entries."
        )

    if learning_summary.get("completed_goals", 0) > 0:
        weekly_wins.append(
            f"Completed {learning_summary.get('completed_goals')} learning goals."
        )

    return {
        "greeting": "Good morning",
        "overview": advisor.get("executive_summary", ""),
        "career_focus": advisor.get("career_signal", ""),
        "finance_focus": advisor.get("finance_signal", ""),
        "health_focus": advisor.get("health_signal", ""),
        "learning_focus": advisor.get("learning_signal", ""),
        "highest_roi_action": focus_scores.get("highest_roi_focus", ""),
        "today_best_action": advisor.get("next_best_action", ""),
        "risk_alert": advisor.get("risk_level", ""),
        "risks": advisor.get("risks", []),
        "today_plan": advisor.get("recommended_actions", []),
        "weekly_wins": weekly_wins,
        "closing_note": advisor.get("expected_roi", ""),
        "focus_scores": focus_scores,
        "agent_analysis": executive.get("agent_analysis", {}),
        "conflict_resolution": executive.get("conflict_resolution", {}),
    }