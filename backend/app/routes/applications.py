from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

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
def get_applications(db: Session = Depends(get_db)):
    return db.query(Application).order_by(Application.id.desc()).all()

@router.post("/")
def create_application(data: ApplicationCreate, db: Session = Depends(get_db)):
    existing_app = (
        db.query(Application)
        .filter(
            Application.company == data.company,
            Application.role == data.role
        )
        .first()
    )

    if existing_app:
        return {
            "error": "This job is already saved in your applications.",
            "existing_application": existing_app
        }

    new_app = Application(
        company=data.company,
        role=data.role,
        location=data.location,
        status=data.status,
        date_applied=data.date_applied,
        notes=data.notes
    )

    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    return new_app

@router.put("/{application_id}")
def update_application(
    application_id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db)
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