from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.database import Base

class CareerMemory(Base):
    __tablename__ = "career_memory"

    id = Column(Integer, primary_key=True, index=True)
    career_goal = Column(Text, nullable=True)
    target_role = Column(String, nullable=True)
    current_skills = Column(Text, nullable=True)
    skills_to_learn = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)