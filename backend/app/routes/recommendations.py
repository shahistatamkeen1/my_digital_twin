from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_service import ask_ai_json

router = APIRouter()

class RecommendationRequest(BaseModel):
    resume_text: str
    target_role: str
    experience_level: str
    preferred_location: str
    work_preference: str

@router.post("/")
def get_recommendations(request: RecommendationRequest):
    system_prompt = """
You are Career Twin, an AI career planning agent.
Generate personalized recommendations based on resume and career profile.
"""

    user_prompt = f"""
Return ONLY JSON:
{{
  "career_readiness_score": number from 0 to 100,
  "detected_skills": ["skill1", "skill2"],
  "recommended_roles": ["role1", "role2"],
  "skills_to_improve": ["skill1", "skill2"],
  "resume_suggestions": ["suggestion1", "suggestion2"],
  "next_actions": ["action1", "action2"],
  "note": "short note"
}}

Resume:
{request.resume_text[:6000]}

Career Profile:
Target Role: {request.target_role}
Experience Level: {request.experience_level}
Preferred Location: {request.preferred_location}
Work Preference: {request.work_preference}
"""

    return ask_ai_json(system_prompt, user_prompt)