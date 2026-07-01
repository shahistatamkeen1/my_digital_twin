from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.learning import LearningMemory
from app.services.ai_service import ask_ai

router = APIRouter()


class LearningChatRequest(BaseModel):
    message: str


@router.post("/")
def learning_chat(request: LearningChatRequest, db: Session = Depends(get_db)):
    learning_items = db.query(LearningMemory).order_by(LearningMemory.id.desc()).all()

    learning_context = []

    for item in learning_items:
        learning_context.append(
            {
                "topic": item.topic,
                "category": item.category,
                "current_level": item.current_level,
                "target_level": item.target_level,
                "resource": item.resource,
                "status": item.status,
                "notes": item.notes,
            }
        )

    system_prompt = """
You are the Learning Twin inside My Digital Twin.

Your role:
- Help the user build skills
- Recommend learning paths
- Create practical study plans
- Suggest certifications
- Connect learning goals to career goals
- Keep advice realistic and beginner-friendly

Rules:
- Be specific and action-focused.
- Do not overwhelm the user.
- Prefer weekly plans and daily habits.
- Recommend free or low-cost resources when possible.
- If the user asks for a roadmap, create a structured plan.
- If the user asks what to learn next, prioritize based on their current goals.
"""

    user_prompt = f"""
User Question:
{request.message}

Current Learning Memory:
{learning_context}

Give a helpful Learning Twin response.
"""

    reply = ask_ai(system_prompt, user_prompt, temperature=0.4)

    return {
        "reply": reply,
        "learning_context": learning_context,
    }


@router.get("/roadmap")
def generate_learning_roadmap(db: Session = Depends(get_db)):
    learning_items = db.query(LearningMemory).order_by(LearningMemory.id.desc()).all()

    learning_context = []

    for item in learning_items:
        learning_context.append(
            {
                "topic": item.topic,
                "category": item.category,
                "current_level": item.current_level,
                "target_level": item.target_level,
                "resource": item.resource,
                "status": item.status,
                "notes": item.notes,
            }
        )

    system_prompt = """
You are the Learning Twin inside My Digital Twin.

Generate a helpful, personalized, human-friendly response based on the user's saved learning goals.

Guidelines:
- Do not use a fixed template.
- Do not use markdown tables.
- Do not overuse bold formatting.
- Write in a natural, supportive tone.
- Make the response easy to scan.
- Use short headings only when helpful.
- Use simple bullet points where useful.
- Prioritize free and affordable resources.
- Explain why each recommendation matters.
- Keep the advice practical and realistic.
- Adapt the response to the user's current level, target level, topic, and notes.
- End with one clear next action the user can take today.
"""

    user_prompt = f"""
Current Learning Goals:
{learning_context}

Generate a personalized learning roadmap.
"""

    roadmap = ask_ai(system_prompt, user_prompt, temperature=0.4)

    return {
        "roadmap": roadmap,
        "learning_context": learning_context,
    }