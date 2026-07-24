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


class AgentReflection(UserOwnedMixin, Base):
    __tablename__ = "agent_reflections"
    __table_args__ = (
        CheckConstraint(
            "confidence_score BETWEEN 0 AND 100",
            name="confidence_score_range",
        ),
        Index(
            "ix_agent_reflections_user_agent_created",
            "user_id",
            "agent_name",
            "created_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    agent_name = Column(String, index=True)
    reflection_type = Column(
        String,
        nullable=False,
        default="daily",
        server_default="daily",
    )

    wins = Column(Text, nullable=False, default="[]", server_default="[]")
    concerns = Column(Text, nullable=False, default="[]", server_default="[]")
    recommendation = Column(
        Text,
        nullable=False,
        default="",
        server_default=text("''"),
    )
    summary = Column(Text, nullable=False, default="", server_default=text("''"))

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

    user = relationship("User", back_populates="agent_reflections")
