from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Integer, String, false, func, true
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(320), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    hashed_password = Column(String(512), nullable=False)
    role = Column(
        String(32),
        nullable=False,
        default="user",
        server_default="user",
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )
    is_verified = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
    )
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    career_memories = relationship(
        "CareerMemory",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    career_roadmaps = relationship(
        "CareerRoadmap",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    finance_transactions = relationship(
        "FinanceTransaction",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    savings_goals = relationship(
        "SavingsGoal",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    finance_memories = relationship(
        "FinanceMemory",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    health_memories = relationship(
        "HealthMemory",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    health_habits = relationship(
        "HealthHabit",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    learning_memories = relationship(
        "LearningMemory",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    learning_progress_items = relationship(
        "LearningProgress",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    personal_memories = relationship(
        "PersonalMemory",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    agent_memories = relationship(
        "AgentMemory",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    agent_plans = relationship(
        "AgentPlan",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    agent_profiles = relationship(
        "AgentProfile",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    agent_reflections = relationship(
        "AgentReflection",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    agent_runs = relationship(
        "AgentRun",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    agent_steps = relationship(
        "AgentStep",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    agent_approvals = relationship(
        "AgentApproval",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    agent_approval_events = relationship(
        "AgentApprovalEvent",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    twin_progress_snapshots = relationship(
        "TwinProgressSnapshot",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
