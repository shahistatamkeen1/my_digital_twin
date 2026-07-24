from sqlalchemy import CheckConstraint, Column, DateTime, Index, Integer, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


class TwinProgressSnapshot(UserOwnedMixin, Base):
    __tablename__ = "twin_progress_snapshots"
    __table_args__ = (
        CheckConstraint(
            "career_score BETWEEN 0 AND 100",
            name="career_score_range",
        ),
        CheckConstraint(
            "finance_score BETWEEN 0 AND 100",
            name="finance_score_range",
        ),
        CheckConstraint(
            "health_score BETWEEN 0 AND 100",
            name="health_score_range",
        ),
        CheckConstraint(
            "learning_score BETWEEN 0 AND 100",
            name="learning_score_range",
        ),
        CheckConstraint(
            "overall_score BETWEEN 0 AND 100",
            name="overall_score_range",
        ),
        Index(
            "ix_twin_progress_snapshots_user_created",
            "user_id",
            "created_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    career_score = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    finance_score = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    health_score = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    learning_score = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    overall_score = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    user = relationship("User", back_populates="twin_progress_snapshots")
