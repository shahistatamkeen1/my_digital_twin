from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


class AgentPlan(UserOwnedMixin, Base):
    __tablename__ = "agent_plans"
    __table_args__ = (
        CheckConstraint(
            "completion_percent BETWEEN 0 AND 100",
            name="completion_percent_range",
        ),
        Index(
            "ix_agent_plans_user_status",
            "user_id",
            "status",
        ),
        Index(
            "ix_agent_plans_user_created",
            "user_id",
            "created_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    agent_name = Column(String, index=True)
    plan_type = Column(
        String,
        nullable=False,
        default="7-day",
        server_default="7-day",
    )

    title = Column(String)
    goal = Column(Text)

    tasks = Column(Text, nullable=False, default="[]", server_default="[]")
    completed_tasks = Column(
        Text,
        nullable=False,
        default="[]",
        server_default="[]",
    )

    risks = Column(Text, nullable=False, default="[]", server_default="[]")
    success_metric = Column(
        Text,
        nullable=False,
        default="",
        server_default=text("''"),
    )

    status = Column(
        String,
        nullable=False,
        default="active",
        server_default="active",
    )
    completion_percent = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

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

    user = relationship("User", back_populates="agent_plans")
