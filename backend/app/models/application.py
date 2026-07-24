from sqlalchemy import Column, DateTime, Index, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.common import utc_now
from app.models.ownership import UserOwnedMixin


class Application(UserOwnedMixin, Base):
    __tablename__ = "applications"
    __table_args__ = (
        Index(
            "ix_applications_user_status",
            "user_id",
            "status",
        ),
        Index(
            "ix_applications_user_created",
            "user_id",
            "created_at",
        ),
        Index(
            "ix_applications_user_company_role",
            "user_id",
            "company",
            "role",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    location = Column(String, nullable=True)
    status = Column(
        String,
        nullable=False,
        default="Saved",
        server_default="Saved",
    )
    date_applied = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    user = relationship("User", back_populates="applications")
