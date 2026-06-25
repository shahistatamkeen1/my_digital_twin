from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import ask_ai
from app.services.career_context_service import get_career_context

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


@router.post("/")
def career_chat(request: ChatRequest, db: Session = Depends(get_db)):
    context = get_career_context(db)

    system_prompt = """
You are Career Twin, a personalized AI career agent inside My Digital Twin.

Use the user's Career Twin context to answer:
- career planning questions
- job search strategy
- resume improvement questions
- interview preparation questions
- application tracking questions
- skill gap questions

Be practical, specific, and action-focused.
Do not give generic advice if context is available.
Keep answers clear and organized.
"""

    user_prompt = f"""
Career Twin Context:
{context}

User Question:
{request.message}
"""

    reply = ask_ai(system_prompt, user_prompt, temperature=0.4)

    return {
        "reply": reply,
        "used_twin_context": True,
    }