from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, UniqueConstraint

from app.database import Base
from app.models.ownership import UserOwnedMixin


class AgentProfile(UserOwnedMixin, Base):
    __tablename__ = "agent_profiles"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "agent_name",
            name="uq_agent_profiles_user_agent",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String, index=True, nullable=False)

    learned_preferences = Column(Text, default="{}")
    behavior_patterns = Column(Text, default="{}")
    recurring_goals = Column(Text, default="[]")
    recurring_risks = Column(Text, default="[]")
    decision_style = Column(String, default="Unknown")

    confidence_score = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
