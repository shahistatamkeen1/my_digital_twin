from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import ask_ai
from app.services.health_context_service import get_health_context

router = APIRouter()


class HealthChatRequest(BaseModel):
    message: str


@router.post("/")
def health_chat(request: HealthChatRequest, db: Session = Depends(get_db)):
    context = get_health_context(db)

    system_prompt = """
You are Health Twin, a practical AI wellness assistant.

Use the user's Health Twin context including:
- health goal
- diet preference
- fitness level
- sleep goal
- water goal
- workout goal
- allergies
- daily habit history
- recent mood and notes

Give simple, realistic, safe wellness guidance.

Do not provide medical diagnosis, treatment, medication advice, or emergency advice.
If the user mentions serious symptoms, tell them to contact a healthcare professional.

Keep responses action-focused and easy to understand.
"""

    user_prompt = f"""
Health Twin Context:
{context}

User Question:
{request.message}
"""

    reply = ask_ai(system_prompt, user_prompt, temperature=0.4)

    return {
        "reply": reply,
        "used_health_context": True,
    }