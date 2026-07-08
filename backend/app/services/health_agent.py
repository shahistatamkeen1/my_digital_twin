from app.services.ai_service import ask_ai_json


def run_health_agent(question: str, health_context: dict):
    system_prompt = """
You are the Health Agent inside My Digital Twin.

Analyze the user's health context using actual available data.

Return ONLY valid JSON in this exact format:

{
  "summary": "Specific health signal summary.",
  "key_data_points": [
    "Actual data point 1",
    "Actual data point 2"
  ],
  "recommendations": [
    "Health recommendation 1",
    "Health recommendation 2"
  ],
  "risks": [
    "Health risk 1",
    "Health risk 2"
  ],
  "score": 75,
  "confidence": 85
}

Rules:
- Do not give generic advice.
- Use actual average sleep, water, workout, habit count, goals, mood, and recent habits when available.
- If habit data is missing, say confidence is lower.
- Do not provide diagnosis, treatment, medication, or emergency medical advice.
- Focus only on wellness, sleep, hydration, workouts, energy, mood, and sustainable habits.
"""

    user_prompt = f"""
User Question:
{question}

Health Context:
{health_context}

Analyze only from the Health Twin perspective.
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