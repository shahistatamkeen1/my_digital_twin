from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import ask_ai_json
from app.services.career_context_service import get_career_context

router = APIRouter()


@router.get("/")
def get_twin_recommendation(db: Session = Depends(get_db)):
    context = get_career_context(db)

    system_prompt = """
You are Career Twin, a proactive AI career agent.
Analyze the user's Career Twin context and recommend ONE best next action.
Return ONLY valid JSON.
"""

    user_prompt = f"""
Career Twin Context:
{context}

Return JSON exactly like this:
{{
  "title": "short recommendation title",
  "recommended_action": "one clear action the user should take today",
  "reason": "why this action matters based on their data",
  "priority": "Low, Medium, or High",
  "suggested_prompt": "a prompt the user can send to Career Chat to continue"
}}
"""

    return ask_ai_json(system_prompt, user_prompt, temperature=0.3)