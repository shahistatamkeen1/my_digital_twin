from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    false,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


class CareerRoadmap(UserOwnedMixin, Base):
    __tablename__ = "career_roadmap"
    __table_args__ = (
        Index(
            "ix_career_roadmap_user_completed",
            "user_id",
            "completed",
        ),
        Index(
            "ix_career_roadmap_user_created",
            "user_id",
            "created_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    week = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tasks = Column(Text, nullable=True)
    completed = Column(
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

    user = relationship("User", back_populates="career_roadmaps")
