from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class LearningMemory(Base):
    __tablename__ = "learning_memory"

    id = Column(Integer, primary_key=True, index=True)

    topic = Column(String, nullable=False)

    category = Column(String, nullable=False)

    current_level = Column(String, default="Beginner")

    target_level = Column(String, default="Intermediate")

    resource = Column(Text)

    status = Column(String, default="In Progress")

    notes = Column(Text)