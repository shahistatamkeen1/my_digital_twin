import json
from sqlalchemy.orm import Session

from app.models.agent_memory import AgentMemory


def save_agent_memory(
    db: Session,
    agent_name: str,
    insight_type: str,
    summary: str,
    recommendation,
    risks,
    confidence: int,
    source_question: str,
):
    memory = AgentMemory(
        agent_name=agent_name,
        insight_type=insight_type,
        summary=summary or "",
        recommendation=json.dumps(recommendation or []),
        risks=json.dumps(risks or []),
        confidence=confidence or 0,
        source_question=source_question or "",
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    return memory


def get_recent_agent_memories(db: Session, limit: int = 25):
    return (
        db.query(AgentMemory)
        .order_by(AgentMemory.id.desc())
        .limit(limit)
        .all()
    )