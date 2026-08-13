from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RejectionPolicy(str, Enum):
    skip_and_continue = "skip_and_continue"
    stop_workflow = "stop_workflow"


class CheckpointStatus(str, Enum):
    pending = "pending"
    resumed = "resumed"
    skipped = "skipped"
    cancelled = "cancelled"
    expired = "expired"


class AgentCheckpointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_run_id: int
    agent_step_id: int | None
    approval_id: int | None
    checkpoint_type: str
    execution_key: str
    status: CheckpointStatus
    rejection_policy: RejectionPolicy
    workflow_state: dict[str, Any]
    resume_payload: dict[str, Any] | None
    checkpoint_version: int
    resume_count: int
    resumed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class WorkflowEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_run_id: int
    agent_step_id: int | None
    approval_id: int | None
    event_type: str
    event_payload: dict[str, Any] = Field(default_factory=dict)
    note: str | None
    created_at: datetime
