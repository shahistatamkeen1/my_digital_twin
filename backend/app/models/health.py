from sqlalchemy import CheckConstraint, Column, Float, Index, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.ownership import UserOwnedMixin


class HealthMemory(UserOwnedMixin, Base):
    __tablename__ = "health_memory"
    __table_args__ = (
        CheckConstraint(
            "sleep_goal_hours BETWEEN 0 AND 24",
            name="sleep_goal_range",
        ),
        CheckConstraint(
            "water_goal_cups BETWEEN 0 AND 100",
            name="water_goal_range",
        ),
        CheckConstraint(
            "workout_goal_minutes BETWEEN 0 AND 1440",
            name="workout_goal_range",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    health_goal = Column(String, nullable=True)
    diet_preference = Column(String, nullable=True)
    fitness_level = Column(String, nullable=True)
    sleep_goal_hours = Column(
        Float,
        nullable=False,
        default=8,
        server_default="8",
    )
    water_goal_cups = Column(
        Integer,
        nullable=False,
        default=8,
        server_default="8",
    )
    workout_goal_minutes = Column(
        Integer,
        nullable=False,
        default=30,
        server_default="30",
    )
    allergies = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="health_memories")


class HealthHabit(UserOwnedMixin, Base):
    __tablename__ = "health_habits"
    __table_args__ = (
        CheckConstraint(
            "sleep_hours BETWEEN 0 AND 24",
            name="sleep_hours_range",
        ),
        CheckConstraint(
            "water_cups BETWEEN 0 AND 100",
            name="water_cups_range",
        ),
        CheckConstraint(
            "workout_minutes BETWEEN 0 AND 1440",
            name="workout_minutes_range",
        ),
        Index(
            "ix_health_habits_user_date",
            "user_id",
            "date",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=True)
    water_cups = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    sleep_hours = Column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )
    workout_minutes = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    mood = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="health_habits")
