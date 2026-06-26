from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class HealthMemory(Base):
    __tablename__ = "health_memory"

    id = Column(Integer, primary_key=True, index=True)
    health_goal = Column(String, nullable=True)
    diet_preference = Column(String, nullable=True)
    fitness_level = Column(String, nullable=True)
    sleep_goal_hours = Column(Float, default=8)
    water_goal_cups = Column(Integer, default=8)
    workout_goal_minutes = Column(Integer, default=30)
    allergies = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    
class HealthHabit(Base):
    __tablename__ = "health_habits"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=True)
    water_cups = Column(Integer, default=0)
    sleep_hours = Column(Float, default=0)
    workout_minutes = Column(Integer, default=0)
    mood = Column(String, nullable=True)
    notes = Column(String, nullable=True)