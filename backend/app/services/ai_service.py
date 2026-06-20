import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("OPENAI_API_KEY is missing in backend/.env")

client = OpenAI(api_key=api_key)


# -----------------------------
# Generic AI Chat
# -----------------------------
def ask_ai(system_prompt: str, user_prompt: str, temperature: float = 0.3):

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
    )

    return response.choices[0].message.content


# -----------------------------
# Generic JSON Response
# -----------------------------
def ask_ai_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.2
):

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": system_prompt +
                "\nReturn ONLY valid JSON. No markdown."
            },
            {
                "role": "user",
                "content": user_prompt
            },
        ],
        temperature=temperature,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except Exception:
        return {
            "error": "AI returned invalid JSON",
            "raw_response": content
        }


# -----------------------------
# Interview Prep Generator
# -----------------------------
def get_interview_questions(
    role,
    company,
    job_description=""
):

    prompt = f"""
Generate interview preparation content.

Role:
{role}

Company:
{company}

Job Description:
{job_description}

Return ONLY valid JSON.

Required format:

{{
    "readiness_score": "Generate a realistic score from 60-95 based on role difficulty and job requirements."
    "technical_questions": [],
    "behavioral_questions": [],
    "system_design_questions": [],
    "sample_answers": []
}}
"""

    try:

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert technical interviewer."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )

        content = response.choices[0].message.content

        print("\n========== AI RESPONSE ==========")
        print(content)
        print("=================================\n")

        return json.loads(content)

    except Exception as e:

        print("Interview AI Error:", str(e))

        return {
            "readiness_score": 70,
            "technical_questions": [
                "Unable to generate questions right now."
            ],
            "behavioral_questions": [],
            "system_design_questions": [],
            "sample_answers": []
        }
        
def generate_cover_letter(resume_text, company, role, job_description, career_goal=""):

    system_prompt = """
You are an expert career writer.
Generate a professional one-page cover letter in a clean, formal style.

Use this structure:
1. Header with name and target role
2. Contact line
3. Dear Hiring Manager,
4. Strong opening paragraph
5. Experience and project alignment paragraph
6. Role/company alignment paragraph
7. Closing paragraph
8. Sincerely,
9. Shahista Tamkeen

Keep tone professional, simple, human, and ATS-friendly.
Do not invent false experience.
Use measurable impact when supported by resume.
"""

    user_prompt = f"""
Candidate Name:
Shahista Tamkeen

Contact:
+1 947-275-7946 | stamk0328@365.elmhurst.edu | Chicago, IL, USA | Portfolio | GitHub

Target Role:
{role}

Company:
{company}

Career Goal:
{career_goal}

Resume:
{resume_text[:6000]}

Job Description:
{job_description[:6000]}

Generate the final cover letter as plain text.
"""

    return ask_ai(system_prompt, user_prompt, temperature=0.4)    

def generate_application_autofill(
    resume_text,
    company,
    role,
    job_description,
    career_goal=""
):
    system_prompt = """
You are an AI job application assistant.
Generate concise, professional, human-sounding answers for job application forms.
Use the candidate's resume and career goal.
Do not invent false experience.
Return ONLY valid JSON.
"""

    user_prompt = f"""
Candidate: Shahista Tamkeen

Career Goal:
{career_goal}

Company:
{company}

Role:
{role}

Resume:
{resume_text[:6000]}

Job Description:
{job_description[:6000]}

Return JSON exactly like this:
{{
  "tell_me_about_yourself": "answer",
  "why_this_role": "answer",
  "why_this_company": "answer",
  "why_should_we_hire_you": "answer",
  "work_authorization": "answer",
  "sponsorship": "answer",
  "salary_expectation": "answer",
  "availability": "answer",
  "additional_information": "answer"
}}
"""

    return ask_ai_json(system_prompt, user_prompt, temperature=0.3)  