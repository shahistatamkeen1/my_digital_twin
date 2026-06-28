from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.master_context_service import get_master_context

router = APIRouter()


@router.get("/")
def read_master_context(db: Session = Depends(get_db)):
    return get_master_context(db)