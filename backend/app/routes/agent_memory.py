import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.agent_memory_service import get_recent_agent_memories

router = APIRouter()


@router.get("/")
def get_agent_memories(db: Session = Depends(get_db)):
    memories = get_recent_agent_memories(db)

    return [
        {
            "id": memory.id,
            "agent_name": memory.agent_name,
            "insight_type": memory.insight_type,
            "summary": memory.summary,
            "recommendation": json.loads(memory.recommendation or "[]"),
            "risks": json.loads(memory.risks or "[]"),
            "confidence": memory.confidence,
            "source_question": memory.source_question,
            "created_at": memory.created_at,
        }
        for memory in memories
    ]