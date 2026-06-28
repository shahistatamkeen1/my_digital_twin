from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import generate_twin_notifications
from app.services.master_context_service import get_master_context

router = APIRouter()


@router.get("/")
def get_twin_notifications(db: Session = Depends(get_db)):
    context = get_master_context(db)

    result = generate_twin_notifications(context)

    if not isinstance(result, dict):
        result = {}

    result.setdefault("summary", "Your Digital Twin notifications are ready.")
    result.setdefault("notifications", [])

    cleaned_notifications = []

    for item in result.get("notifications", []):
        if not isinstance(item, dict):
            continue

        cleaned_notifications.append(
            {
                "category": item.get("category", "Orchestrator"),
                "priority": item.get("priority", "Medium"),
                "title": item.get("title", "Notification"),
                "message": item.get("message", ""),
                "recommended_action": item.get("recommended_action", ""),
            }
        )

    priority_order = {
        "High": 1,
        "Medium": 2,
        "Low": 3,
    }

    cleaned_notifications.sort(
        key=lambda item: priority_order.get(item["priority"], 4)
    )

    return {
        "summary": result.get("summary", "Your Digital Twin notifications are ready."),
        "notifications": cleaned_notifications,
        "focus_scores": context["focus_scores"],
    }