from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from app.database import Base

class CareerRoadmap(Base):
    __tablename__ = "career_roadmap"

    id = Column(Integer, primary_key=True, index=True)
    week = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tasks = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)