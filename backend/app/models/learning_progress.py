from sqlalchemy import Boolean, Column, DateTime, Index, Integer, String, false, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


class LearningProgress(UserOwnedMixin, Base):
    __tablename__ = "learning_progress"
    __table_args__ = (
        Index(
            "ix_learning_progress_user_completed",
            "user_id",
            "completed",
        ),
        Index(
            "ix_learning_progress_user_created",
            "user_id",
            "created_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    task = Column(String, nullable=False)
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

    user = relationship("User", back_populates="learning_progress_items")
