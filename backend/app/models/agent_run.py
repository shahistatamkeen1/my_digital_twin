from __future__ import annotations

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    false,
    func,
    text,
    true,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


class AgentRun(UserOwnedMixin, Base):
    __tablename__ = "agent_runs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('planned', 'running', 'completed', 'failed', 'cancelled')",
            name="status_values",
        ),
        CheckConstraint(
            "execution_mode IN ('single_agent', 'parallel_then_synthesize', 'sequential')",
            name="execution_mode_values",
        ),
        CheckConstraint("total_tokens >= 0", name="total_tokens_nonnegative"),
        CheckConstraint(
            "estimated_cost >= 0",
            name="estimated_cost_nonnegative",
        ),
        Index("ix_agent_runs_user_status", "user_id", "status"),
        Index("ix_agent_runs_user_created", "user_id", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    retry_of_run_id = Column(
        Integer,
        ForeignKey("agent_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    goal = Column(Text, nullable=False)
    status = Column(
        String(32),
        nullable=False,
        default="planned",
        server_default="planned",
    )
    execution_mode = Column(
        String(48),
        nullable=False,
        default="parallel_then_synthesize",
        server_default="parallel_then_synthesize",
    )
    selected_agents = Column(
        JSON,
        nullable=False,
        default=list,
        server_default=text("'[]'"),
    )
    preferred_agents = Column(
        JSON,
        nullable=False,
        default=list,
        server_default=text("'[]'"),
    )
    include_weekly_plan = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )
    routing_reason = Column(
        Text,
        nullable=False,
        default="",
        server_default=text("''"),
    )
    request_payload = Column(
        JSON,
        nullable=False,
        default=dict,
        server_default=text("'{}'"),
    )
    result_payload = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    total_tokens = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    estimated_cost = Column(
        Float,
        nullable=False,
        default=0.0,
        server_default="0",
    )

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
    )

    user = relationship("User", back_populates="agent_runs")
    steps = relationship(
        "AgentStep",
        back_populates="run",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="AgentStep.step_order",
    )


class AgentStep(UserOwnedMixin, Base):
    __tablename__ = "agent_steps"
    __table_args__ = (
        CheckConstraint(
            "status IN ('planned', 'running', 'completed', 'failed', 'skipped', 'cancelled')",
            name="status_values",
        ),
        CheckConstraint("step_order > 0", name="step_order_positive"),
        CheckConstraint("attempt_count >= 0", name="attempt_count_nonnegative"),
        CheckConstraint("timeout_seconds > 0", name="timeout_seconds_positive"),
        CheckConstraint("max_retries >= 0", name="max_retries_nonnegative"),
        UniqueConstraint(
            "agent_run_id",
            "step_order",
            name="uq_agent_steps_run_step_order",
        ),
        Index(
            "ix_agent_steps_user_status",
            "user_id",
            "status",
        ),
        Index(
            "ix_agent_steps_run_agent",
            "agent_run_id",
            "agent_name",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    agent_run_id = Column(
        Integer,
        ForeignKey("agent_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_name = Column(String(32), nullable=False, index=True)
    step_order = Column(Integer, nullable=False)
    status = Column(
        String(32),
        nullable=False,
        default="planned",
        server_default="planned",
    )
    input_payload = Column(
        JSON,
        nullable=False,
        default=dict,
        server_default=text("'{}'"),
    )
    output_payload = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    attempt_count = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    timeout_seconds = Column(
        Integer,
        nullable=False,
        default=30,
        server_default="30",
    )
    max_retries = Column(
        Integer,
        nullable=False,
        default=2,
        server_default="2",
    )
    requires_approval = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
    )

    run = relationship("AgentRun", back_populates="steps")
    user = relationship("User", back_populates="agent_steps")
