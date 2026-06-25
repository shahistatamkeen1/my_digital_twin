from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.career_context_service import get_career_context

router = APIRouter()


@router.get("/")
def read_twin_context(db: Session = Depends(get_db)):
    return get_career_context(db)