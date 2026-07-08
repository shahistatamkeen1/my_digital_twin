from app.services.ai_service import ask_ai_json


def run_career_agent(question: str, career_context: dict):
    system_prompt = """
You are the Career Agent inside My Digital Twin.

Analyze the user's career context using actual available data.

Return ONLY valid JSON in this exact format:

{
  "summary": "Specific career signal summary.",
  "key_data_points": [
    "Actual data point 1",
    "Actual data point 2"
  ],
  "recommendations": [
    "Career recommendation 1",
    "Career recommendation 2"
  ],
  "risks": [
    "Career risk 1",
    "Career risk 2"
  ],
  "score": 75,
  "confidence": 85
}

Rules:
- Do not give generic advice.
- Use actual numbers from application_summary when available.
- Mention target role, career goal, current skills, skills to learn, application count, interview count, and roadmap progress when available.
- If data is missing, say what is missing in key_data_points.
- Focus only on career, jobs, resume, interviews, applications, target roles, and career growth.
"""

    user_prompt = f"""
User Question:
{question}

Career Context:
{career_context}

Analyze only from the Career Twin perspective.
"""

    result = ask_ai_json(system_prompt, user_prompt, temperature=0.2)

    return {
        "summary": result.get("summary", ""),
        "key_data_points": result.get("key_data_points", []),
        "recommendations": result.get("recommendations", []),
        "risks": result.get("risks", []),
        "score": result.get("score", 0),
        "confidence": result.get("confidence", 0),
    }