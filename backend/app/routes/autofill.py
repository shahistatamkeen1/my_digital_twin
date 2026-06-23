from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.ai_service import (
    generate_application_autofill,
    generate_custom_autofill_answers
)

router = APIRouter()

class AutofillRequest(BaseModel):
    resume_text: str
    company: str
    role: str
    job_description: str
    career_goal: str = ""

class CustomAutofillRequest(BaseModel):
    resume_text: str
    target_role: str
    career_goal: str = ""
    detected_questions: List[str]

@router.post("/")
def create_autofill_answers(req: AutofillRequest):
    return generate_application_autofill(
        resume_text=req.resume_text,
        company=req.company,
        role=req.role,
        job_description=req.job_description,
        career_goal=req.career_goal
    )

@router.post("/custom")
def create_custom_autofill_answers(req: CustomAutofillRequest):
    return generate_custom_autofill_answers(
        resume_text=req.resume_text,
        target_role=req.target_role,
        career_goal=req.career_goal,
        detected_questions=req.detected_questions
    )