from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_service import ask_ai_json

router = APIRouter()

class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str

@router.post("/")
def job_match(request: JobMatchRequest):
    system_prompt = """
You are an expert recruiter and ATS matching engine.
Score how well a candidate resume matches a job description.
Be realistic and specific.
"""

    user_prompt = f"""
Return ONLY JSON with:
{{
  "match_score": number from 0 to 100,
  "missing_skills": ["skill1", "skill2"],
  "keywords_to_add": ["keyword1", "keyword2"],
  "recommendation": "clear recommendation"
}}

Resume:
{request.resume_text[:6000]}

Job Description:
{request.job_description[:6000]}
"""

    return ask_ai_json(system_prompt, user_prompt)