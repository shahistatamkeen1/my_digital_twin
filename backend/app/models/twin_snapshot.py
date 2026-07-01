# backend/app/models/twin_snapshot.py

from sqlalchemy import Column, Integer, DateTime
from datetime import datetime

from app.database import Base


class TwinProgressSnapshot(Base):
    __tablename__ = "twin_progress_snapshots"

    id = Column(Integer, primary_key=True, index=True)

    career_score = Column(Integer, default=0)
    finance_score = Column(Integer, default=0)
    health_score = Column(Integer, default=0)
    learning_score = Column(Integer, default=0)

    overall_score = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)