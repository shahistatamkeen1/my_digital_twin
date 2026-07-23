"""Normalize user ownership constraints.

Revision ID: 20260722_0002
Revises: 20260722_0001
Create Date: 2026-07-22

Existing Phase 2B SQLite databases received most user_id columns through ALTER
TABLE. This migration uses Alembic batch operations to make those columns
NOT NULL and add ON DELETE CASCADE foreign keys while preserving rows.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260722_0002"
down_revision: Union[str, Sequence[str], None] = "20260722_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OWNED_TABLES_TO_NORMALIZE = (
    "agent_memory",
    "agent_plans",
    "agent_reflections",
    "applications",
    "career_memory",
    "career_roadmap",
    "finance_transactions",
    "finance_memory",
    "savings_goals",
    "health_memory",
    "health_habits",
    "learning_memory",
    "learning_progress",
    "personal_memory",
    "twin_progress_snapshots",
)


def _assert_no_unowned_rows(table: str) -> None:
    bind = op.get_bind()
    count = bind.execute(
        sa.text(f'SELECT COUNT(*) FROM "{table}" WHERE user_id IS NULL')
    ).scalar_one()
    if count:
        raise RuntimeError(
            f"Cannot normalize {table}: {count} rows have no user_id. "
            "Run the Phase 2B ownership migration first."
        )


def upgrade() -> None:
    for table in OWNED_TABLES_TO_NORMALIZE:
        _assert_no_unowned_rows(table)
        with op.batch_alter_table(table, recreate="always") as batch_op:
            batch_op.alter_column(
                "user_id",
                existing_type=sa.Integer(),
                nullable=False,
            )
            batch_op.create_foreign_key(
                f"fk_{table}_user_id_users",
                "users",
                ["user_id"],
                ["id"],
                ondelete="CASCADE",
            )


def downgrade() -> None:
    for table in reversed(OWNED_TABLES_TO_NORMALIZE):
        with op.batch_alter_table(table, recreate="always") as batch_op:
            batch_op.drop_constraint(
                f"fk_{table}_user_id_users",
                type_="foreignkey",
            )
            batch_op.alter_column(
                "user_id",
                existing_type=sa.Integer(),
                nullable=True,
            )
