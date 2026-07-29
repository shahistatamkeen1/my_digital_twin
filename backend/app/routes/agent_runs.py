from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.agents.contracts import (
    AgentRunCancelResponse,
    AgentRunCreate,
    AgentRunDeleteResponse,
    AgentRunDetail,
    AgentRunExecuteRequest,
    AgentRunStatus,
    ExecutionMode,
)
from app.api.pagination import (
    SortOrder,
    apply_sort,
    apply_text_search,
    paginate_query,
)
from app.config import settings
from app.database import get_db
from app.models.agent_run import AgentRun
from app.services.agent_execution_service import (
    cancel_agent_run,
    execute_agent_run,
)
from app.services.agent_orchestration_service import (
    create_agent_run,
    delete_agent_run,
    get_agent_run,
    retry_agent_run,
    run_detail,
    serialize_collection_result,
)


router = APIRouter()


@router.post(
    "/",
    response_model=AgentRunDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Plan a persistent multi-agent workflow",
)
def create_run(
    data: AgentRunCreate,
    db: Session = Depends(get_db),
) -> AgentRunDetail:
    return run_detail(create_agent_run(db, data))


@router.get(
    "/",
    summary="List the authenticated user's agent workflows",
)
def list_runs(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=200,
        description="Search workflow goals, routing reasons, and errors.",
    ),
    run_status: AgentRunStatus | None = Query(default=None, alias="status"),
    execution_mode: ExecutionMode | None = Query(default=None),
    sort_by: str = Query(
        default="created_at",
        pattern="^(id|status|execution_mode|created_at|updated_at)$",
    ),
    sort_order: SortOrder = Query(default=SortOrder.desc),
    page: int | None = Query(default=None, ge=1),
    page_size: int | None = Query(
        default=None,
        ge=1,
        le=settings.api_max_page_size,
    ),
):
    query = db.query(AgentRun)
    query = apply_text_search(
        query,
        search,
        (
            AgentRun.goal,
            AgentRun.routing_reason,
            AgentRun.error_message,
        ),
    )

    if run_status is not None:
        query = query.filter(AgentRun.status == run_status.value)
    if execution_mode is not None:
        query = query.filter(AgentRun.execution_mode == execution_mode.value)

    query = apply_sort(
        query,
        AgentRun,
        sort_by=sort_by,
        sort_order=sort_order,
        allowed_fields=(
            "id",
            "status",
            "execution_mode",
            "created_at",
            "updated_at",
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
    )
    return serialize_collection_result(result)


@router.get(
    "/{run_id}",
    response_model=AgentRunDetail,
    summary="Get one user-owned agent workflow",
)
def read_run(
    run_id: int,
    db: Session = Depends(get_db),
) -> AgentRunDetail:
    return run_detail(get_agent_run(db, run_id))


@router.post(
    "/{run_id}/retry",
    response_model=AgentRunDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new attempt for a failed, cancelled, or partial workflow",
)
def retry_run(
    run_id: int,
    db: Session = Depends(get_db),
) -> AgentRunDetail:
    return run_detail(retry_agent_run(db, run_id))


@router.post(
    "/{run_id}/execute",
    response_model=AgentRunDetail,
    summary="Execute a planned multi-agent workflow",
)
def execute_run(
    run_id: int,
    data: AgentRunExecuteRequest,
    db: Session = Depends(get_db),
) -> AgentRunDetail:
    return run_detail(execute_agent_run(db, run_id, data))


@router.post(
    "/{run_id}/cancel",
    response_model=AgentRunCancelResponse,
    summary="Cancel a planned or active multi-agent workflow",
)
def cancel_run(
    run_id: int,
    db: Session = Depends(get_db),
) -> AgentRunCancelResponse:
    run = cancel_agent_run(db, run_id)
    return AgentRunCancelResponse(
        message="Agent run cancelled successfully.",
        run=run_detail(run),
    )


@router.delete(
    "/{run_id}",
    response_model=AgentRunDeleteResponse,
    summary="Delete a non-running agent workflow",
)
def remove_run(
    run_id: int,
    db: Session = Depends(get_db),
) -> AgentRunDeleteResponse:
    delete_agent_run(db, run_id)
    return AgentRunDeleteResponse(
        message="Agent run deleted successfully.",
        deleted_run_id=run_id,
    )
