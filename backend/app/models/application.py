from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    location = Column(String, nullable=True)
    status = Column(String, default="Saved")
    date_applied = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)