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


OUTBOX_STATUS_VALUES = (
    "queued",
    "dispatching",
    "succeeded",
    "failed",
    "cancelled",
    "dead_lettered",
)

OUTBOX_EVENT_VALUES = (
    "queued",
    "dispatch_started",
    "dispatch_succeeded",
    "dispatch_failed",
    "retry_scheduled",
    "cancelled",
    "dead_lettered",
    "stale_requeued",
)


class AgentActionOutbox(UserOwnedMixin, Base):
    __tablename__ = "agent_action_outbox"
    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'dispatching', 'succeeded', 'failed', "
            "'cancelled', 'dead_lettered')",
            name="status_values",
        ),
        CheckConstraint(
            "execution_mode IN ('dry_run')",
            name="execution_mode_values",
        ),
        CheckConstraint("attempt_count >= 0", name="attempt_count_nonnegative"),
        CheckConstraint("max_attempts > 0", name="max_attempts_positive"),
        UniqueConstraint("approval_id", name="uq_agent_action_outbox_approval_id"),
        UniqueConstraint(
            "idempotency_key",
            name="uq_agent_action_outbox_idempotency_key",
        ),
        Index(
            "ix_agent_action_outbox_user_status",
            "user_id",
            "status",
        ),
        Index(
            "ix_agent_action_outbox_run_created",
            "agent_run_id",
            "created_at",
        ),
        Index(
            "ix_agent_action_outbox_ready",
            "status",
            "next_attempt_at",
            "created_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    approval_id = Column(
        Integer,
        ForeignKey("agent_approvals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
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

    idempotency_key = Column(String(255), nullable=False, index=True)
    action_type = Column(String(48), nullable=False, index=True)
    action_summary = Column(Text, nullable=False)
    execution_payload = Column(
        JSON,
        nullable=False,
        default=dict,
        server_default=text("'{}'"),
    )
    execution_mode = Column(
        String(32),
        nullable=False,
        default="dry_run",
        server_default="dry_run",
    )
    status = Column(
        String(32),
        nullable=False,
        default="queued",
        server_default="queued",
        index=True,
    )
    attempt_count = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    max_attempts = Column(
        Integer,
        nullable=False,
        default=3,
        server_default="3",
    )
    last_error = Column(Text, nullable=True)
    result_payload = Column(JSON, nullable=True)
    next_attempt_at = Column(DateTime(timezone=True), nullable=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
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

    approval = relationship("AgentApproval", back_populates="outbox_entry")
    run = relationship("AgentRun", back_populates="outbox_entries")
    step = relationship("AgentStep", back_populates="outbox_entries")
    user = relationship("User", back_populates="agent_action_outbox_entries")
    events = relationship(
        "AgentActionOutboxEvent",
        back_populates="outbox_entry",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="AgentActionOutboxEvent.created_at",
    )


class AgentActionOutboxEvent(UserOwnedMixin, Base):
    __tablename__ = "agent_action_outbox_events"
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('queued', 'dispatch_started', 'dispatch_succeeded', "
            "'dispatch_failed', 'retry_scheduled', 'cancelled', "
            "'dead_lettered', 'stale_requeued')",
            name="event_type_values",
        ),
        Index(
            "ix_agent_action_outbox_events_entry_created",
            "outbox_id",
            "created_at",
        ),
        Index(
            "ix_agent_action_outbox_events_user_created",
            "user_id",
            "created_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    outbox_id = Column(
        Integer,
        ForeignKey("agent_action_outbox.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type = Column(String(32), nullable=False, index=True)
    previous_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=False)
    attempt_number = Column(Integer, nullable=True)
    note = Column(Text, nullable=True)
    event_payload = Column(
        JSON,
        nullable=False,
        default=dict,
        server_default=text("'{}'"),
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    outbox_entry = relationship("AgentActionOutbox", back_populates="events")
    user = relationship("User", back_populates="agent_action_outbox_events")
