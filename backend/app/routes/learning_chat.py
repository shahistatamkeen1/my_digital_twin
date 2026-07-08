from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json
import re

from app.database import get_db
from app.models.learning import LearningMemory
from app.services.ai_service import ask_ai

router = APIRouter()


class LearningChatRequest(BaseModel):
    message: str


def extract_json(text: str):
    """
    Safely extract JSON if AI returns extra text accidentally.
    """
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            return None

    return None


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

Generate a personalized learning roadmap.

Return ONLY valid JSON.

The JSON must follow this exact structure:

{
  "roadmap": [
    {
      "title": "Week 1 - Foundations",
      "goal": "Explain the learning goal for this step.",
      "why": "Explain why this step matters.",
      "actions": [
        "Action item 1",
        "Action item 2",
        "Action item 3"
      ]
    }
  ]
}

Rules:
- Return only JSON.
- Do not use markdown.
- Do not use code blocks.
- Do not add explanation outside the JSON.
- Create 4 to 6 roadmap steps.
- Each step must have title, goal, why, and actions.
- Actions must be an array of strings.
- Keep the roadmap practical and beginner-friendly.
- Prioritize free or affordable resources.
- Personalize it using the user's topic, current level, target level, resource, status, and notes.
"""

    user_prompt = f"""
Current Learning Goals:
{learning_context}

Create a personalized weekly learning roadmap.
"""

    ai_response = ask_ai(system_prompt, user_prompt, temperature=0.3)

    parsed = extract_json(ai_response)

    if not parsed or "roadmap" not in parsed or not isinstance(parsed["roadmap"], list):
        return {
            "roadmap": [],
            "learning_context": learning_context,
            "error": "AI did not return a valid roadmap JSON array.",
        }

    return {
        "roadmap": parsed["roadmap"],
        "learning_context": learning_context,
    }
    
@router.get("/next-task")
def generate_next_learning_task(db: Session = Depends(get_db)):
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

Generate ONE focused learning task for today.

Return ONLY valid JSON in this exact format:

{
  "task": {
    "title": "Practice AWS IAM basics today",
    "reason": "IAM is a foundation topic for AWS Solutions Architect and helps you understand secure access control.",
    "time_needed": "45 minutes",
    "steps": [
      "Watch one short IAM beginner lesson",
      "Create one IAM user in AWS Free Tier",
      "Write down the difference between users, groups, roles, and policies"
    ]
  }
}

Rules:
- Return only JSON.
- Do not use markdown.
- Do not use code blocks.
- Do not add explanation outside JSON.
- Task must be realistic for one day.
- Use the user's saved learning goals.
- Prioritize goals that are not completed.
"""

    user_prompt = f"""
Current Learning Goals:
{learning_context}

Generate today's next learning task.
"""

    ai_response = ask_ai(system_prompt, user_prompt, temperature=0.3)

    parsed = extract_json(ai_response)

    if not parsed or "task" not in parsed:
        return {
            "task": None,
            "learning_context": learning_context,
            "error": "AI did not return a valid task JSON.",
        }

    return {
        "task": parsed["task"],
        "learning_context": learning_context,
    }
    
@router.get("/insights")
def generate_learning_insights(db: Session = Depends(get_db)):
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

Analyze the user's saved learning goals and generate clear learning insights.

Return ONLY valid JSON in this exact format:

{
  "insights": {
    "summary": "Short summary of the user's learning direction.",
    "strengths": [
      "Strength 1",
      "Strength 2"
    ],
    "gaps": [
      "Gap 1",
      "Gap 2"
    ],
    "recommendations": [
      "Recommendation 1",
      "Recommendation 2"
    ],
    "next_focus": "One clear next area the user should focus on."
  }
}

Rules:
- Return only JSON.
- Do not use markdown.
- Do not use code blocks.
- Do not add explanation outside JSON.
- Keep it practical and beginner-friendly.
- Base the analysis on the user's current learning goals.
- Mention realistic next steps.
"""

    user_prompt = f"""
Current Learning Goals:
{learning_context}

Generate learning insights.
"""

    ai_response = ask_ai(system_prompt, user_prompt, temperature=0.3)

    parsed = extract_json(ai_response)

    if not parsed or "insights" not in parsed:
        return {
            "insights": None,
            "learning_context": learning_context,
            "error": "AI did not return valid insights JSON.",
        }

    return {
        "insights": parsed["insights"],
        "learning_context": learning_context,
    }
    
@router.post("/structured")
def structured_learning_chat(request: LearningChatRequest, db: Session = Depends(get_db)):
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

Answer the user's question using their saved learning memory.

Return ONLY valid JSON in this exact format:

{
  "reply": {
    "recommendation": "Clear recommendation in 2 to 4 sentences.",
    "resources": [
      "Resource 1",
      "Resource 2",
      "Resource 3"
    ],
    "next_actions": [
      "Action 1",
      "Action 2",
      "Action 3"
    ]
  }
}

Rules:
- Return only JSON.
- Do not use markdown.
- Do not use code blocks.
- Keep it practical and beginner-friendly.
- Recommend free or low-cost resources when possible.
- Make the next actions realistic for today or this week.
"""

    user_prompt = f"""
User Question:
{request.message}

Current Learning Memory:
{learning_context}

Generate a structured Learning Twin response.
"""

    ai_response = ask_ai(system_prompt, user_prompt, temperature=0.3)

    parsed = extract_json(ai_response)

    if not parsed or "reply" not in parsed:
        return {
            "reply": {
                "recommendation": "I could not generate a structured response right now.",
                "resources": [],
                "next_actions": ["Try asking again with a specific skill or certification goal."],
            },
            "learning_context": learning_context,
        }

    return {
        "reply": parsed["reply"],
        "learning_context": learning_context,
    }