import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agent_reflection import AgentReflection
from app.services.agent_reflection_service import (
    generate_all_agent_reflections,
)

router = APIRouter()


def safe_json(value, default):
    try:
        if not value:
            return default
        return json.loads(value)
    except Exception:
        return default


@router.post("/generate")
def generate_reflections(db: Session = Depends(get_db)):
    reflections = generate_all_agent_reflections(db)

    return {
        "message": "Agent reflections generated successfully.",
        "count": len(reflections),
    }


@router.get("/")
def get_reflections(db: Session = Depends(get_db)):
    reflections = (
        db.query(AgentReflection)
        .order_by(AgentReflection.created_at.desc())
        .all()
    )

    return [
        {
            "id": reflection.id,
            "agent_name": reflection.agent_name,
            "reflection_type": reflection.reflection_type,
            "wins": safe_json(reflection.wins, []),
            "concerns": safe_json(reflection.concerns, []),
            "recommendation": reflection.recommendation,
            "summary": reflection.summary,
            "confidence_score": reflection.confidence_score,
            "created_at": reflection.created_at,
        }
        for reflection in reflections
    ]