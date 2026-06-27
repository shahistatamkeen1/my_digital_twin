from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.personal_memory import PersonalMemory

router = APIRouter()


class PersonalMemoryCreate(BaseModel):
    name: str = ""
    location: str = ""
    timezone: str = ""
    current_status: str = ""
    long_term_goals: str = ""
    daily_schedule: str = ""
    communication_style: str = ""
    life_priorities: str = ""
    notes: str = ""


@router.get("/")
def get_personal_memory(db: Session = Depends(get_db)):
    memory = db.query(PersonalMemory).order_by(PersonalMemory.id.desc()).first()

    if not memory:
        return {
            "name": "",
            "location": "",
            "timezone": "",
            "current_status": "",
            "long_term_goals": "",
            "daily_schedule": "",
            "communication_style": "",
            "life_priorities": "",
            "notes": "",
        }

    return memory


@router.post("/")
def save_personal_memory(
    memory: PersonalMemoryCreate,
    db: Session = Depends(get_db)
):
    existing_memory = db.query(PersonalMemory).order_by(PersonalMemory.id.desc()).first()

    if existing_memory:
        existing_memory.name = memory.name
        existing_memory.location = memory.location
        existing_memory.timezone = memory.timezone
        existing_memory.current_status = memory.current_status
        existing_memory.long_term_goals = memory.long_term_goals
        existing_memory.daily_schedule = memory.daily_schedule
        existing_memory.communication_style = memory.communication_style
        existing_memory.life_priorities = memory.life_priorities
        existing_memory.notes = memory.notes

        db.commit()
        db.refresh(existing_memory)

        return existing_memory

    new_memory = PersonalMemory(
        name=memory.name,
        location=memory.location,
        timezone=memory.timezone,
        current_status=memory.current_status,
        long_term_goals=memory.long_term_goals,
        daily_schedule=memory.daily_schedule,
        communication_style=memory.communication_style,
        life_priorities=memory.life_priorities,
        notes=memory.notes,
    )

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return new_memory