from __future__ import annotations

from datetime import datetime
import json
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AgentName(str, Enum):
    career = "career"
    finance = "finance"
    health = "health"
    learning = "learning"


class AgentRunStatus(str, Enum):
    planned = "planned"
    running = "running"
    synthesizing = "synthesizing"
    completed = "completed"
    partially_completed = "partially_completed"
    failed = "failed"
    cancelled = "cancelled"


class AgentStepStatus(str, Enum):
    planned = "planned"
    running = "running"
    completed = "completed"
    failed = "failed"
    skipped = "skipped"
    cancelled = "cancelled"


class ExecutionMode(str, Enum):
    single_agent = "single_agent"
    parallel_then_synthesize = "parallel_then_synthesize"
    sequential = "sequential"


class AgentExecutionProvider(str, Enum):
    configured = "configured"
    deterministic = "deterministic"


class AgentDefinition(BaseModel):
    name: AgentName
    display_name: str
    description: str
    supported_tasks: list[str]
    required_context: list[str]
    timeout_seconds: int = Field(default=30, ge=1, le=300)
    max_retries: int = Field(default=2, ge=0, le=10)
    estimated_cost_category: str = "standard"
    requires_approval: bool = False
    enabled: bool = True


class AgentRoutingDecision(BaseModel):
    primary_goal: str
    selected_agents: list[AgentName]
    execution_mode: ExecutionMode
    reason: str
    matched_keywords: dict[AgentName, list[str]] = Field(default_factory=dict)


class AgentRunCreate(BaseModel):
    goal: str = Field(
        min_length=5,
        max_length=5000,
        description="The cross-domain outcome the Digital Twin should plan for.",
    )
    preferred_agents: list[AgentName] = Field(
        default_factory=list,
        description="Optional agents that must be included in routing.",
    )
    include_weekly_plan: bool = True
    context: dict[str, Any] = Field(
        default_factory=dict,
        description="Non-secret request metadata or execution preferences.",
    )

    @field_validator("goal")
    @classmethod
    def normalize_goal(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 5:
            raise ValueError("Goal must contain at least five meaningful characters.")
        return normalized

    @field_validator("preferred_agents")
    @classmethod
    def remove_duplicate_agents(
        cls,
        value: list[AgentName],
    ) -> list[AgentName]:
        return list(dict.fromkeys(value))

    @field_validator("context")
    @classmethod
    def limit_context_size(cls, value: dict[str, Any]) -> dict[str, Any]:
        encoded = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        if len(encoded.encode("utf-8")) > 20_000:
            raise ValueError("Context must be 20 KB or smaller.")
        return value


class AgentRunExecuteRequest(BaseModel):
    provider: AgentExecutionProvider = AgentExecutionProvider.configured
    allow_partial: bool = True
    allow_fallback: bool = False
    force_sequential: bool = False


class AgentUsage(BaseModel):
    prompt_tokens: int = Field(default=0, ge=0)
    completion_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)
    estimated_cost: float = Field(default=0.0, ge=0)
    model: str | None = None


class AgentContribution(BaseModel):
    summary: str = ""
    key_data_points: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    score: int = Field(default=0, ge=0, le=100)
    confidence: int = Field(default=0, ge=0, le=100)


class UnifiedAgentPlan(BaseModel):
    summary: str = ""
    priorities: list[str] = Field(default_factory=list)
    weekly_plan: list[dict[str, Any]] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    success_metrics: list[str] = Field(default_factory=list)
    next_checkpoint: str = ""
    agent_contributions: dict[AgentName, AgentContribution] = Field(
        default_factory=dict
    )


class AgentStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_run_id: int
    agent_name: AgentName
    step_order: int
    status: AgentStepStatus
    input_payload: dict[str, Any]
    output_payload: dict[str, Any] | None
    error_message: str | None
    attempt_count: int
    timeout_seconds: int
    max_retries: int
    requires_approval: bool
    provider: str | None
    model: str | None
    fallback_used: bool
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost: float
    duration_ms: int
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AgentRunSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    retry_of_run_id: int | None
    goal: str
    status: AgentRunStatus
    execution_mode: ExecutionMode
    execution_provider: str | None
    selected_agents: list[AgentName]
    preferred_agents: list[AgentName]
    include_weekly_plan: bool
    routing_reason: str
    request_payload: dict[str, Any]
    result_payload: dict[str, Any] | None
    error_message: str | None
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost: float
    duration_ms: int
    fallback_count: int
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AgentRunDetail(AgentRunSummary):
    steps: list[AgentStepRead] = Field(default_factory=list)


class AgentRunDeleteResponse(BaseModel):
    message: str
    deleted_run_id: int


class AgentRunCancelResponse(BaseModel):
    message: str
    run: AgentRunDetail
