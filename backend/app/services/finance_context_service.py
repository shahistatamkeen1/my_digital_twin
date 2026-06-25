from sqlalchemy.orm import Session

from app.models.finance import FinanceTransaction, SavingsGoal, FinanceMemory


def get_finance_context(db: Session):
    memory = db.query(FinanceMemory).order_by(FinanceMemory.id.desc()).first()
    transactions = db.query(FinanceTransaction).all()
    goals = db.query(SavingsGoal).all()

    tracked_income = sum(t.amount for t in transactions if t.type == "Income")
    tracked_expenses = sum(t.amount for t in transactions if t.type == "Expense")
    tracked_savings = tracked_income - tracked_expenses

    planned_monthly_income = memory.monthly_income if memory else 0
    target_monthly_savings = memory.target_monthly_savings if memory else 0

    budget_health = 0
    if tracked_income > 0:
        budget_health = round((tracked_savings / tracked_income) * 100)

    category_totals = {}

    for transaction in transactions:
        if transaction.type == "Expense":
            category = transaction.category or "Other"
            category_totals[category] = (
                category_totals.get(category, 0) + transaction.amount
            )

    return {
        "finance_memory": {
            "planned_monthly_income": planned_monthly_income,
            "target_monthly_savings": target_monthly_savings,
            "financial_goal": memory.financial_goal if memory else "",
            "risk_level": memory.risk_level if memory else "",
            "budget_preference": memory.budget_preference if memory else "",
            "notes": memory.notes if memory else "",
        },
        "tracked_summary": {
            "tracked_income": tracked_income,
            "tracked_expenses": tracked_expenses,
            "tracked_savings": tracked_savings,
            "budget_health": budget_health,
            "transactions": len(transactions),
        },
        "category_totals": category_totals,
        "savings_goals": [
            {
                "title": goal.title,
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "deadline": goal.deadline,
            }
            for goal in goals
        ],
        "recent_transactions": [
            {
                "type": transaction.type,
                "title": transaction.title,
                "amount": transaction.amount,
                "category": transaction.category,
                "date": transaction.date,
            }
            for transaction in transactions[-10:]
        ],
    }