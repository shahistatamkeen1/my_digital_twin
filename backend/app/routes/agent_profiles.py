import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agent_profile import AgentProfile
from app.services.profile_learning_service import update_all_agent_profiles

router = APIRouter()


def safe_json(value, default):
    try:
        if not value:
            return default
        return json.loads(value)
    except Exception:
        return default


@router.get("/")
def get_agent_profiles(db: Session = Depends(get_db)):
    update_all_agent_profiles(db)

    profiles = db.query(AgentProfile).all()

    return [
        {
            "id": profile.id,
            "agent_name": profile.agent_name,
            "learned_preferences": safe_json(
                profile.learned_preferences, {}
            ),
            "behavior_patterns": safe_json(
                profile.behavior_patterns, {}
            ),
            "recurring_goals": safe_json(
                profile.recurring_goals, []
            ),
            "recurring_risks": safe_json(
                profile.recurring_risks, []
            ),
            "decision_style": profile.decision_style,
            "confidence_score": profile.confidence_score,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
        }
        for profile in profiles
    ]