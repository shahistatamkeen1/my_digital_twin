from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.memory import CareerMemory

router = APIRouter()

class MemoryCreate(BaseModel):
    career_goal: Optional[str] = ""
    target_role: Optional[str] = ""
    current_skills: Optional[str] = ""
    skills_to_learn: Optional[str] = ""
    notes: Optional[str] = ""

@router.get("/")
def get_memory(db: Session = Depends(get_db)):
    memory = db.query(CareerMemory).order_by(CareerMemory.id.desc()).first()
    return memory

@router.post("/")
def save_memory(data: MemoryCreate, db: Session = Depends(get_db)):
    new_memory = CareerMemory(
        career_goal=data.career_goal,
        target_role=data.target_role,
        current_skills=data.current_skills,
        skills_to_learn=data.skills_to_learn,
        notes=data.notes
    )

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return new_memory