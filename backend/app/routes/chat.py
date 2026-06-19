from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.memory import CareerMemory
from app.services.ai_service import ask_ai

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/")
def career_chat(request: ChatRequest, db: Session = Depends(get_db)):
    memory = db.query(CareerMemory).order_by(CareerMemory.id.desc()).first()

    memory_context = "No career memory saved yet."

    if memory:
        memory_context = f"""
Career Goal: {memory.career_goal}
Target Role: {memory.target_role}
Current Skills: {memory.current_skills}
Skills to Learn: {memory.skills_to_learn}
Notes: {memory.notes}
"""

    system_prompt = """
You are Career Twin, an AI career coach inside My Digital Twin.
Give practical, personalized, step-by-step advice.
Use the user's saved memory when available.
Keep answers concise and actionable.
"""

    user_prompt = f"""
Saved Career Memory:
{memory_context}

User Question:
{request.message}
"""

    reply = ask_ai(system_prompt, user_prompt)

    return {"reply": reply}