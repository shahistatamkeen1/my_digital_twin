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

def generate_custom_autofill_answers(
    resume_text,
    target_role,
    career_goal,
    detected_questions
):
    system_prompt = """
You are an AI job application autofill assistant.
Generate professional, concise answers for each detected application field.
Do not invent false information.
If a question asks for sensitive or unavailable information, give a safe placeholder answer.
Return ONLY valid JSON.
"""

    user_prompt = f"""
Candidate: Shahista Tamkeen

Target Role:
{target_role}

Career Goal:
{career_goal}

Resume:
{resume_text[:6000]}

Detected Application Fields / Questions:
{detected_questions}

Return JSON exactly like this:
{{
  "answers": [
    {{
      "question": "original detected question",
      "answer": "professional answer"
    }}
  ]
}}
"""

    return ask_ai_json(system_prompt, user_prompt, temperature=0.3)

def tailor_resume_for_job(resume_text, job_description, company="", role=""):
    system_prompt = """
You are an expert ATS resume tailoring agent.
Tailor the candidate's resume for a specific job description.
Do not invent false experience.
Use only the candidate's real skills and projects.
Return ONLY valid JSON.
"""

    user_prompt = f"""
Company:
{company}

Role:
{role}

Resume:
{resume_text[:7000]}

Job Description:
{job_description[:7000]}

Return JSON exactly like this:
{{
  "tailored_resume_score": 0,
  "target_role": "role",
  "keywords_added": [],
  "optimized_summary": "summary",
  "optimized_skills": [],
  "optimized_experience_bullets": [],
  "recommended_projects_to_highlight": [],
  "missing_gaps": [],
  "final_notes": "short note"
}}
"""

    return ask_ai_json(system_prompt, user_prompt, temperature=0.3)

def generate_finance_insight(finance_summary, transactions):
    system_prompt = """
You are Finance Twin, an AI personal finance assistant.

Analyze the user's complete Finance Twin context:
- finance memory
- income
- expenses
- savings
- budget health
- spending categories
- savings goals
- recent transactions

Give practical, simple, safe financial guidance.

Do not provide investment, tax, legal, or guaranteed financial advice.

Format your response with:
1. Short overall assessment
2. What looks good
3. What needs attention
4. 3 clear action steps
"""

    user_prompt = f"""
Finance Twin Context:
{finance_summary}

Recent Transactions:
{transactions}

Generate a personalized Finance Twin insight.
"""

    return ask_ai(system_prompt, user_prompt, temperature=0.4)

def generate_health_insight(health_context):
    system_prompt = """
You are Health Twin, an AI wellness assistant.

Analyze the user's health memory and daily habit history.
Give practical, simple, safe wellness guidance.

Do not provide medical diagnosis, treatment, medication advice, or emergency advice.
If the user has serious symptoms, tell them to contact a healthcare professional.

Format:
1. Overall wellness summary
2. What looks good
3. What needs attention
4. 3 simple action steps
"""

    user_prompt = f"""
Health Twin Context:
{health_context}

Generate a personalized health insight.
"""

    return ask_ai(system_prompt, user_prompt, temperature=0.4)

def generate_health_diet_plan(context, location, budget_level, schedule_notes):
    system_prompt = """
You are Health Twin, an AI wellness and diet planning assistant.

Use the user's Career Twin, Finance Twin, and Health Twin context to recommend a practical diet plan.

Consider:
- work/career workload
- financial budget
- health goals
- diet preference
- allergies
- sleep/workout habits
- location/community search needs

Do not provide medical diagnosis or treatment.
Do not claim to know real-time store inventory or prices.
Recommend affordable grocery stores, farmers markets, and healthy food places using local search categories.

For local_searches, include affordable and practical options such as:
- Aldi groceries
- Walmart groceries
- Trader Joe's
- Costco
- local farmers market
- health food store
- meal prep restaurant
- Indian grocery store if useful
- Mediterranean grocery store if useful

Return ONLY valid JSON with:
{
  "diet_title": "",
  "summary": "",
  "daily_schedule": [],
  "meal_plan": [],
  "grocery_items": [],
  "local_searches": [
  {
    "label": "Aldi Affordable Groceries",
    "query": "Aldi groceries"
  },
  {
    "label": "Walmart Grocery Pickup",
    "query": "Walmart groceries"
  },
  {
    "label": "Trader Joe's Healthy Groceries",
    "query": "Trader Joe's"
  },
  {
    "label": "Local Farmers Market",
    "query": "farmers market"
  },
  {
    "label": "Meal Prep Restaurants",
    "query": "healthy meal prep restaurant"
  }
],
  "budget_tip": "",
  "health_note": ""
}
"""

    user_prompt = f"""
User Context:
{context}

User Location or Area:
{location}

Budget Level:
{budget_level}

Work Schedule Notes:
{schedule_notes}

Generate a personalized diet plan.
"""

    return ask_ai_json(system_prompt, user_prompt, temperature=0.3)

def generate_investment_plan(context, available_savings, risk_level, goal, time_horizon):
    system_prompt = """
You are Finance Twin, an educational personal finance planning assistant.

Create a practical investment planning response based on:
- available savings
- risk level
- financial goal
- time horizon
- income, expenses, savings, and finance memory

Important safety rules:
- Do not guarantee profits.
- Do not claim any stock will be most profitable.
- Do not give personalized financial advice as a licensed advisor.
- Present options as educational ideas only.
- Encourage emergency fund and diversification.
- If mentioning stocks, present them as watchlist ideas, not buy recommendations.
- Include ETFs and low-risk options when appropriate.

Return ONLY valid JSON:
{
  "plan_title": "",
  "summary": "",
  "emergency_fund_note": "",
  "suggested_allocation": [],
  "investment_options": [],
  "stock_watchlist": [],
  "next_steps": [],
  "risk_note": ""
}
"""

    user_prompt = f"""
Finance Context:
{context}

Available Savings:
{available_savings}

Risk Level:
{risk_level}

Goal:
{goal}

Time Horizon:
{time_horizon}

Generate an educational investment plan.
"""

    return ask_ai_json(system_prompt, user_prompt, temperature=0.3)

def generate_daily_brief(context):
    system_prompt = """
You are the Daily Brief agent inside My Digital Twin.

Create a clear daily executive brief using:
- Personal Memory
- Career Twin
- Finance Twin
- Health Twin
- Focus Scores

Do not dump raw JSON.
Be concise, motivational, and practical.

Return ONLY valid JSON:
{
  "greeting": "",
  "overview": "",
  "career_focus": "",
  "finance_focus": "",
  "health_focus": "",
  "highest_roi_action": "",
  "risk_alert": "",
  "today_plan": [],
  "closing_note": ""
}
"""

    user_prompt = f"""
Digital Twin Context:
{context}

Generate today's personalized Daily Brief.
"""

    return ask_ai_json(system_prompt, user_prompt, temperature=0.3)