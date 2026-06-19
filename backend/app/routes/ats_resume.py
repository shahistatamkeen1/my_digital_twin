from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_service import ask_ai_json

router = APIRouter()

class ATSRequest(BaseModel):
    resume_text: str
    job_description: str

@router.post("/")
def optimize_resume(request: ATSRequest):
    system_prompt = """
You are an ATS resume optimization expert.
Compare the resume against the job description and produce practical resume improvements.
"""

    user_prompt = f"""
Return ONLY JSON with this structure:
{{
  "ats_score": number from 0 to 100,
  "missing_keywords": ["keyword1", "keyword2"],
  "keywords_to_add": ["keyword1", "keyword2"],
  "optimized_summary": "short optimized resume summary",
  "optimized_bullets": ["bullet1", "bullet2", "bullet3"],
  "note": "short note"
}}

Resume:
{request.resume_text[:6000]}

Job Description:
{request.job_description[:6000]}
"""

    return ask_ai_json(system_prompt, user_prompt)