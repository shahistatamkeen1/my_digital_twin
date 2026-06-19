from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.roadmap import CareerRoadmap
from app.services.ai_service import ask_ai_json

router = APIRouter()

class RoadmapCreate(BaseModel):
    week: str
    title: str
    description: Optional[str] = ""
    tasks: Optional[str] = ""
    completed: Optional[bool] = False

class RoadmapUpdate(BaseModel):
    completed: bool

@router.get("/")
def get_roadmap(db: Session = Depends(get_db)):
    return db.query(CareerRoadmap).order_by(CareerRoadmap.id.asc()).all()

@router.post("/")
def create_roadmap_item(data: RoadmapCreate, db: Session = Depends(get_db)):
    item = CareerRoadmap(
        week=data.week,
        title=data.title,
        description=data.description,
        tasks=data.tasks,
        completed=data.completed
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item

@router.put("/{item_id}")
def update_roadmap_item(
    item_id: int,
    data: RoadmapUpdate,
    db: Session = Depends(get_db)
):
    item = db.query(CareerRoadmap).filter(CareerRoadmap.id == item_id).first()

    if not item:
        return {"error": "Roadmap item not found"}

    item.completed = data.completed
    db.commit()
    db.refresh(item)

    return item

@router.delete("/{item_id}")
def delete_roadmap_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(CareerRoadmap).filter(CareerRoadmap.id == item_id).first()

    if not item:
        return {"error": "Roadmap item not found"}

    db.delete(item)
    db.commit()

    return {"message": "Roadmap item deleted successfully"}

@router.post("/generate")
def generate_personalized_roadmap(db: Session = Depends(get_db)):
    from app.models.memory import CareerMemory

    memory = db.query(CareerMemory).order_by(CareerMemory.id.desc()).first()

    if not memory:
        return {
            "error": "No Career Memory found. Please create Career Memory first."
        }

    db.query(CareerRoadmap).delete()
    db.commit()

    system_prompt = """
You are Career Twin, an AI career roadmap planning agent.
Create a realistic 4-week career roadmap for a job seeker.
Each week must be practical, specific, and focused on employability.
Return only valid JSON.
"""

    user_prompt = f"""
Create a 4-week personalized roadmap using this career memory.

Career Goal:
{memory.career_goal}

Target Role:
{memory.target_role}

Current Skills:
{memory.current_skills}

Skills to Learn:
{memory.skills_to_learn}

Notes:
{memory.notes}

Return JSON in exactly this format:
{{
  "roadmap": [
    {{
      "week": "Week 1",
      "title": "short title",
      "description": "clear description",
      "tasks": "task 1\\ntask 2\\ntask 3\\ntask 4"
    }},
    {{
      "week": "Week 2",
      "title": "short title",
      "description": "clear description",
      "tasks": "task 1\\ntask 2\\ntask 3\\ntask 4"
    }},
    {{
      "week": "Week 3",
      "title": "short title",
      "description": "clear description",
      "tasks": "task 1\\ntask 2\\ntask 3\\ntask 4"
    }},
    {{
      "week": "Week 4",
      "title": "short title",
      "description": "clear description",
      "tasks": "task 1\\ntask 2\\ntask 3\\ntask 4"
    }}
  ]
}}
"""

    ai_result = ask_ai_json(system_prompt, user_prompt)

    if "error" in ai_result:
        return ai_result

    roadmap_items = ai_result.get("roadmap", [])

    created_items = []

    for item in roadmap_items:
        roadmap_item = CareerRoadmap(
            week=item.get("week", ""),
            title=item.get("title", ""),
            description=item.get("description", ""),
            tasks=item.get("tasks", ""),
            completed=False
        )

        db.add(roadmap_item)
        db.commit()
        db.refresh(roadmap_item)

        created_items.append(roadmap_item)

    return {
        "message": "AI personalized roadmap generated successfully.",
        "target_role": memory.target_role,
        "items": created_items
    }
    
    @router.delete("/")
    def clear_roadmap(db: Session = Depends(get_db)):
        db.query(CareerRoadmap).delete()
        db.commit()

    return {"message": "Roadmap cleared successfully"}