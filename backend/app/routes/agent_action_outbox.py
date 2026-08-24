from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.api.pagination import (
    SortOrder,
    apply_sort,
    apply_text_search,
    paginate_query,
)
from app.config import settings
from app.database import get_db
from app.models.agent_action_outbox import AgentActionOutbox
from app.schemas.agent_action_outbox import (
    ActionOutboxBatchResponse,
    ActionOutboxCancelRequest,
    ActionOutboxDetail,
    ActionOutboxDispatchBatchRequest,
    ActionOutboxStatus,
)
from app.schemas.agent_approval import ApprovalActionType
from app.services.agent_action_outbox_service import (
    cancel_action_outbox_entry,
    dispatch_action_outbox_entry,
    dispatch_ready_actions,
    enqueue_approval_by_id,
    get_action_outbox_entry,
    outbox_detail,
    requeue_stale_dispatches,
    retry_action_outbox_entry,
    serialize_outbox_collection,
)


router = APIRouter()


@router.get(
    "/",
    summary="List the authenticated user's approved action outbox",
)
def list_action_outbox(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, min_length=1, max_length=200),
    outbox_status: ActionOutboxStatus | None = Query(default=None, alias="status"),
    action_type: ApprovalActionType | None = Query(default=None),
    agent_run_id: int | None = Query(default=None, gt=0),
    sort_by: str = Query(
        default="created_at",
        pattern="^(id|status|action_type|attempt_count|created_at|updated_at)$",
    ),
    sort_order: SortOrder = Query(default=SortOrder.desc),
    page: int | None = Query(default=None, ge=1),
    page_size: int | None = Query(
        default=None,
        ge=1,
        le=settings.api_max_page_size,
    ),
):
    query = db.query(AgentActionOutbox)
    query = apply_text_search(
        query,
        search,
        (
            AgentActionOutbox.action_summary,
            AgentActionOutbox.last_error,
            AgentActionOutbox.idempotency_key,
        ),
    )
    if outbox_status is not None:
        query = query.filter(AgentActionOutbox.status == outbox_status.value)
    if action_type is not None:
        query = query.filter(AgentActionOutbox.action_type == action_type.value)
    if agent_run_id is not None:
        query = query.filter(AgentActionOutbox.agent_run_id == agent_run_id)

    query = apply_sort(
        query,
        AgentActionOutbox,
        sort_by=sort_by,
        sort_order=sort_order,
        allowed_fields=(
            "id",
            "status",
            "action_type",
            "attempt_count",
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
    return serialize_outbox_collection(result)


@router.post(
    "/approvals/{approval_id}/enqueue",
    response_model=ActionOutboxDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Idempotently enqueue an already approved action",
)
def enqueue_approved_action(
    approval_id: int,
    db: Session = Depends(get_db),
) -> ActionOutboxDetail:
    return outbox_detail(enqueue_approval_by_id(db, approval_id))


@router.post(
    "/dispatch-ready",
    response_model=ActionOutboxBatchResponse,
    summary="Dispatch a bounded batch of ready user-owned actions",
)
def dispatch_ready(
    data: ActionOutboxDispatchBatchRequest,
    db: Session = Depends(get_db),
) -> ActionOutboxBatchResponse:
    requeue_stale_dispatches(db)
    entries = dispatch_ready_actions(db, limit=data.limit)
    details = [outbox_detail(entry) for entry in entries]
    return ActionOutboxBatchResponse(
        processed=len(details),
        succeeded=sum(item.status == ActionOutboxStatus.succeeded for item in details),
        failed=sum(
            item.status in {ActionOutboxStatus.failed, ActionOutboxStatus.dead_lettered}
            for item in details
        ),
        items=details,
    )


@router.get(
    "/{outbox_id}",
    response_model=ActionOutboxDetail,
    summary="Get one action outbox entry and its execution audit events",
)
def read_action_outbox_entry(
    outbox_id: int,
    db: Session = Depends(get_db),
) -> ActionOutboxDetail:
    return outbox_detail(get_action_outbox_entry(db, outbox_id))


@router.post(
    "/{outbox_id}/dispatch",
    response_model=ActionOutboxDetail,
    summary="Dispatch one queued action through the controlled dry-run executor",
)
def dispatch_action(
    outbox_id: int,
    db: Session = Depends(get_db),
) -> ActionOutboxDetail:
    return outbox_detail(dispatch_action_outbox_entry(db, outbox_id))


@router.post(
    "/{outbox_id}/retry",
    response_model=ActionOutboxDetail,
    summary="Queue another attempt for a failed action",
)
def retry_action(
    outbox_id: int,
    db: Session = Depends(get_db),
) -> ActionOutboxDetail:
    return outbox_detail(retry_action_outbox_entry(db, outbox_id))


@router.post(
    "/{outbox_id}/cancel",
    response_model=ActionOutboxDetail,
    summary="Cancel a queued or failed action",
)
def cancel_action(
    outbox_id: int,
    data: ActionOutboxCancelRequest,
    db: Session = Depends(get_db),
) -> ActionOutboxDetail:
    return outbox_detail(
        cancel_action_outbox_entry(db, outbox_id, reason=data.reason)
    )
