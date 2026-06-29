from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import generate_twin_notifications
from app.services.master_context_service import get_master_context

router = APIRouter()


def normalize_priority(priority: str) -> str:
    if not priority:
        return "Medium"

    priority = str(priority).strip().lower()

    if priority in ["critical", "urgent"]:
        return "Critical"
    if priority in ["high", "important"]:
        return "High"
    if priority in ["medium", "normal"]:
        return "Medium"
    if priority in ["low", "info", "informational"]:
        return "Low"

    return "Medium"


def get_priority_score(priority: str, category: str, focus_scores: dict) -> int:
    priority = normalize_priority(priority)
    category = str(category).strip().lower()

    base_scores = {
        "Critical": 95,
        "High": 80,
        "Medium": 55,
        "Low": 30,
    }

    score = base_scores.get(priority, 55)

    highest_roi_focus = str(focus_scores.get("highest_roi_focus", "")).lower()

    if category in highest_roi_focus:
        score += 10

    if category == "career":
        value = focus_scores.get("career_score", 100)
    elif category == "finance":
        value = focus_scores.get("finance_score", 100)
    elif category == "health":
        value = focus_scores.get("health_score", 100)
    else:
        value = 100

    if value < 60:
        score += 10
    elif value < 75:
        score += 5

    return min(score, 100)


def get_priority_level(priority_score: int) -> str:
    if priority_score >= 90:
        return "Critical"
    if priority_score >= 75:
        return "High"
    if priority_score >= 50:
        return "Medium"
    return "Low"


def get_action_fields(category: str):
    category = str(category).strip().lower()

    if category == "career":
        return {
            "action_label": "Open Career Twin",
            "action_type": "navigate",
            "action_url": "/career",
        }

    if category == "finance":
        return {
            "action_label": "Open Finance Twin",
            "action_type": "navigate",
            "action_url": "/finance",
        }

    if category == "health":
        return {
            "action_label": "Open Health Twin",
            "action_type": "navigate",
            "action_url": "/health",
        }

    if category in ["personal memory", "memory", "personal"]:
        return {
            "action_label": "Open Personal Memory",
            "action_type": "navigate",
            "action_url": "/personal-memory",
        }

    return {
        "action_label": "Open Twin Hub",
        "action_type": "navigate",
        "action_url": "/twin-hub",
    }


@router.get("/")
def get_twin_notifications(db: Session = Depends(get_db)):
    context = get_master_context(db)
    focus_scores = context["focus_scores"]

    result = generate_twin_notifications(context)

    if not isinstance(result, dict):
        result = {}

    result.setdefault("summary", "Your Digital Twin notifications are ready.")
    result.setdefault("notifications", [])

    cleaned_notifications = []

    for item in result.get("notifications", []):
        if not isinstance(item, dict):
            continue

        category = item.get("category", "Orchestrator")
        priority = normalize_priority(item.get("priority", "Medium"))

        priority_score = get_priority_score(
            priority=priority,
            category=category,
            focus_scores=focus_scores,
        )

        priority_level = get_priority_level(priority_score)
        action_fields = get_action_fields(category)

        cleaned_notifications.append(
            {
                "category": category,
                "priority": priority_level,
                "priority_score": priority_score,
                "title": item.get("title", "Notification"),
                "message": item.get("message", ""),
                "recommended_action": item.get("recommended_action", ""),
                **action_fields,
            }
        )

    cleaned_notifications.sort(
        key=lambda item: item["priority_score"],
        reverse=True,
    )

    return {
        "summary": result.get("summary", "Your Digital Twin notifications are ready."),
        "notifications": cleaned_notifications,
        "focus_scores": focus_scores,
    }