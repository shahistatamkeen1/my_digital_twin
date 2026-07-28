from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.pagination import (
    SortOrder,
    apply_sort,
    apply_text_search,
    paginate_query,
)
from app.config import settings
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
    resource_link: Optional[str] = None
    status: Optional[str] = "In Progress"
    notes: Optional[str] = None


class LearningUpdate(BaseModel):
    topic: Optional[str] = None
    category: Optional[str] = None
    current_level: Optional[str] = None
    target_level: Optional[str] = None
    resource: Optional[str] = None
    resource_link: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class LearningResponse(BaseModel):
    id: int
    topic: str
    category: str
    current_level: Optional[str]
    target_level: Optional[str]
    resource: Optional[str]
    resource_link: Optional[str]
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
        resource_link=item.resource_link,
        status=item.status,
        notes=item.notes,
    )

    db.add(learning_item)
    db.commit()
    db.refresh(learning_item)

    return learning_item


@router.get("/", response_model=None)
def get_learning_items(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=200,
        description="Search topic, category, resource, or notes.",
    ),
    category: str | None = Query(default=None, max_length=100),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        max_length=50,
    ),
    current_level: str | None = Query(default=None, max_length=50),
    target_level: str | None = Query(default=None, max_length=50),
    sort_by: str = Query(
        default="id",
        pattern="^(id|topic|category|current_level|target_level|status)$",
    ),
    sort_order: SortOrder = Query(default=SortOrder.desc),
    page: int | None = Query(default=None, ge=1),
    page_size: int | None = Query(
        default=None,
        ge=1,
        le=settings.api_max_page_size,
    ),
):
    query = db.query(LearningMemory)
    query = apply_text_search(
        query,
        search,
        (
            LearningMemory.topic,
            LearningMemory.category,
            LearningMemory.resource,
            LearningMemory.notes,
        ),
    )

    if category:
        query = query.filter(LearningMemory.category == category)
    if status_filter:
        query = query.filter(LearningMemory.status == status_filter)
    if current_level:
        query = query.filter(LearningMemory.current_level == current_level)
    if target_level:
        query = query.filter(LearningMemory.target_level == target_level)

    query = apply_sort(
        query,
        LearningMemory,
        sort_by=sort_by,
        sort_order=sort_order,
        allowed_fields=(
            "id",
            "topic",
            "category",
            "current_level",
            "target_level",
            "status",
        ),
        default_field="id",
    )

    return paginate_query(
        query,
        request=request,
        response=response,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


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