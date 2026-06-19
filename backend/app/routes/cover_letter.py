from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import generate_cover_letter

router = APIRouter()

class CoverLetterRequest(BaseModel):
    resume_text: str
    company: str
    role: str
    job_description: str
    career_goal: str = ""

@router.post("/")
def create_cover_letter(req: CoverLetterRequest):
    cover_letter = generate_cover_letter(
        resume_text=req.resume_text,
        company=req.company,
        role=req.role,
        job_description=req.job_description,
        career_goal=req.career_goal
    )

    return {
        "cover_letter": cover_letter
    }