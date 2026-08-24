from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.agent_approval import ApprovalActionType


class ActionOutboxStatus(str, Enum):
    queued = "queued"
    dispatching = "dispatching"
    succeeded = "succeeded"
    failed = "failed"
    cancelled = "cancelled"
    dead_lettered = "dead_lettered"


class ActionOutboxEventType(str, Enum):
    queued = "queued"
    dispatch_started = "dispatch_started"
    dispatch_succeeded = "dispatch_succeeded"
    dispatch_failed = "dispatch_failed"
    retry_scheduled = "retry_scheduled"
    cancelled = "cancelled"
    dead_lettered = "dead_lettered"
    stale_requeued = "stale_requeued"


class ActionOutboxEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    outbox_id: int
    event_type: ActionOutboxEventType
    previous_status: ActionOutboxStatus | None
    new_status: ActionOutboxStatus
    attempt_number: int | None
    note: str | None
    event_payload: dict[str, Any]
    created_at: datetime


class ActionOutboxSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    approval_id: int
    agent_run_id: int
    agent_step_id: int | None
    idempotency_key: str
    action_type: ApprovalActionType
    action_summary: str
    execution_payload: dict[str, Any]
    execution_mode: str
    status: ActionOutboxStatus
    attempt_count: int
    max_attempts: int
    last_error: str | None
    result_payload: dict[str, Any] | None
    next_attempt_at: datetime | None
    claimed_at: datetime | None
    dispatched_at: datetime | None
    completed_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ActionOutboxDetail(ActionOutboxSummary):
    events: list[ActionOutboxEventRead] = Field(default_factory=list)


class ActionOutboxCancelRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=2000)


class ActionOutboxDispatchBatchRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=50)


class ActionOutboxBatchResponse(BaseModel):
    processed: int
    succeeded: int
    failed: int
    items: list[ActionOutboxDetail]
