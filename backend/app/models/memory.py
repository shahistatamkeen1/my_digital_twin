from sqlalchemy import Column, DateTime, Index, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


class CareerMemory(UserOwnedMixin, Base):
    __tablename__ = "career_memory"
    __table_args__ = (
        Index(
            "ix_career_memory_user_created",
            "user_id",
            "created_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    career_goal = Column(Text, nullable=True)
    target_role = Column(String, nullable=True)
    current_skills = Column(Text, nullable=True)
    skills_to_learn = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    user = relationship("User", back_populates="career_memories")
