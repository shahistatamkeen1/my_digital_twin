from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.executive_intelligence_service import generate_executive_intelligence

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
    elif category == "learning":
        value = focus_scores.get("learning_score", 100)
    else:
        value = focus_scores.get("overall_score", 100)

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

    if category == "learning":
        return {
            "action_label": "Open Learning Twin",
            "action_type": "navigate",
            "action_url": "/learning",
        }

    if category in ["personal memory", "memory", "personal"]:
        return {
            "action_label": "Open Personal Memory",
            "action_type": "navigate",
            "action_url": "/personal-memory",
        }

    return {
        "action_label": "Open Advisor",
        "action_type": "navigate",
        "action_url": "/digital-twin-advisor",
    }


@router.get("/")
def get_twin_notifications(db: Session = Depends(get_db)):
    executive = generate_executive_intelligence(db)

    advisor = executive.get("advisor_response", {})
    focus_scores = executive.get("focus_scores", {})

    notifications = []

    risk_level = normalize_priority(advisor.get("risk_level", "Medium"))

    for risk in advisor.get("risks", []):
        priority_score = get_priority_score(
            priority=risk_level,
            category="orchestrator",
            focus_scores=focus_scores,
        )

        notifications.append(
            {
                "category": "Orchestrator",
                "priority": get_priority_level(priority_score),
                "priority_score": priority_score,
                "title": "Risk Detected",
                "message": risk,
                "recommended_action": advisor.get("next_best_action", ""),
                **get_action_fields("orchestrator"),
            }
        )

    for action in advisor.get("recommended_actions", []):
        priority_score = get_priority_score(
            priority="High",
            category=str(focus_scores.get("highest_roi_focus", "orchestrator")),
            focus_scores=focus_scores,
        )

        notifications.append(
            {
                "category": focus_scores.get("highest_roi_focus", "Orchestrator"),
                "priority": get_priority_level(priority_score),
                "priority_score": priority_score,
                "title": "Recommended Action",
                "message": action,
                "recommended_action": action,
                **get_action_fields(focus_scores.get("highest_roi_focus", "orchestrator")),
            }
        )

    if advisor.get("next_best_action"):
        priority_score = get_priority_score(
            priority="High",
            category=str(focus_scores.get("highest_roi_focus", "orchestrator")),
            focus_scores=focus_scores,
        )

        notifications.insert(
            0,
            {
                "category": "Executive",
                "priority": get_priority_level(priority_score),
                "priority_score": priority_score,
                "title": "Next Best Action",
                "message": advisor.get("next_best_action", ""),
                "recommended_action": advisor.get("next_best_action", ""),
                **get_action_fields("orchestrator"),
            },
        )

    notifications.sort(
        key=lambda item: item["priority_score"],
        reverse=True,
    )

    return {
        "summary": advisor.get(
            "executive_summary",
            "Your Digital Twin notifications are ready.",
        ),
        "notifications": notifications,
        "focus_scores": focus_scores,
        "agent_analysis": executive.get("agent_analysis", {}),
        "conflict_resolution": executive.get("conflict_resolution", {}),
    }