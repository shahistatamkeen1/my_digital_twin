from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime

from app.database import Base


class AgentReflection(Base):
    __tablename__ = "agent_reflections"

    id = Column(Integer, primary_key=True, index=True)

    agent_name = Column(String, index=True)
    reflection_type = Column(String, default="daily")

    wins = Column(Text, default="[]")
    concerns = Column(Text, default="[]")
    recommendation = Column(Text, default="")
    summary = Column(Text, default="")

    confidence_score = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)