from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agent_memory import AgentMemory
from app.models.agent_reflection import AgentReflection

router = APIRouter()


@router.get("/")
def get_twin_journal(db: Session = Depends(get_db)):
    entries = []

    memories = db.query(AgentMemory).all()

    for memory in memories:
        entries.append(
            {
                "type": "memory",
                "agent": memory.agent_name,
                "title": memory.summary,
                "date": memory.created_at,
            }
        )

    reflections = db.query(AgentReflection).all()

    for reflection in reflections:
        entries.append(
            {
                "type": "reflection",
                "agent": reflection.agent_name,
                "title": reflection.summary,
                "date": reflection.created_at,
            }
        )

    entries.sort(
        key=lambda x: x["date"],
        reverse=True,
    )

    return entries