from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.learning import LearningMemory
from app.services.ai_service import ask_ai_json

router = APIRouter()


@router.get("/")
def get_resource_cards(db: Session = Depends(get_db)):
    learning_items = db.query(LearningMemory).order_by(LearningMemory.id.desc()).all()

    learning_context = [
        {
            "topic": item.topic,
            "category": item.category,
            "current_level": item.current_level,
            "target_level": item.target_level,
            "resource": item.resource,
            "resource_link": getattr(item, "resource_link", None),
            "status": item.status,
            "notes": item.notes,
        }
        for item in learning_items
    ]

    system_prompt = """
You are the Learning Resource Advisor inside My Digital Twin.

Recommend the best free and affordable learning resources.

Return ONLY valid JSON.

The JSON must be:
{
  "summary": "short human friendly summary",
  "resources": [
    {
      "name": "Resource name",
      "url": "official URL",
      "cost": "Free or Affordable",
      "type": "Official Training / Documentation / Course / Practice Exam / Project",
      "description": "short description",
      "why_useful": "why this helps the user"
    }
  ]
}

Rules:
- Return 4 to 8 resources.
- Prioritize free and affordable resources.
- Include official URLs when possible.
- Do not recommend expensive bootcamps.
- Keep descriptions short and clear.
- Match the user's current level and target level.
"""

    user_prompt = f"""
Saved Learning Goals:
{learning_context}

Generate structured resource cards.
"""

    result = ask_ai_json(system_prompt, user_prompt, temperature=0.25)

    return {
        "summary": result.get("summary", "Recommended learning resources are ready."),
        "resources": result.get("resources", []),
        "learning_context": learning_context,
    }