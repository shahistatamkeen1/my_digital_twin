from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models.learning import LearningMemory

router = APIRouter()


class LearningCreate(BaseModel):
    topic: str
    category: str
    current_level: Optional[str] = "Beginner"
    target_level: Optional[str] = "Intermediate"
    resource: Optional[str] = None
    status: Optional[str] = "In Progress"
    notes: Optional[str] = None


class LearningUpdate(BaseModel):
    topic: Optional[str] = None
    category: Optional[str] = None
    current_level: Optional[str] = None
    target_level: Optional[str] = None
    resource: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class LearningResponse(BaseModel):
    id: int
    topic: str
    category: str
    current_level: Optional[str]
    target_level: Optional[str]
    resource: Optional[str]
    status: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True


@router.post("/", response_model=LearningResponse)
def create_learning_item(item: LearningCreate, db: Session = Depends(get_db)):
    learning_item = LearningMemory(
        topic=item.topic,
        category=item.category,
        current_level=item.current_level,
        target_level=item.target_level,
        resource=item.resource,
        status=item.status,
        notes=item.notes,
    )

    db.add(learning_item)
    db.commit()
    db.refresh(learning_item)

    return learning_item


@router.get("/", response_model=List[LearningResponse])
def get_learning_items(db: Session = Depends(get_db)):
    return db.query(LearningMemory).order_by(LearningMemory.id.desc()).all()


@router.put("/{item_id}", response_model=LearningResponse)
def update_learning_item(
    item_id: int,
    item: LearningUpdate,
    db: Session = Depends(get_db),
):
    learning_item = db.query(LearningMemory).filter(
        LearningMemory.id == item_id
    ).first()

    if not learning_item:
        raise HTTPException(status_code=404, detail="Learning item not found")

    update_data = item.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(learning_item, key, value)

    db.commit()
    db.refresh(learning_item)

    return learning_item


@router.delete("/{item_id}")
def delete_learning_item(item_id: int, db: Session = Depends(get_db)):
    learning_item = db.query(LearningMemory).filter(
        LearningMemory.id == item_id
    ).first()

    if not learning_item:
        raise HTTPException(status_code=404, detail="Learning item not found")

    db.delete(learning_item)
    db.commit()

    return {"message": "Learning item deleted successfully"}