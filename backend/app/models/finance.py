from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class FinanceTransaction(Base):
    __tablename__ = "finance_transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    date = Column(String, nullable=True)
    
class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0)
    deadline = Column(String, nullable=True)
    
class FinanceMemory(Base):
    __tablename__ = "finance_memory"

    id = Column(Integer, primary_key=True, index=True)
    monthly_income = Column(Float, default=0)
    target_monthly_savings = Column(Float, default=0)
    financial_goal = Column(String, nullable=True)
    risk_level = Column(String, nullable=True)
    budget_preference = Column(String, nullable=True)
    notes = Column(String, nullable=True)