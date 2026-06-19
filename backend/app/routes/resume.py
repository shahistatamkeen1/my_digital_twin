from fastapi import APIRouter, UploadFile, File
from pypdf import PdfReader
import tempfile

from app.services.ai_service import ask_ai_json

router = APIRouter()

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
        temp.write(await file.read())
        temp_path = temp.name

    reader = PdfReader(temp_path)
    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    system_prompt = """
You are an expert technical recruiter and career coach.
Analyze resumes for software, data, cloud, and AI roles.
"""

    user_prompt = f"""
Analyze this resume and return JSON with:
{{
  "resume_score": number from 0 to 100,
  "top_skills": ["skill1", "skill2"],
  "recommended_roles": ["role1", "role2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvement_suggestions": ["suggestion1", "suggestion2"]
}}

Resume:
{text[:7000]}
"""

    analysis = ask_ai_json(system_prompt, user_prompt)

    return {
        "filename": file.filename,
        "text": text[:5000],
        "analysis": analysis
    }