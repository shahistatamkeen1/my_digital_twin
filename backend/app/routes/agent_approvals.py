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
from app.models.agent_approval import AgentApproval
from app.schemas.agent_approval import (
    AgentApprovalCancelResponse,
    AgentApprovalCreate,
    AgentApprovalDecision,
    AgentApprovalDetail,
    ApprovalActionType,
    ApprovalStatus,
)
from app.services.agent_approval_service import (
    approval_detail,
    approve_agent_approval,
    cancel_agent_approval,
    create_agent_approval,
    expire_owned_pending_approvals,
    get_agent_approval,
    reject_agent_approval,
    serialize_approval_collection,
)


router = APIRouter()


@router.post(
    "/",
    response_model=AgentApprovalDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Request approval for a proposed agent action",
)
def create_approval(
    data: AgentApprovalCreate,
    db: Session = Depends(get_db),
) -> AgentApprovalDetail:
    return approval_detail(create_agent_approval(db, data))


@router.get(
    "/",
    summary="List the authenticated user's approval requests",
)
def list_approvals(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=200,
        description="Search action summaries and decision notes.",
    ),
    approval_status: ApprovalStatus | None = Query(
        default=None,
        alias="status",
    ),
    action_type: ApprovalActionType | None = Query(default=None),
    agent_run_id: int | None = Query(default=None, gt=0),
    sort_by: str = Query(
        default="requested_at",
        pattern="^(id|status|action_type|requested_at|expires_at|updated_at)$",
    ),
    sort_order: SortOrder = Query(default=SortOrder.desc),
    page: int | None = Query(default=None, ge=1),
    page_size: int | None = Query(
        default=None,
        ge=1,
        le=settings.api_max_page_size,
    ),
):
    expire_owned_pending_approvals(db)

    query = db.query(AgentApproval)
    query = apply_text_search(
        query,
        search,
        (
            AgentApproval.action_summary,
            AgentApproval.decision_note,
        ),
    )

    if approval_status is not None:
        query = query.filter(
            AgentApproval.status == approval_status.value
        )
    if action_type is not None:
        query = query.filter(
            AgentApproval.action_type == action_type.value
        )
    if agent_run_id is not None:
        query = query.filter(
            AgentApproval.agent_run_id == agent_run_id
        )

    query = apply_sort(
        query,
        AgentApproval,
        sort_by=sort_by,
        sort_order=sort_order,
        allowed_fields=(
            "id",
            "status",
            "action_type",
            "requested_at",
            "expires_at",
            "updated_at",
        ),
        default_field="requested_at",
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
    return serialize_approval_collection(result)


@router.get(
    "/{approval_id}",
    response_model=AgentApprovalDetail,
    summary="Get one user-owned approval and its audit events",
)
def read_approval(
    approval_id: int,
    db: Session = Depends(get_db),
) -> AgentApprovalDetail:
    return approval_detail(get_agent_approval(db, approval_id))


@router.post(
    "/{approval_id}/approve",
    response_model=AgentApprovalDetail,
    summary="Approve a pending agent action",
)
def approve_approval(
    approval_id: int,
    data: AgentApprovalDecision,
    db: Session = Depends(get_db),
) -> AgentApprovalDetail:
    return approval_detail(
        approve_agent_approval(db, approval_id, data)
    )


@router.post(
    "/{approval_id}/reject",
    response_model=AgentApprovalDetail,
    summary="Reject a pending agent action",
)
def reject_approval(
    approval_id: int,
    data: AgentApprovalDecision,
    db: Session = Depends(get_db),
) -> AgentApprovalDetail:
    return approval_detail(
        reject_agent_approval(db, approval_id, data)
    )


@router.post(
    "/{approval_id}/cancel",
    response_model=AgentApprovalCancelResponse,
    summary="Cancel a pending approval request",
)
def cancel_approval(
    approval_id: int,
    data: AgentApprovalDecision,
    db: Session = Depends(get_db),
) -> AgentApprovalCancelResponse:
    approval = cancel_agent_approval(db, approval_id, data)
    return AgentApprovalCancelResponse(
        message="Approval request cancelled successfully.",
        approval=approval_detail(approval),
    )
