from datetime import datetime
from sqlalchemy.orm import Session

from app.services.personal_memory_service import get_personal_memory_context
from app.services.career_context_service import get_career_context
from app.services.finance_context_service import get_finance_context
from app.services.health_context_service import get_health_context
from app.services.twin_score_service import (
    calculate_career_score,
    calculate_finance_score,
    calculate_health_score,
    get_highest_roi_focus,
)


def get_master_context(db: Session):
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

    return {
        "generated_at": datetime.now().isoformat(),
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