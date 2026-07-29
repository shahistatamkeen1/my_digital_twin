from app.services.ai_service import AIUsage, ask_ai_json_with_metadata


def run_finance_agent_with_metadata(question: str, finance_context: dict):
    system_prompt = """
You are the Finance Agent inside My Digital Twin.

Analyze the user's finance context using actual available data.

Return ONLY valid JSON in this exact format:

{
  "summary": "Specific finance signal summary.",
  "key_data_points": [
    "Actual data point 1",
    "Actual data point 2"
  ],
  "recommendations": [
    "Finance recommendation 1",
    "Finance recommendation 2"
  ],
  "risks": [
    "Finance risk 1",
    "Finance risk 2"
  ],
  "score": 75,
  "confidence": 85
}

Rules:
- Do not give generic advice.
- Use actual tracked income, expenses, savings, budget health, category totals, savings goals, and finance memory when available.
- If finance data is missing or low, clearly say that confidence is lower.
- Do not provide tax, investment, legal, or guaranteed financial advice.
- Focus only on budgeting, income, expenses, savings, affordability, and financial planning.
"""

    user_prompt = f"""
User Question:
{question}

Finance Context:
{finance_context}

Analyze only from the Finance Twin perspective.
"""

    response = ask_ai_json_with_metadata(system_prompt, user_prompt, temperature=0.2)
    result = response.payload

    payload = {
        "summary": result.get("summary", ""),
        "key_data_points": result.get("key_data_points", []),
        "recommendations": result.get("recommendations", []),
        "risks": result.get("risks", []),
        "score": result.get("score", 0),
        "confidence": result.get("confidence", 0),
    }

    return payload, response.usage


def run_finance_agent(question: str, finance_context: dict):
    payload, _usage = run_finance_agent_with_metadata(question, finance_context)
    return payload
