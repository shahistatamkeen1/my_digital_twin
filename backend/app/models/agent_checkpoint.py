from __future__ import annotations

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


CHECKPOINT_STATUS_VALUES = (
    "pending",
    "resumed",
    "skipped",
    "cancelled",
    "expired",
)

REJECTION_POLICY_VALUES = (
    "skip_and_continue",
    "stop_workflow",
)

WORKFLOW_EVENT_VALUES = (
    "workflow_started",
    "approval_requested",
    "workflow_paused",
    "approval_approved",
    "approval_rejected",
    "approval_cancelled",
    "approval_expired",
    "workflow_resumed",
    "step_skipped",
    "workflow_synthesizing",
    "workflow_completed",
    "workflow_failed",
    "workflow_cancelled",
)


class AgentCheckpoint(UserOwnedMixin, Base):
    __tablename__ = "agent_checkpoints"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'resumed', 'skipped', 'cancelled', 'expired')",
            name="status_values",
        ),
        CheckConstraint(
            "rejection_policy IN ('skip_and_continue', 'stop_workflow')",
            name="rejection_policy_values",
        ),
        CheckConstraint("checkpoint_version > 0", name="version_positive"),
        CheckConstraint("resume_count >= 0", name="resume_count_nonnegative"),
        UniqueConstraint("execution_key", name="uq_agent_checkpoints_execution_key"),
        Index("ix_agent_checkpoints_run_status", "agent_run_id", "status"),
        Index("ix_agent_checkpoints_user_created", "user_id", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    agent_run_id = Column(
        Integer,
        ForeignKey("agent_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_step_id = Column(
        Integer,
        ForeignKey("agent_steps.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    approval_id = Column(
        Integer,
        ForeignKey("agent_approvals.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    checkpoint_type = Column(
        String(48),
        nullable=False,
        default="approval_gate",
        server_default="approval_gate",
    )
    execution_key = Column(String(255), nullable=False, unique=True, index=True)
    status = Column(
        String(32),
        nullable=False,
        default="pending",
        server_default="pending",
        index=True,
    )
    rejection_policy = Column(
        String(32),
        nullable=False,
        default="skip_and_continue",
        server_default="skip_and_continue",
    )
    workflow_state = Column(
        JSON,
        nullable=False,
        default=dict,
        server_default=text("'{}'"),
    )
    resume_payload = Column(JSON, nullable=True)
    checkpoint_version = Column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )
    resume_count = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    resumed_at = Column(DateTime(timezone=True), nullable=True)
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

    run = relationship("AgentRun", back_populates="checkpoints")
    step = relationship("AgentStep", back_populates="checkpoints")
    approval = relationship("AgentApproval")
    user = relationship("User", back_populates="agent_checkpoints")


class AgentWorkflowEvent(UserOwnedMixin, Base):
    __tablename__ = "agent_workflow_events"
    __table_args__ = (
        CheckConstraint(
            "event_type IN ("
            "'workflow_started', 'approval_requested', 'workflow_paused', "
            "'approval_approved', 'approval_rejected', 'approval_cancelled', "
            "'approval_expired', 'workflow_resumed', 'step_skipped', "
            "'workflow_synthesizing', 'workflow_completed', 'workflow_failed', "
            "'workflow_cancelled')",
            name="event_type_values",
        ),
        Index("ix_agent_workflow_events_run_created", "agent_run_id", "created_at"),
        Index("ix_agent_workflow_events_user_created", "user_id", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    agent_run_id = Column(
        Integer,
        ForeignKey("agent_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_step_id = Column(
        Integer,
        ForeignKey("agent_steps.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    approval_id = Column(
        Integer,
        ForeignKey("agent_approvals.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    event_type = Column(String(48), nullable=False, index=True)
    event_payload = Column(
        JSON,
        nullable=False,
        default=dict,
        server_default=text("'{}'"),
    )
    note = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    run = relationship("AgentRun", back_populates="workflow_events")
    user = relationship("User", back_populates="agent_workflow_events")
