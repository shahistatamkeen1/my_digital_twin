from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import generate_application_autofill

router = APIRouter()

class AutofillRequest(BaseModel):
    resume_text: str
    company: str
    role: str
    job_description: str
    career_goal: str = ""

@router.post("/")
def create_autofill_answers(req: AutofillRequest):
    return generate_application_autofill(
        resume_text=req.resume_text,
        company=req.company,
        role=req.role,
        job_description=req.job_description,
        career_goal=req.career_goal
    )