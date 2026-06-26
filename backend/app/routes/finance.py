from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.finance import FinanceTransaction, SavingsGoal, FinanceMemory
from app.services.ai_service import generate_finance_insight

router = APIRouter()


class FinanceTransactionCreate(BaseModel):
    type: str
    title: str
    amount: float
    category: str
    date: str = ""

class SavingsGoalCreate(BaseModel):
    title: str
    target_amount: float
    current_amount: float = 0
    deadline: str = ""

class FinanceMemoryCreate(BaseModel):
    monthly_income: float = 0
    target_monthly_savings: float = 0
    financial_goal: str = ""
    risk_level: str = ""
    budget_preference: str = ""
    notes: str = ""
    
@router.get("/")
def get_transactions(db: Session = Depends(get_db)):
    return db.query(FinanceTransaction).order_by(FinanceTransaction.id.desc()).all()


@router.post("/")
def create_transaction(
    transaction: FinanceTransactionCreate,
    db: Session = Depends(get_db)
):
    new_transaction = FinanceTransaction(
        type=transaction.type,
        title=transaction.title,
        amount=transaction.amount,
        category=transaction.category,
        date=transaction.date,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = (
        db.query(FinanceTransaction)
        .filter(FinanceTransaction.id == transaction_id)
        .first()
    )

    if not transaction:
        return {"error": "Transaction not found"}

    db.delete(transaction)
    db.commit()

    return {"message": "Transaction deleted"}

@router.get("/summary")
def finance_summary(db: Session = Depends(get_db)):
    transactions = db.query(FinanceTransaction).all()

    income = sum(
        t.amount for t in transactions
        if t.type == "Income"
    )

    expenses = sum(
        t.amount for t in transactions
        if t.type == "Expense"
    )

    savings = income - expenses

    budget_health = 0

    if income > 0:
        budget_health = round((savings / income) * 100)

    return {
        "income": income,
        "expenses": expenses,
        "savings": savings,
        "budget_health": budget_health,
        "transactions": len(transactions)
    }
    
@router.get("/insight")
def finance_insight(db: Session = Depends(get_db)):
    from app.services.finance_context_service import get_finance_context

    context = get_finance_context(db)

    insight = generate_finance_insight(
        finance_summary=context,
        transactions=context.get("recent_transactions", [])
    )

    return {
        "insight": insight
    }
    
@router.get("/category-summary")
def category_summary(db: Session = Depends(get_db)):
    transactions = db.query(FinanceTransaction).all()

    category_totals = {}

    for transaction in transactions:
        if transaction.type == "Expense":
            category = transaction.category or "Other"

            if category not in category_totals:
                category_totals[category] = 0

            category_totals[category] += transaction.amount

    result = [
        {
            "category": category,
            "amount": amount
        }
        for category, amount in category_totals.items()
    ]

    return result

@router.get("/savings-goals")
def get_savings_goals(db: Session = Depends(get_db)):
    return db.query(SavingsGoal).order_by(SavingsGoal.id.desc()).all()


@router.post("/savings-goals")
def create_savings_goal(goal: SavingsGoalCreate, db: Session = Depends(get_db)):
    new_goal = SavingsGoal(
        title=goal.title,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        deadline=goal.deadline,
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return new_goal


@router.delete("/savings-goals/{goal_id}")
def delete_savings_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id).first()

    if not goal:
        return {"error": "Savings goal not found"}

    db.delete(goal)
    db.commit()

    return {"message": "Savings goal deleted"}

@router.get("/memory")
def get_finance_memory(db: Session = Depends(get_db)):
    memory = db.query(FinanceMemory).order_by(FinanceMemory.id.desc()).first()

    if not memory:
        return {
            "monthly_income": 0,
            "target_monthly_savings": 0,
            "financial_goal": "",
            "risk_level": "",
            "budget_preference": "",
            "notes": "",
        }

    return memory


@router.post("/memory")
def save_finance_memory(memory: FinanceMemoryCreate, db: Session = Depends(get_db)):
    existing_memory = db.query(FinanceMemory).order_by(FinanceMemory.id.desc()).first()

    if existing_memory:
        existing_memory.monthly_income = memory.monthly_income
        existing_memory.target_monthly_savings = memory.target_monthly_savings
        existing_memory.financial_goal = memory.financial_goal
        existing_memory.risk_level = memory.risk_level
        existing_memory.budget_preference = memory.budget_preference
        existing_memory.notes = memory.notes

        db.commit()
        db.refresh(existing_memory)

        return existing_memory

    new_memory = FinanceMemory(
        monthly_income=memory.monthly_income,
        target_monthly_savings=memory.target_monthly_savings,
        financial_goal=memory.financial_goal,
        risk_level=memory.risk_level,
        budget_preference=memory.budget_preference,
        notes=memory.notes,
    )

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return new_memory

@router.get("/expenditure-pattern")
def expenditure_pattern(db: Session = Depends(get_db)):
    transactions = db.query(FinanceTransaction).all()

    income = sum(t.amount for t in transactions if t.type == "Income")
    expenses = sum(t.amount for t in transactions if t.type == "Expense")
    savings = income - expenses

    savings_rate = 0
    if income > 0:
        savings_rate = round((savings / income) * 100)

    category_totals = {}

    for transaction in transactions:
        if transaction.type == "Expense":
            category = transaction.category or "Other"
            category_totals[category] = category_totals.get(category, 0) + transaction.amount

    top_category = "No expenses yet"
    top_category_amount = 0

    if category_totals:
        top_category = max(category_totals, key=category_totals.get)
        top_category_amount = category_totals[top_category]

    category_breakdown = [
        {
            "category": category,
            "amount": amount,
            "percent": round((amount / expenses) * 100) if expenses > 0 else 0,
        }
        for category, amount in category_totals.items()
    ]

    spending_alert = "Your spending looks stable."

    if income > 0 and expenses > income * 0.8:
        spending_alert = "Your expenses are using more than 80% of your income. Review non-essential spending."

    if savings_rate >= 50:
        spending_alert = "Excellent savings pattern. You are saving a strong portion of your income."

    return {
        "income": income,
        "expenses": expenses,
        "savings": savings,
        "savings_rate": savings_rate,
        "top_category": top_category,
        "top_category_amount": top_category_amount,
        "category_breakdown": category_breakdown,
        "spending_alert": spending_alert,
    }