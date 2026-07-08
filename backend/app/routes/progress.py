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

from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from app.services.growth_forecast_service import generate_growth_forecast
from app.services.achievement_service import get_achievements
from app.services.executive_intelligence_service import generate_executive_intelligence

router = APIRouter()


@router.get("/")
def get_progress(db: Session = Depends(get_db)):
    history = get_progress_history(db)
    insights = get_progress_insights(history)
    weekly_report = get_weekly_growth_report(history)
    monthly_scorecard = get_monthly_scorecard(history)
    growth_forecast = generate_growth_forecast(history)
    history = get_progress_history(db)

    latest = history[-1] if history else None

    achievements = get_achievements(latest)

    # ai_review = generate_ai_progress_review(history, insights, weekly_report)
    executive = generate_executive_intelligence(db)
    advisor = executive.get("advisor_response", {})

    ai_review = advisor.get(
    "executive_summary",
    insights.get("executive_review", "Progress review unavailable."),
    )

    executive_recommendations = advisor.get("recommended_actions", [])
    next_best_action = advisor.get("next_best_action", "")
    risk_level = advisor.get("risk_level", "")

    return {
    "history": history,
    "total_snapshots": len(history),
    "latest": history[-1] if history else None,
    "insights": insights,
    "weekly_report": weekly_report,
    "ai_review": ai_review,
    "executive_recommendations": executive_recommendations,
    "next_best_action": next_best_action,
    "risk_level": risk_level,
    "monthly_scorecard": monthly_scorecard,
    "growth_forecast": growth_forecast,
    "achievements": achievements,
    "agent_analysis": executive.get("agent_analysis", {}),
    "conflict_resolution": executive.get("conflict_resolution", {}),
}
    
@router.get("/scorecard-pdf")
def download_scorecard_pdf(db: Session = Depends(get_db)):
    history = get_progress_history(db)
    scorecard = get_monthly_scorecard(history)

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)

    width, height = letter

    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(50, height - 60, "My Digital Twin Monthly Scorecard")

    pdf.setFont("Helvetica", 11)
    pdf.drawString(50, height - 90, "Generated from your Progress Intelligence Center")

    y = height - 140

    if not scorecard.get("available"):
        pdf.setFont("Helvetica", 12)
        pdf.drawString(50, y, scorecard.get("message", "No scorecard available."))
    else:
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(50, y, f"Period: {scorecard.get('period')}")
        y -= 35

        pdf.setFont("Helvetica", 12)
        pdf.drawString(50, y, f"Starting Overall Score: {scorecard.get('starting_overall')}%")
        y -= 25
        pdf.drawString(50, y, f"Current Overall Score: {scorecard.get('current_overall')}%")
        y -= 25
        pdf.drawString(50, y, f"Overall Change: {scorecard.get('overall_change')}%")
        y -= 45

        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(50, y, "Twin Growth Breakdown")
        y -= 30

        pdf.setFont("Helvetica", 12)
        pdf.drawString(50, y, f"Career Change: {scorecard.get('career_change')}%")
        y -= 25
        pdf.drawString(50, y, f"Finance Change: {scorecard.get('finance_change')}%")
        y -= 25
        pdf.drawString(50, y, f"Health Change: {scorecard.get('health_change')}%")
        y -= 25
        pdf.drawString(50, y, f"Learning Change: {scorecard.get('learning_change')}%")
        y -= 45

        latest = scorecard.get("latest_scores", {})

        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(50, y, "Latest Scores")
        y -= 30

        pdf.setFont("Helvetica", 12)
        pdf.drawString(50, y, f"Career: {latest.get('career_score')}%")
        y -= 25
        pdf.drawString(50, y, f"Finance: {latest.get('finance_score')}%")
        y -= 25
        pdf.drawString(50, y, f"Health: {latest.get('health_score')}%")
        y -= 25
        pdf.drawString(50, y, f"Learning: {latest.get('learning_score')}%")
        y -= 25
        pdf.drawString(50, y, f"Overall: {latest.get('overall_score')}%")

    pdf.showPage()
    pdf.save()

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=digital_twin_scorecard.pdf"
        },
    )