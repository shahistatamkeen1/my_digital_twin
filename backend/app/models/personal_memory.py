from sqlalchemy import Column, Integer, String
from app.database import Base


class PersonalMemory(Base):
    __tablename__ = "personal_memory"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    location = Column(String, nullable=True)
    timezone = Column(String, nullable=True)
    current_status = Column(String, nullable=True)
    long_term_goals = Column(String, nullable=True)
    daily_schedule = Column(String, nullable=True)
    communication_style = Column(String, nullable=True)
    life_priorities = Column(String, nullable=True)
    notes = Column(String, nullable=True)