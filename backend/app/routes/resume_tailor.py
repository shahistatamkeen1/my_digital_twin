from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import tailor_resume_for_job

router = APIRouter()

class ResumeTailorRequest(BaseModel):
    resume_text: str
    job_description: str
    company: str = ""
    role: str = ""

@router.post("/")
def create_tailored_resume(req: ResumeTailorRequest):
    return tailor_resume_for_job(
        resume_text=req.resume_text,
        job_description=req.job_description,
        company=req.company,
        role=req.role
    )