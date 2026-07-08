from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from app.database import Base


class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    id = Column(Integer, primary_key=True, index=True)

    agent_name = Column(String, unique=True, index=True)

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