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


class AgentMemory(UserOwnedMixin, Base):
    __tablename__ = "agent_memory"
    __table_args__ = (
        CheckConstraint(
            "confidence BETWEEN 0 AND 100",
            name="confidence_range",
        ),
        Index(
            "ix_agent_memory_user_agent_created",
            "user_id",
            "agent_name",
            "created_at",
        ),
        Index(
            "ix_agent_memory_user_created",
            "user_id",
            "created_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    agent_name = Column(String, index=True)
    insight_type = Column(
        String,
        nullable=False,
        default="analysis",
        server_default="analysis",
    )

    summary = Column(Text, nullable=False, default="", server_default=text("''"))
    recommendation = Column(Text, nullable=False, default="", server_default=text("''"))
    risks = Column(Text, nullable=False, default="", server_default=text("''"))
    confidence = Column(Integer, nullable=False, default=0, server_default="0")

    source_question = Column(Text, nullable=False, default="", server_default=text("''"))
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    user = relationship("User", back_populates="agent_memories")
