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
    func,
    text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


APPROVAL_STATUS_VALUES = (
    "pending",
    "approved",
    "rejected",
    "cancelled",
    "expired",
)

APPROVAL_ACTION_VALUES = (
    "send_email",
    "create_calendar_event",
    "submit_application",
    "delete_data",
    "change_financial_plan",
    "external_action",
    "other",
)

APPROVAL_EVENT_VALUES = (
    "requested",
    "approved",
    "rejected",
    "cancelled",
    "expired",
)


class AgentApproval(UserOwnedMixin, Base):
    __tablename__ = "agent_approvals"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')",
            name="status_values",
        ),
        CheckConstraint(
            "action_type IN ('send_email', 'create_calendar_event', "
            "'submit_application', 'delete_data', 'change_financial_plan', "
            "'external_action', 'other')",
            name="action_type_values",
        ),
        Index(
            "ix_agent_approvals_user_status",
            "user_id",
            "status",
        ),
        Index(
            "ix_agent_approvals_run_status",
            "agent_run_id",
            "status",
        ),
        Index(
            "ix_agent_approvals_user_requested",
            "user_id",
            "requested_at",
        ),
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

    action_type = Column(String(48), nullable=False, index=True)
    action_summary = Column(Text, nullable=False)
    proposed_payload = Column(
        JSON,
        nullable=False,
        default=dict,
        server_default=text("'{}'"),
    )
    decision_payload = Column(JSON, nullable=True)
    status = Column(
        String(32),
        nullable=False,
        default="pending",
        server_default="pending",
        index=True,
    )
    decision_note = Column(Text, nullable=True)

    requested_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )
    decided_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
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

    run = relationship("AgentRun", back_populates="approvals")
    step = relationship("AgentStep", back_populates="approvals")
    user = relationship("User", back_populates="agent_approvals")
    events = relationship(
        "AgentApprovalEvent",
        back_populates="approval",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="AgentApprovalEvent.created_at",
    )


class AgentApprovalEvent(UserOwnedMixin, Base):
    __tablename__ = "agent_approval_events"
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('requested', 'approved', 'rejected', 'cancelled', 'expired')",
            name="event_type_values",
        ),
        CheckConstraint(
            "new_status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')",
            name="new_status_values",
        ),
        Index(
            "ix_agent_approval_events_user_created",
            "user_id",
            "created_at",
        ),
        Index(
            "ix_agent_approval_events_approval_created",
            "approval_id",
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
    event_type = Column(String(32), nullable=False)
    previous_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=False)
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

    approval = relationship("AgentApproval", back_populates="events")
    user = relationship("User", back_populates="agent_approval_events")
