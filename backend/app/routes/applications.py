from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.pagination import (
    SortOrder,
    apply_sort,
    apply_text_search,
    paginate_query,
)
from app.config import settings
from app.database import get_db
from app.models.application import Application


router = APIRouter()


class ApplicationCreate(BaseModel):
    company: str
    role: str
    location: Optional[str] = ""
    status: Optional[str] = "Saved"
    date_applied: Optional[str] = ""
    notes: Optional[str] = ""


class ApplicationUpdate(BaseModel):
    status: str


@router.get("/")
def get_applications(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=200,
        description="Search company, role, location, or notes.",
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        max_length=50,
    ),
    location: str | None = Query(default=None, max_length=200),
    date_from: str | None = Query(default=None, max_length=20),
    date_to: str | None = Query(default=None, max_length=20),
    sort_by: str = Query(
        default="id",
        pattern="^(id|company|role|location|status|date_applied|created_at)$",
    ),
    sort_order: SortOrder = Query(default=SortOrder.desc),
    page: int | None = Query(default=None, ge=1),
    page_size: int | None = Query(
        default=None,
        ge=1,
        le=settings.api_max_page_size,
    ),
):
    query = db.query(Application)
    query = apply_text_search(
        query,
        search,
        (
            Application.company,
            Application.role,
            Application.location,
            Application.notes,
        ),
    )

    if status_filter:
        query = query.filter(Application.status == status_filter)
    if location:
        query = query.filter(Application.location.ilike(f"%{location.strip()}%"))
    if date_from:
        query = query.filter(Application.date_applied >= date_from)
    if date_to:
        query = query.filter(Application.date_applied <= date_to)

    query = apply_sort(
        query,
        Application,
        sort_by=sort_by,
        sort_order=sort_order,
        allowed_fields=(
            "id",
            "company",
            "role",
            "location",
            "status",
            "date_applied",
            "created_at",
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


@router.post("/")
def create_application(data: ApplicationCreate, db: Session = Depends(get_db)):
    existing_app = (
        db.query(Application)
        .filter(
            Application.company == data.company,
            Application.role == data.role,
        )
        .first()
    )

    if existing_app:
        return {
            "error": "This job is already saved in your applications.",
            "existing_application": existing_app,
        }

    new_app = Application(
        company=data.company,
        role=data.role,
        location=data.location,
        status=data.status,
        date_applied=data.date_applied,
        notes=data.notes,
    )

    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    return new_app


@router.put("/{application_id}")
def update_application(
    application_id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == application_id).first()

    if not app:
        return {"error": "Application not found"}

    app.status = data.status
    db.commit()
    db.refresh(app)

    return app


@router.delete("/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()

    if not app:
        return {"error": "Application not found"}

    db.delete(app)
    db.commit()

    return {"message": "Application deleted successfully"}
