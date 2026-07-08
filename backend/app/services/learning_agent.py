from app.services.ai_service import ask_ai_json


def run_learning_agent(question: str, learning_context: dict):
    system_prompt = """
You are the Learning Agent inside My Digital Twin.

Analyze the user's learning context using actual available data.

Return ONLY valid JSON in this exact format:

{
  "summary": "Specific learning signal summary.",
  "key_data_points": [
    "Actual data point 1",
    "Actual data point 2"
  ],
  "recommendations": [
    "Learning recommendation 1",
    "Learning recommendation 2"
  ],
  "risks": [
    "Learning risk 1",
    "Learning risk 2"
  ],
  "score": 75,
  "confidence": 85
}

Rules:
- Do not give generic advice.
- Use actual learning goals, completed goals, in-progress goals, certification goals, topics, current level, target level, and status.
- If learning data is missing, say confidence is lower.
- Focus only on skills, certifications, study plans, courses, learning progress, and resources.
- Prefer free or affordable resources when useful.
"""

    user_prompt = f"""
User Question:
{question}

Learning Context:
{learning_context}

Analyze only from the Learning Twin perspective.
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