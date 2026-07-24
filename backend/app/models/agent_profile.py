from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


class AgentProfile(UserOwnedMixin, Base):
    __tablename__ = "agent_profiles"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "agent_name",
            name="uq_agent_profiles_user_agent",
        ),
        CheckConstraint(
            "confidence_score BETWEEN 0 AND 100",
            name="confidence_score_range",
        ),
        Index(
            "ix_agent_profiles_user_confidence",
            "user_id",
            "confidence_score",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String, index=True, nullable=False)

    learned_preferences = Column(
        Text,
        nullable=False,
        default="{}",
        server_default="{}",
    )
    behavior_patterns = Column(
        Text,
        nullable=False,
        default="{}",
        server_default="{}",
    )
    recurring_goals = Column(
        Text,
        nullable=False,
        default="[]",
        server_default="[]",
    )
    recurring_risks = Column(
        Text,
        nullable=False,
        default="[]",
        server_default="[]",
    )
    decision_style = Column(
        String,
        nullable=False,
        default="Unknown",
        server_default="Unknown",
    )

    confidence_score = Column(
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

    user = relationship("User", back_populates="agent_profiles")
