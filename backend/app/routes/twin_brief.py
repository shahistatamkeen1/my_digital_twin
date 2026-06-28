from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import generate_daily_brief
from app.services.master_context_service import get_master_context

router = APIRouter()


@router.get("/")
def get_twin_brief(db: Session = Depends(get_db)):
    context = get_master_context(db)

    weekly_wins = []

    career_context = context.get("career_context", {})
    finance_context = context.get("finance_context", {})
    health_context = context.get("health_context", {})

    application_summary = career_context.get("application_summary", {})
    finance_summary = finance_context.get("tracked_summary", {})
    health_summary = health_context.get("habit_summary", {})

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

    context["weekly_wins"] = weekly_wins

    result = generate_daily_brief(context)

    if not isinstance(result, dict):
        result = {}

    result.setdefault("greeting", "Good morning")
    result.setdefault("overview", "")
    result.setdefault("career_focus", "")
    result.setdefault("finance_focus", "")
    result.setdefault("health_focus", "")
    result.setdefault("highest_roi_action", context["focus_scores"]["highest_roi_focus"])
    result.setdefault("today_best_action", context["focus_scores"]["highest_roi_focus"])
    result.setdefault("risk_alert", "")
    result.setdefault("today_plan", [])
    result.setdefault("weekly_wins", weekly_wins)
    result.setdefault("closing_note", "")

    result["focus_scores"] = context["focus_scores"]

    return result