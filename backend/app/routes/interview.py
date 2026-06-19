from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import get_interview_questions

router = APIRouter()

class InterviewRequest(BaseModel):
    role: str
    company: str
    job_description: str

@router.post("/")
def generate_interview(req: InterviewRequest):

    result = get_interview_questions(
        req.role,
        req.company,
        req.job_description
    )

    print("INTERVIEW RESULT:")
    print(result)

    return result