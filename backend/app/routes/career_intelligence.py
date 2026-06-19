from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.memory import CareerMemory
from app.models.application import Application
from app.models.roadmap import CareerRoadmap
from app.services.ai_service import ask_ai_json

router = APIRouter()

@router.get("/")
def get_career_intelligence(db: Session = Depends(get_db)):
    memory = db.query(CareerMemory).order_by(CareerMemory.id.desc()).first()
    applications = db.query(Application).all()
    roadmap = db.query(CareerRoadmap).all()

    memory_context = "No memory saved."
    if memory:
        memory_context = f"""
Career Goal: {memory.career_goal}
Target Role: {memory.target_role}
Current Skills: {memory.current_skills}
Skills to Learn: {memory.skills_to_learn}
Notes: {memory.notes}
"""

    application_summary = f"""
Total Applications: {len(applications)}
Saved: {len([a for a in applications if a.status == "Saved"])}
Applied: {len([a for a in applications if a.status == "Applied"])}
Interview: {len([a for a in applications if a.status == "Interview"])}
Offer: {len([a for a in applications if a.status == "Offer"])}
Rejected: {len([a for a in applications if a.status == "Rejected"])}
"""

    roadmap_summary = f"""
Roadmap Items: {len(roadmap)}
Completed: {len([r for r in roadmap if r.completed])}
"""

    system_prompt = """
You are Career Twin, an AI career intelligence agent.
Generate a practical daily career action plan.
Return ONLY valid JSON.
"""

    user_prompt = f"""
Use this user context:

Career Memory:
{memory_context}

Application Summary:
{application_summary}

Roadmap Summary:
{roadmap_summary}

Return JSON exactly like this:
{{
  "daily_focus": "one short focus sentence",
  "skill_to_learn": "one skill",
  "project_task": "one project improvement task",
  "interview_topic": "one topic to practice",
  "application_goal": "one application goal",
  "reason": "why this is recommended",
  "priority_level": "Low, Medium, or High"
}}
"""

    return ask_ai_json(system_prompt, user_prompt)