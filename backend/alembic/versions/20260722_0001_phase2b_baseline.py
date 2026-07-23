"""Create the Phase 2B baseline schema.

Revision ID: 20260722_0001
Revises: None
Create Date: 2026-07-22

This revision intentionally reflects the physical Phase 2B SQLite schema.
Most legacy user_id columns were added with SQLite ALTER TABLE, so they are
nullable and do not yet have database-level foreign keys. Revision 0002
normalizes those ownership constraints without deleting data.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260722_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _owned_user_column(*, strict: bool = False) -> sa.Column:
    if strict:
        return sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        )
    return sa.Column("user_id", sa.Integer(), nullable=True)


def _create_standard_indexes(table: str, *, columns: tuple[str, ...] = ()) -> None:
    op.create_index(f"ix_{table}_id", table, ["id"], unique=False)
    op.create_index(f"ix_{table}_user_id", table, ["user_id"], unique=False)
    for column in columns:
        op.create_index(f"ix_{table}_{column}", table, [column], unique=False)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("hashed_password", sa.String(length=512), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "agent_memory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_name", sa.String(), nullable=True),
        sa.Column("insight_type", sa.String(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("recommendation", sa.Text(), nullable=True),
        sa.Column("risks", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Integer(), nullable=True),
        sa.Column("source_question", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_agent_memory"),
    )
    _create_standard_indexes("agent_memory", columns=("agent_name",))

    op.create_table(
        "agent_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_name", sa.String(), nullable=True),
        sa.Column("plan_type", sa.String(), nullable=True),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("goal", sa.Text(), nullable=True),
        sa.Column("tasks", sa.Text(), nullable=True),
        sa.Column("completed_tasks", sa.Text(), nullable=True),
        sa.Column("risks", sa.Text(), nullable=True),
        sa.Column("success_metric", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("completion_percent", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_agent_plans"),
    )
    _create_standard_indexes("agent_plans", columns=("agent_name",))

    op.create_table(
        "agent_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_name", sa.String(), nullable=False),
        sa.Column("learned_preferences", sa.Text(), nullable=True),
        sa.Column("behavior_patterns", sa.Text(), nullable=True),
        sa.Column("recurring_goals", sa.Text(), nullable=True),
        sa.Column("recurring_risks", sa.Text(), nullable=True),
        sa.Column("decision_style", sa.String(), nullable=True),
        sa.Column("confidence_score", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        _owned_user_column(strict=True),
        sa.PrimaryKeyConstraint("id", name="pk_agent_profiles"),
        sa.UniqueConstraint(
            "user_id",
            "agent_name",
            name="uq_agent_profiles_user_agent",
        ),
    )
    _create_standard_indexes("agent_profiles", columns=("agent_name",))

    op.create_table(
        "agent_reflections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_name", sa.String(), nullable=True),
        sa.Column("reflection_type", sa.String(), nullable=True),
        sa.Column("wins", sa.Text(), nullable=True),
        sa.Column("concerns", sa.Text(), nullable=True),
        sa.Column("recommendation", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("confidence_score", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_agent_reflections"),
    )
    _create_standard_indexes("agent_reflections", columns=("agent_name",))

    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("date_applied", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_applications"),
    )
    _create_standard_indexes("applications")

    op.create_table(
        "career_memory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("career_goal", sa.Text(), nullable=True),
        sa.Column("target_role", sa.String(), nullable=True),
        sa.Column("current_skills", sa.Text(), nullable=True),
        sa.Column("skills_to_learn", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_career_memory"),
    )
    _create_standard_indexes("career_memory")

    op.create_table(
        "career_roadmap",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("week", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("tasks", sa.Text(), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_career_roadmap"),
    )
    _create_standard_indexes("career_roadmap")

    op.create_table(
        "finance_memory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("monthly_income", sa.Float(), nullable=True),
        sa.Column("target_monthly_savings", sa.Float(), nullable=True),
        sa.Column("financial_goal", sa.String(), nullable=True),
        sa.Column("risk_level", sa.String(), nullable=True),
        sa.Column("budget_preference", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_finance_memory"),
    )
    _create_standard_indexes("finance_memory")

    op.create_table(
        "finance_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("date", sa.String(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_finance_transactions"),
    )
    _create_standard_indexes("finance_transactions")

    op.create_table(
        "health_habits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("date", sa.String(), nullable=True),
        sa.Column("water_cups", sa.Integer(), nullable=True),
        sa.Column("sleep_hours", sa.Float(), nullable=True),
        sa.Column("workout_minutes", sa.Integer(), nullable=True),
        sa.Column("mood", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_health_habits"),
    )
    _create_standard_indexes("health_habits")

    op.create_table(
        "health_memory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("health_goal", sa.String(), nullable=True),
        sa.Column("diet_preference", sa.String(), nullable=True),
        sa.Column("fitness_level", sa.String(), nullable=True),
        sa.Column("sleep_goal_hours", sa.Float(), nullable=True),
        sa.Column("water_goal_cups", sa.Integer(), nullable=True),
        sa.Column("workout_goal_minutes", sa.Integer(), nullable=True),
        sa.Column("allergies", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_health_memory"),
    )
    _create_standard_indexes("health_memory")

    op.create_table(
        "learning_memory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("topic", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("current_level", sa.String(), nullable=True),
        sa.Column("target_level", sa.String(), nullable=True),
        sa.Column("resource", sa.Text(), nullable=True),
        sa.Column("resource_link", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_learning_memory"),
    )
    _create_standard_indexes("learning_memory")

    op.create_table(
        "learning_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("topic", sa.String(), nullable=False),
        sa.Column("task", sa.String(), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_learning_progress"),
    )
    _create_standard_indexes("learning_progress")

    op.create_table(
        "personal_memory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("timezone", sa.String(), nullable=True),
        sa.Column("current_status", sa.String(), nullable=True),
        sa.Column("long_term_goals", sa.String(), nullable=True),
        sa.Column("daily_schedule", sa.String(), nullable=True),
        sa.Column("communication_style", sa.String(), nullable=True),
        sa.Column("life_priorities", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_personal_memory"),
    )
    _create_standard_indexes("personal_memory")

    op.create_table(
        "savings_goals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("target_amount", sa.Float(), nullable=False),
        sa.Column("current_amount", sa.Float(), nullable=True),
        sa.Column("deadline", sa.String(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_savings_goals"),
    )
    _create_standard_indexes("savings_goals")

    op.create_table(
        "twin_progress_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("career_score", sa.Integer(), nullable=True),
        sa.Column("finance_score", sa.Integer(), nullable=True),
        sa.Column("health_score", sa.Integer(), nullable=True),
        sa.Column("learning_score", sa.Integer(), nullable=True),
        sa.Column("overall_score", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        _owned_user_column(),
        sa.PrimaryKeyConstraint("id", name="pk_twin_progress_snapshots"),
    )
    _create_standard_indexes("twin_progress_snapshots")


def downgrade() -> None:
    tables = (
        "twin_progress_snapshots",
        "savings_goals",
        "personal_memory",
        "learning_progress",
        "learning_memory",
        "health_memory",
        "health_habits",
        "finance_transactions",
        "finance_memory",
        "career_roadmap",
        "career_memory",
        "applications",
        "agent_reflections",
        "agent_profiles",
        "agent_plans",
        "agent_memory",
    )
    for table in tables:
        op.drop_table(table)
    op.drop_table("users")
