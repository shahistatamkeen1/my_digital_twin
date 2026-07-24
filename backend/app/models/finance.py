from sqlalchemy import CheckConstraint, Column, Float, Index, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.ownership import UserOwnedMixin


class FinanceTransaction(UserOwnedMixin, Base):
    __tablename__ = "finance_transactions"
    __table_args__ = (
        CheckConstraint(
            "amount >= 0",
            name="amount_nonnegative",
        ),
        Index(
            "ix_finance_transactions_user_date",
            "user_id",
            "date",
        ),
        Index(
            "ix_finance_transactions_user_type",
            "user_id",
            "type",
        ),
        Index(
            "ix_finance_transactions_user_category",
            "user_id",
            "category",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    date = Column(String, nullable=True)

    user = relationship("User", back_populates="finance_transactions")


class SavingsGoal(UserOwnedMixin, Base):
    __tablename__ = "savings_goals"
    __table_args__ = (
        CheckConstraint(
            "target_amount > 0",
            name="target_amount_positive",
        ),
        CheckConstraint(
            "current_amount >= 0",
            name="current_amount_nonnegative",
        ),
        Index(
            "ix_savings_goals_user_deadline",
            "user_id",
            "deadline",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )
    deadline = Column(String, nullable=True)

    user = relationship("User", back_populates="savings_goals")


class FinanceMemory(UserOwnedMixin, Base):
    __tablename__ = "finance_memory"
    __table_args__ = (
        CheckConstraint(
            "monthly_income >= 0",
            name="monthly_income_nonnegative",
        ),
        CheckConstraint(
            "target_monthly_savings >= 0",
            name="target_savings_nonnegative",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    monthly_income = Column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )
    target_monthly_savings = Column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )
    financial_goal = Column(String, nullable=True)
    risk_level = Column(String, nullable=True)
    budget_preference = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="finance_memories")
