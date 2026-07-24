"""Optimize relationships, constraints, indexes, and UTC timestamps.

Revision ID: 20260723_0003
Revises: 20260722_0002
Create Date: 2026-07-23

This migration keeps existing row IDs and user ownership intact while:
- backfilling nullable default columns,
- standardizing persisted timestamps as timezone-aware UTC,
- adding safe numeric check constraints,
- and adding composite indexes for common user-scoped queries.

Legacy timezone-naive timestamps are interpreted as UTC during conversion.
"""
from __future__ import annotations

from typing import NamedTuple, Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260723_0003"
down_revision: Union[str, Sequence[str], None] = "20260722_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


class ColumnNormalization(NamedTuple):
    column: str
    type_: sa.types.TypeEngine
    update_sql: str
    server_default: object
    was_nullable: bool = True
    timezone_upgrade: bool = False


NORMALIZATIONS: dict[str, tuple[ColumnNormalization, ...]] = {
    "users": (
        ColumnNormalization(
            "role",
            sa.String(length=32),
            "'user'",
            sa.text("'user'"),
            was_nullable=False,
        ),
        ColumnNormalization(
            "is_active",
            sa.Boolean(),
            "TRUE",
            sa.true(),
            was_nullable=False,
        ),
        ColumnNormalization(
            "is_verified",
            sa.Boolean(),
            "FALSE",
            sa.false(),
            was_nullable=False,
        ),
        ColumnNormalization(
            "created_at",
            sa.DateTime(timezone=True),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            was_nullable=False,
        ),
        ColumnNormalization(
            "updated_at",
            sa.DateTime(timezone=True),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            was_nullable=False,
        ),
    ),
    "agent_memory": (
        ColumnNormalization(
            "insight_type",
            sa.String(),
            "'analysis'",
            sa.text("'analysis'"),
        ),
        ColumnNormalization("summary", sa.Text(), "''", sa.text("''")),
        ColumnNormalization("recommendation", sa.Text(), "''", sa.text("''")),
        ColumnNormalization("risks", sa.Text(), "''", sa.text("''")),
        ColumnNormalization("confidence", sa.Integer(), "0", sa.text("0")),
        ColumnNormalization("source_question", sa.Text(), "''", sa.text("''")),
        ColumnNormalization(
            "created_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
    ),
    "agent_plans": (
        ColumnNormalization(
            "plan_type",
            sa.String(),
            "'7-day'",
            sa.text("'7-day'"),
        ),
        ColumnNormalization("tasks", sa.Text(), "'[]'", sa.text("'[]'")),
        ColumnNormalization(
            "completed_tasks",
            sa.Text(),
            "'[]'",
            sa.text("'[]'"),
        ),
        ColumnNormalization("risks", sa.Text(), "'[]'", sa.text("'[]'")),
        ColumnNormalization(
            "success_metric",
            sa.Text(),
            "''",
            sa.text("''"),
        ),
        ColumnNormalization(
            "status",
            sa.String(),
            "'active'",
            sa.text("'active'"),
        ),
        ColumnNormalization(
            "completion_percent",
            sa.Integer(),
            "0",
            sa.text("0"),
        ),
        ColumnNormalization(
            "created_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
        ColumnNormalization(
            "updated_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
    ),
    "agent_profiles": (
        ColumnNormalization(
            "learned_preferences",
            sa.Text(),
            "'{}'",
            sa.text("'{}'"),
        ),
        ColumnNormalization(
            "behavior_patterns",
            sa.Text(),
            "'{}'",
            sa.text("'{}'"),
        ),
        ColumnNormalization(
            "recurring_goals",
            sa.Text(),
            "'[]'",
            sa.text("'[]'"),
        ),
        ColumnNormalization(
            "recurring_risks",
            sa.Text(),
            "'[]'",
            sa.text("'[]'"),
        ),
        ColumnNormalization(
            "decision_style",
            sa.String(),
            "'Unknown'",
            sa.text("'Unknown'"),
        ),
        ColumnNormalization(
            "confidence_score",
            sa.Integer(),
            "0",
            sa.text("0"),
        ),
        ColumnNormalization(
            "created_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
        ColumnNormalization(
            "updated_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
    ),
    "agent_reflections": (
        ColumnNormalization(
            "reflection_type",
            sa.String(),
            "'daily'",
            sa.text("'daily'"),
        ),
        ColumnNormalization("wins", sa.Text(), "'[]'", sa.text("'[]'")),
        ColumnNormalization("concerns", sa.Text(), "'[]'", sa.text("'[]'")),
        ColumnNormalization(
            "recommendation",
            sa.Text(),
            "''",
            sa.text("''"),
        ),
        ColumnNormalization("summary", sa.Text(), "''", sa.text("''")),
        ColumnNormalization(
            "confidence_score",
            sa.Integer(),
            "0",
            sa.text("0"),
        ),
        ColumnNormalization(
            "created_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
    ),
    "applications": (
        ColumnNormalization(
            "status",
            sa.String(),
            "'Saved'",
            sa.text("'Saved'"),
        ),
        ColumnNormalization(
            "created_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
    ),
    "career_memory": (
        ColumnNormalization(
            "created_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
    ),
    "career_roadmap": (
        ColumnNormalization(
            "completed",
            sa.Boolean(),
            "FALSE",
            sa.false(),
        ),
        ColumnNormalization(
            "created_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
    ),
    "finance_memory": (
        ColumnNormalization(
            "monthly_income",
            sa.Float(),
            "0",
            sa.text("0"),
        ),
        ColumnNormalization(
            "target_monthly_savings",
            sa.Float(),
            "0",
            sa.text("0"),
        ),
    ),
    "savings_goals": (
        ColumnNormalization(
            "current_amount",
            sa.Float(),
            "0",
            sa.text("0"),
        ),
    ),
    "health_memory": (
        ColumnNormalization(
            "sleep_goal_hours",
            sa.Float(),
            "8",
            sa.text("8"),
        ),
        ColumnNormalization(
            "water_goal_cups",
            sa.Integer(),
            "8",
            sa.text("8"),
        ),
        ColumnNormalization(
            "workout_goal_minutes",
            sa.Integer(),
            "30",
            sa.text("30"),
        ),
    ),
    "health_habits": (
        ColumnNormalization("water_cups", sa.Integer(), "0", sa.text("0")),
        ColumnNormalization("sleep_hours", sa.Float(), "0", sa.text("0")),
        ColumnNormalization(
            "workout_minutes",
            sa.Integer(),
            "0",
            sa.text("0"),
        ),
    ),
    "learning_memory": (
        ColumnNormalization(
            "current_level",
            sa.String(),
            "'Beginner'",
            sa.text("'Beginner'"),
        ),
        ColumnNormalization(
            "target_level",
            sa.String(),
            "'Intermediate'",
            sa.text("'Intermediate'"),
        ),
        ColumnNormalization(
            "status",
            sa.String(),
            "'In Progress'",
            sa.text("'In Progress'"),
        ),
    ),
    "learning_progress": (
        ColumnNormalization(
            "completed",
            sa.Boolean(),
            "FALSE",
            sa.false(),
        ),
        ColumnNormalization(
            "created_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
    ),
    "twin_progress_snapshots": (
        ColumnNormalization("career_score", sa.Integer(), "0", sa.text("0")),
        ColumnNormalization("finance_score", sa.Integer(), "0", sa.text("0")),
        ColumnNormalization("health_score", sa.Integer(), "0", sa.text("0")),
        ColumnNormalization("learning_score", sa.Integer(), "0", sa.text("0")),
        ColumnNormalization("overall_score", sa.Integer(), "0", sa.text("0")),
        ColumnNormalization(
            "created_at",
            sa.DateTime(),
            "CURRENT_TIMESTAMP",
            sa.func.now(),
            timezone_upgrade=True,
        ),
    ),
}


CHECK_CONSTRAINTS: dict[str, tuple[tuple[str, str], ...]] = {
    "agent_memory": (
        ("ck_agent_memory_confidence_range", "confidence BETWEEN 0 AND 100"),
    ),
    "agent_plans": (
        (
            "ck_agent_plans_completion_percent_range",
            "completion_percent BETWEEN 0 AND 100",
        ),
    ),
    "agent_profiles": (
        (
            "ck_agent_profiles_confidence_score_range",
            "confidence_score BETWEEN 0 AND 100",
        ),
    ),
    "agent_reflections": (
        (
            "ck_agent_reflections_confidence_score_range",
            "confidence_score BETWEEN 0 AND 100",
        ),
    ),
    "finance_transactions": (
        (
            "ck_finance_transactions_amount_nonnegative",
            "amount >= 0",
        ),
    ),
    "savings_goals": (
        (
            "ck_savings_goals_target_amount_positive",
            "target_amount > 0",
        ),
        (
            "ck_savings_goals_current_amount_nonnegative",
            "current_amount >= 0",
        ),
    ),
    "finance_memory": (
        (
            "ck_finance_memory_monthly_income_nonnegative",
            "monthly_income >= 0",
        ),
        (
            "ck_finance_memory_target_savings_nonnegative",
            "target_monthly_savings >= 0",
        ),
    ),
    "health_memory": (
        (
            "ck_health_memory_sleep_goal_range",
            "sleep_goal_hours BETWEEN 0 AND 24",
        ),
        (
            "ck_health_memory_water_goal_range",
            "water_goal_cups BETWEEN 0 AND 100",
        ),
        (
            "ck_health_memory_workout_goal_range",
            "workout_goal_minutes BETWEEN 0 AND 1440",
        ),
    ),
    "health_habits": (
        (
            "ck_health_habits_sleep_hours_range",
            "sleep_hours BETWEEN 0 AND 24",
        ),
        (
            "ck_health_habits_water_cups_range",
            "water_cups BETWEEN 0 AND 100",
        ),
        (
            "ck_health_habits_workout_minutes_range",
            "workout_minutes BETWEEN 0 AND 1440",
        ),
    ),
    "twin_progress_snapshots": (
        (
            "ck_twin_progress_snapshots_career_score_range",
            "career_score BETWEEN 0 AND 100",
        ),
        (
            "ck_twin_progress_snapshots_finance_score_range",
            "finance_score BETWEEN 0 AND 100",
        ),
        (
            "ck_twin_progress_snapshots_health_score_range",
            "health_score BETWEEN 0 AND 100",
        ),
        (
            "ck_twin_progress_snapshots_learning_score_range",
            "learning_score BETWEEN 0 AND 100",
        ),
        (
            "ck_twin_progress_snapshots_overall_score_range",
            "overall_score BETWEEN 0 AND 100",
        ),
    ),
}


RANGE_ASSERTIONS: tuple[tuple[str, str, str], ...] = (
    ("agent_memory", "confidence", "confidence < 0 OR confidence > 100"),
    (
        "agent_plans",
        "completion_percent",
        "completion_percent < 0 OR completion_percent > 100",
    ),
    (
        "agent_profiles",
        "confidence_score",
        "confidence_score < 0 OR confidence_score > 100",
    ),
    (
        "agent_reflections",
        "confidence_score",
        "confidence_score < 0 OR confidence_score > 100",
    ),
    ("finance_transactions", "amount", "amount < 0"),
    ("savings_goals", "target_amount", "target_amount <= 0"),
    ("savings_goals", "current_amount", "current_amount < 0"),
    ("finance_memory", "monthly_income", "monthly_income < 0"),
    (
        "finance_memory",
        "target_monthly_savings",
        "target_monthly_savings < 0",
    ),
    (
        "health_memory",
        "sleep_goal_hours",
        "sleep_goal_hours < 0 OR sleep_goal_hours > 24",
    ),
    (
        "health_memory",
        "water_goal_cups",
        "water_goal_cups < 0 OR water_goal_cups > 100",
    ),
    (
        "health_memory",
        "workout_goal_minutes",
        "workout_goal_minutes < 0 OR workout_goal_minutes > 1440",
    ),
    (
        "health_habits",
        "sleep_hours",
        "sleep_hours < 0 OR sleep_hours > 24",
    ),
    (
        "health_habits",
        "water_cups",
        "water_cups < 0 OR water_cups > 100",
    ),
    (
        "health_habits",
        "workout_minutes",
        "workout_minutes < 0 OR workout_minutes > 1440",
    ),
    (
        "twin_progress_snapshots",
        "career_score",
        "career_score < 0 OR career_score > 100",
    ),
    (
        "twin_progress_snapshots",
        "finance_score",
        "finance_score < 0 OR finance_score > 100",
    ),
    (
        "twin_progress_snapshots",
        "health_score",
        "health_score < 0 OR health_score > 100",
    ),
    (
        "twin_progress_snapshots",
        "learning_score",
        "learning_score < 0 OR learning_score > 100",
    ),
    (
        "twin_progress_snapshots",
        "overall_score",
        "overall_score < 0 OR overall_score > 100",
    ),
)


INDEXES: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    (
        "ix_agent_memory_user_agent_created",
        "agent_memory",
        ("user_id", "agent_name", "created_at"),
    ),
    (
        "ix_agent_memory_user_created",
        "agent_memory",
        ("user_id", "created_at"),
    ),
    (
        "ix_agent_plans_user_status",
        "agent_plans",
        ("user_id", "status"),
    ),
    (
        "ix_agent_plans_user_created",
        "agent_plans",
        ("user_id", "created_at"),
    ),
    (
        "ix_agent_profiles_user_confidence",
        "agent_profiles",
        ("user_id", "confidence_score"),
    ),
    (
        "ix_agent_reflections_user_agent_created",
        "agent_reflections",
        ("user_id", "agent_name", "created_at"),
    ),
    (
        "ix_applications_user_status",
        "applications",
        ("user_id", "status"),
    ),
    (
        "ix_applications_user_created",
        "applications",
        ("user_id", "created_at"),
    ),
    (
        "ix_applications_user_company_role",
        "applications",
        ("user_id", "company", "role"),
    ),
    (
        "ix_career_memory_user_created",
        "career_memory",
        ("user_id", "created_at"),
    ),
    (
        "ix_career_roadmap_user_completed",
        "career_roadmap",
        ("user_id", "completed"),
    ),
    (
        "ix_career_roadmap_user_created",
        "career_roadmap",
        ("user_id", "created_at"),
    ),
    (
        "ix_finance_transactions_user_date",
        "finance_transactions",
        ("user_id", "date"),
    ),
    (
        "ix_finance_transactions_user_type",
        "finance_transactions",
        ("user_id", "type"),
    ),
    (
        "ix_finance_transactions_user_category",
        "finance_transactions",
        ("user_id", "category"),
    ),
    (
        "ix_savings_goals_user_deadline",
        "savings_goals",
        ("user_id", "deadline"),
    ),
    (
        "ix_health_habits_user_date",
        "health_habits",
        ("user_id", "date"),
    ),
    (
        "ix_learning_memory_user_status",
        "learning_memory",
        ("user_id", "status"),
    ),
    (
        "ix_learning_memory_user_category",
        "learning_memory",
        ("user_id", "category"),
    ),
    (
        "ix_learning_progress_user_completed",
        "learning_progress",
        ("user_id", "completed"),
    ),
    (
        "ix_learning_progress_user_created",
        "learning_progress",
        ("user_id", "created_at"),
    ),
    (
        "ix_twin_progress_snapshots_user_created",
        "twin_progress_snapshots",
        ("user_id", "created_at"),
    ),
)


def _quote(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _assert_ranges_are_valid() -> None:
    bind = op.get_bind()
    violations: list[str] = []

    for table, column, condition in RANGE_ASSERTIONS:
        count = int(
            bind.execute(
                sa.text(
                    f"SELECT COUNT(*) FROM {_quote(table)} "
                    f"WHERE {_quote(column)} IS NOT NULL AND ({condition})"
                )
            ).scalar_one()
        )
        if count:
            violations.append(f"{table}.{column}: {count} invalid rows")

    if violations:
        raise RuntimeError(
            "Phase 3C constraint validation failed. Correct these values "
            "before upgrading: " + "; ".join(violations)
        )


def _backfill_defaults() -> None:
    bind = op.get_bind()

    for table, columns in NORMALIZATIONS.items():
        for item in columns:
            bind.execute(
                sa.text(
                    f"UPDATE {_quote(table)} "
                    f"SET {_quote(item.column)} = {item.update_sql} "
                    f"WHERE {_quote(item.column)} IS NULL"
                )
            )


def _upgrade_postgresql() -> None:
    for table, columns in NORMALIZATIONS.items():
        for item in columns:
            kwargs: dict[str, object] = {
                "existing_type": item.type_,
                "nullable": False,
                "server_default": item.server_default,
            }
            if item.timezone_upgrade:
                kwargs["type_"] = sa.DateTime(timezone=True)
                kwargs["postgresql_using"] = (
                    f"{_quote(item.column)} AT TIME ZONE 'UTC'"
                )

            op.alter_column(table, item.column, **kwargs)

    for table, constraints in CHECK_CONSTRAINTS.items():
        for name, condition in constraints:
            op.create_check_constraint(op.f(name), table, condition)


def _upgrade_sqlite() -> None:
    affected_tables = set(NORMALIZATIONS) | set(CHECK_CONSTRAINTS)

    for table in sorted(affected_tables):
        with op.batch_alter_table(table, recreate="always") as batch_op:
            for item in NORMALIZATIONS.get(table, ()):
                kwargs: dict[str, object] = {
                    "existing_type": item.type_,
                    "nullable": False,
                    "server_default": item.server_default,
                }
                if item.timezone_upgrade:
                    kwargs["type_"] = sa.DateTime(timezone=True)

                batch_op.alter_column(item.column, **kwargs)

            for name, condition in CHECK_CONSTRAINTS.get(table, ()):
                batch_op.create_check_constraint(op.f(name), condition)


def upgrade() -> None:
    _assert_ranges_are_valid()
    _backfill_defaults()

    dialect = op.get_bind().dialect.name
    if dialect == "sqlite":
        _upgrade_sqlite()
    else:
        _upgrade_postgresql()

    for name, table, columns in INDEXES:
        op.create_index(name, table, list(columns), unique=False)


def _downgrade_postgresql() -> None:
    for table, constraints in reversed(tuple(CHECK_CONSTRAINTS.items())):
        for name, _condition in reversed(constraints):
            op.drop_constraint(op.f(name), table, type_="check")

    for table, columns in reversed(tuple(NORMALIZATIONS.items())):
        for item in reversed(columns):
            kwargs: dict[str, object] = {
                "existing_type": (
                    sa.DateTime(timezone=True)
                    if item.timezone_upgrade
                    else item.type_
                ),
                "nullable": item.was_nullable,
                "server_default": None,
            }
            if item.timezone_upgrade:
                kwargs["type_"] = sa.DateTime(timezone=False)
                kwargs["postgresql_using"] = (
                    f"{_quote(item.column)} AT TIME ZONE 'UTC'"
                )

            op.alter_column(table, item.column, **kwargs)


def _downgrade_sqlite() -> None:
    affected_tables = set(NORMALIZATIONS) | set(CHECK_CONSTRAINTS)

    for table in sorted(affected_tables, reverse=True):
        with op.batch_alter_table(table, recreate="always") as batch_op:
            for name, _condition in reversed(
                CHECK_CONSTRAINTS.get(table, ())
            ):
                batch_op.drop_constraint(op.f(name), type_="check")

            for item in reversed(NORMALIZATIONS.get(table, ())):
                kwargs: dict[str, object] = {
                    "existing_type": (
                        sa.DateTime(timezone=True)
                        if item.timezone_upgrade
                        else item.type_
                    ),
                    "nullable": item.was_nullable,
                    "server_default": None,
                }
                if item.timezone_upgrade:
                    kwargs["type_"] = sa.DateTime(timezone=False)

                batch_op.alter_column(item.column, **kwargs)


def downgrade() -> None:
    for name, table, _columns in reversed(INDEXES):
        op.drop_index(name, table_name=table)

    dialect = op.get_bind().dialect.name
    if dialect == "sqlite":
        _downgrade_sqlite()
    else:
        _downgrade_postgresql()
