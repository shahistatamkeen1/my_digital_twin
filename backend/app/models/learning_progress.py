from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base
from app.models.ownership import UserOwnedMixin


class LearningProgress(UserOwnedMixin, Base):
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    task = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)