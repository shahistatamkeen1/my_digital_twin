from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from app.database import Base
from app.models.ownership import UserOwnedMixin


class AgentMemory(UserOwnedMixin, Base):
    __tablename__ = "agent_memory"

    id = Column(Integer, primary_key=True, index=True)

    agent_name = Column(String, index=True)
    insight_type = Column(String, default="analysis")

    summary = Column(Text, default="")
    recommendation = Column(Text, default="")
    risks = Column(Text, default="")
    confidence = Column(Integer, default=0)

    source_question = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)