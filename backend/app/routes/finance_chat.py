from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import ask_ai
from app.services.finance_context_service import get_finance_context

router = APIRouter()


class FinanceChatRequest(BaseModel):
    message: str


@router.post("/")
def finance_chat(request: FinanceChatRequest, db: Session = Depends(get_db)):
    context = get_finance_context(db)

    system_prompt = """
You are Finance Twin, a practical AI personal finance assistant.

Use the user's Finance Twin context including:
- Finance Memory
- monthly income
- savings goal
- financial goal
- risk level
- budget preference
- transactions
- category spending
- savings goals

Give simple, realistic, safe financial guidance.
Do not provide investment, tax, legal, or guaranteed financial advice.
Keep responses action-focused and easy to understand.
"""

    user_prompt = f"""
Finance Twin Context:
{context}

User Question:
{request.message}
"""

    reply = ask_ai(system_prompt, user_prompt, temperature=0.4)

    return {
        "reply": reply,
        "used_finance_context": True,
    }