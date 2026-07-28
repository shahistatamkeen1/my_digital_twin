from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.orm import Session

from app.api.pagination import (
    SortOrder,
    apply_sort,
    apply_text_search,
    paginate_query,
)
from app.config import settings
from app.database import get_db
from app.models.agent_memory import AgentMemory


router = APIRouter()


def _serialize_memory(memory: AgentMemory) -> dict:
    return {
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


@router.get("/")
def get_agent_memories(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=200,
        description="Search summaries, questions, or insight types.",
    ),
    agent_name: str | None = Query(default=None, max_length=100),
    insight_type: str | None = Query(default=None, max_length=100),
    confidence_min: int | None = Query(default=None, ge=0, le=100),
    sort_by: str = Query(
        default="created_at",
        pattern="^(id|agent_name|insight_type|confidence|created_at)$",
    ),
    sort_order: SortOrder = Query(default=SortOrder.desc),
    page: int | None = Query(default=None, ge=1),
    page_size: int | None = Query(
        default=None,
        ge=1,
        le=settings.api_max_page_size,
    ),
):
    query = db.query(AgentMemory)
    query = apply_text_search(
        query,
        search,
        (
            AgentMemory.summary,
            AgentMemory.source_question,
            AgentMemory.insight_type,
        ),
    )

    if agent_name:
        query = query.filter(AgentMemory.agent_name == agent_name)
    if insight_type:
        query = query.filter(AgentMemory.insight_type == insight_type)
    if confidence_min is not None:
        query = query.filter(AgentMemory.confidence >= confidence_min)

    query = apply_sort(
        query,
        AgentMemory,
        sort_by=sort_by,
        sort_order=sort_order,
        allowed_fields=(
            "id",
            "agent_name",
            "insight_type",
            "confidence",
            "created_at",
        ),
        default_field="created_at",
    )

    result = paginate_query(
        query,
        request=request,
        response=response,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        legacy_limit=25,
    )

    if isinstance(result, list):
        return [_serialize_memory(memory) for memory in result]

    return {
        "items": [
            _serialize_memory(memory)
            for memory in result["items"]
        ],
        "pagination": result["pagination"],
    }
