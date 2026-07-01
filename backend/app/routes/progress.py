from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.progress_service import (
    get_progress_history,
    get_progress_insights,
    get_weekly_growth_report,
)
from app.services.progress_service import generate_ai_progress_review
from app.services.progress_service import get_monthly_scorecard

router = APIRouter()


@router.get("/")
def get_progress(db: Session = Depends(get_db)):
    history = get_progress_history(db)
    insights = get_progress_insights(history)
    weekly_report = get_weekly_growth_report(history)
    monthly_scorecard = get_monthly_scorecard(history)
    
    # ai_review = generate_ai_progress_review(history, insights, weekly_report)
    ai_review = insights.get("executive_review", "Progress review unavailable.")

    return {
        "history": history,
        "total_snapshots": len(history),
        "latest": history[-1] if history else None,
        "insights": insights,
        "weekly_report": weekly_report,
        "ai_review": ai_review,
        "monthly_scorecard": monthly_scorecard,
    }