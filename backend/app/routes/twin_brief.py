from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import generate_daily_brief
from app.services.personal_memory_service import get_personal_memory_context
from app.services.career_context_service import get_career_context
from app.services.finance_context_service import get_finance_context
from app.services.health_context_service import get_health_context
from app.routes.twin_orchestrator import (
    calculate_career_score,
    calculate_finance_score,
    calculate_health_score,
    get_highest_roi_focus,
)

router = APIRouter()


@router.get("/")
def get_twin_brief(db: Session = Depends(get_db)):
    personal_context = get_personal_memory_context(db)
    career_context = get_career_context(db)
    finance_context = get_finance_context(db)
    health_context = get_health_context(db)

    career_score = calculate_career_score(career_context)
    finance_score = calculate_finance_score(finance_context)
    health_score = calculate_health_score(health_context)

    overall_score = round((career_score + finance_score + health_score) / 3)

    highest_roi_focus = get_highest_roi_focus(
        career_score,
        finance_score,
        health_score,
    )

    context = {
        "personal_memory": personal_context,
        "career_context": career_context,
        "finance_context": finance_context,
        "health_context": health_context,
        "focus_scores": {
            "career_score": career_score,
            "finance_score": finance_score,
            "health_score": health_score,
            "overall_score": overall_score,
            "highest_roi_focus": highest_roi_focus,
        },
    }

    result = generate_daily_brief(context)

    if not isinstance(result, dict):
        return {
            "greeting": "Good morning",
            "overview": "Your Daily Brief could not be generated. Please try again.",
            "career_focus": "",
            "finance_focus": "",
            "health_focus": "",
            "highest_roi_action": "",
            "risk_alert": "",
            "today_plan": [],
            "closing_note": "",
        }

    result.setdefault("greeting", "Good morning")
    result.setdefault("overview", "")
    result.setdefault("career_focus", "")
    result.setdefault("finance_focus", "")
    result.setdefault("health_focus", "")
    result.setdefault("highest_roi_action", "")
    result.setdefault("risk_alert", "")
    result.setdefault("today_plan", [])
    result.setdefault("closing_note", "")

    return result