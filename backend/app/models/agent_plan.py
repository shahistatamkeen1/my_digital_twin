from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime

from app.database import Base


class AgentPlan(Base):
    __tablename__ = "agent_plans"

    id = Column(Integer, primary_key=True, index=True)

    agent_name = Column(String, index=True)
    plan_type = Column(String, default="7-day")

    title = Column(String)
    goal = Column(Text)

    tasks = Column(Text, default="[]")
    completed_tasks = Column(Text, default="[]")

    risks = Column(Text, default="[]")
    success_metric = Column(Text, default="")

    status = Column(String, default="active")
    completion_percent = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)