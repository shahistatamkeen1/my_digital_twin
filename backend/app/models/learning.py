from sqlalchemy import Column, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.ownership import UserOwnedMixin


class LearningMemory(UserOwnedMixin, Base):
    __tablename__ = "learning_memory"
    __table_args__ = (
        Index(
            "ix_learning_memory_user_status",
            "user_id",
            "status",
        ),
        Index(
            "ix_learning_memory_user_category",
            "user_id",
            "category",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    topic = Column(String, nullable=False)
    category = Column(String, nullable=False)
    current_level = Column(
        String,
        nullable=False,
        default="Beginner",
        server_default="Beginner",
    )
    target_level = Column(
        String,
        nullable=False,
        default="Intermediate",
        server_default="Intermediate",
    )
    resource = Column(Text)
    resource_link = Column(String, nullable=True)
    status = Column(
        String,
        nullable=False,
        default="In Progress",
        server_default="In Progress",
    )
    notes = Column(Text)

    user = relationship("User", back_populates="learning_memories")
