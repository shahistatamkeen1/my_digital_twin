from __future__ import annotations

from datetime import datetime
from enum import Enum
import json
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ApprovalStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"
    expired = "expired"


class ApprovalActionType(str, Enum):
    send_email = "send_email"
    create_calendar_event = "create_calendar_event"
    submit_application = "submit_application"
    delete_data = "delete_data"
    change_financial_plan = "change_financial_plan"
    external_action = "external_action"
    other = "other"


class ApprovalEventType(str, Enum):
    requested = "requested"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"
    expired = "expired"


def _validate_json_size(value: dict[str, Any] | None) -> dict[str, Any] | None:
    if value is None:
        return None
    encoded = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
    if len(encoded.encode("utf-8")) > 50_000:
        raise ValueError("Approval payloads must be 50 KB or smaller.")
    return value


class AgentApprovalCreate(BaseModel):
    agent_run_id: int = Field(gt=0)
    agent_step_id: int | None = Field(default=None, gt=0)
    action_type: ApprovalActionType
    action_summary: str = Field(min_length=5, max_length=2000)
    proposed_payload: dict[str, Any] = Field(default_factory=dict)
    expires_in_minutes: int | None = Field(default=1440, ge=5, le=10080)

    @field_validator("action_summary")
    @classmethod
    def normalize_summary(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 5:
            raise ValueError("Action summary must contain at least five characters.")
        return normalized

    @field_validator("proposed_payload")
    @classmethod
    def limit_payload(cls, value: dict[str, Any]) -> dict[str, Any]:
        return _validate_json_size(value) or {}


class AgentApprovalDecision(BaseModel):
    decision_note: str | None = Field(default=None, max_length=2000)
    decision_payload: dict[str, Any] | None = None

    @field_validator("decision_note")
    @classmethod
    def normalize_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.split())
        return normalized or None

    @field_validator("decision_payload")
    @classmethod
    def limit_payload(
        cls,
        value: dict[str, Any] | None,
    ) -> dict[str, Any] | None:
        return _validate_json_size(value)


class AgentApprovalEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    approval_id: int
    event_type: ApprovalEventType
    previous_status: ApprovalStatus | None
    new_status: ApprovalStatus
    note: str | None
    event_payload: dict[str, Any]
    created_at: datetime


class AgentApprovalSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_run_id: int
    agent_step_id: int | None
    action_type: ApprovalActionType
    action_summary: str
    proposed_payload: dict[str, Any]
    decision_payload: dict[str, Any] | None
    status: ApprovalStatus
    decision_note: str | None
    requested_at: datetime
    decided_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AgentApprovalDetail(AgentApprovalSummary):
    events: list[AgentApprovalEventRead] = Field(default_factory=list)


class AgentApprovalCancelResponse(BaseModel):
    message: str
    approval: AgentApprovalDetail
