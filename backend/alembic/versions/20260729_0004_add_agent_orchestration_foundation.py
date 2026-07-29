"""Add persistent multi-agent workflow planning tables.

Revision ID: 20260729_0004
Revises: 20260723_0003
Create Date: 2026-07-29

Phase 6A introduces user-owned AgentRun and AgentStep records. The migration is
portable across PostgreSQL and SQLite and does not execute any AI workflow.
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260729_0004"
down_revision: Union[str, Sequence[str], None] = "20260723_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agent_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("retry_of_run_id", sa.Integer(), nullable=True),
        sa.Column("goal", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="planned",
            nullable=False,
        ),
        sa.Column(
            "execution_mode",
            sa.String(length=48),
            server_default="parallel_then_synthesize",
            nullable=False,
        ),
        sa.Column(
            "selected_agents",
            sa.JSON(),
            server_default=sa.text("'[]'"),
            nullable=False,
        ),
        sa.Column(
            "preferred_agents",
            sa.JSON(),
            server_default=sa.text("'[]'"),
            nullable=False,
        ),
        sa.Column(
            "include_weekly_plan",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
        sa.Column(
            "routing_reason",
            sa.Text(),
            server_default=sa.text("''"),
            nullable=False,
        ),
        sa.Column(
            "request_payload",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
        sa.Column("result_payload", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "total_tokens",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "estimated_cost",
            sa.Float(),
            server_default="0",
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "estimated_cost >= 0",
            name="estimated_cost_nonnegative",
        ),
        sa.CheckConstraint(
            "execution_mode IN ('single_agent', 'parallel_then_synthesize', 'sequential')",
            name="execution_mode_values",
        ),
        sa.CheckConstraint(
            "status IN ('planned', 'running', 'completed', 'failed', 'cancelled')",
            name="status_values",
        ),
        sa.CheckConstraint(
            "total_tokens >= 0",
            name="total_tokens_nonnegative",
        ),
        sa.ForeignKeyConstraint(
            ["retry_of_run_id"],
            ["agent_runs.id"],
            name="fk_agent_runs_retry_of_run_id_agent_runs",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_agent_runs_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_agent_runs"),
    )
    op.create_index("ix_agent_runs_id", "agent_runs", ["id"], unique=False)
    op.create_index(
        "ix_agent_runs_retry_of_run_id",
        "agent_runs",
        ["retry_of_run_id"],
        unique=False,
    )
    op.create_index(
        "ix_agent_runs_user_id",
        "agent_runs",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_agent_runs_user_status",
        "agent_runs",
        ["user_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_agent_runs_user_created",
        "agent_runs",
        ["user_id", "created_at"],
        unique=False,
    )

    op.create_table(
        "agent_steps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_run_id", sa.Integer(), nullable=False),
        sa.Column("agent_name", sa.String(length=32), nullable=False),
        sa.Column("step_order", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="planned",
            nullable=False,
        ),
        sa.Column(
            "input_payload",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
        sa.Column("output_payload", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "attempt_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "timeout_seconds",
            sa.Integer(),
            server_default="30",
            nullable=False,
        ),
        sa.Column(
            "max_retries",
            sa.Integer(),
            server_default="2",
            nullable=False,
        ),
        sa.Column(
            "requires_approval",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "attempt_count >= 0",
            name="attempt_count_nonnegative",
        ),
        sa.CheckConstraint(
            "max_retries >= 0",
            name="max_retries_nonnegative",
        ),
        sa.CheckConstraint(
            "status IN ('planned', 'running', 'completed', 'failed', 'skipped', 'cancelled')",
            name="status_values",
        ),
        sa.CheckConstraint(
            "step_order > 0",
            name="step_order_positive",
        ),
        sa.CheckConstraint(
            "timeout_seconds > 0",
            name="timeout_seconds_positive",
        ),
        sa.ForeignKeyConstraint(
            ["agent_run_id"],
            ["agent_runs.id"],
            name="fk_agent_steps_agent_run_id_agent_runs",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_agent_steps_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_agent_steps"),
        sa.UniqueConstraint(
            "agent_run_id",
            "step_order",
            name="uq_agent_steps_run_step_order",
        ),
    )
    op.create_index("ix_agent_steps_id", "agent_steps", ["id"], unique=False)
    op.create_index(
        "ix_agent_steps_agent_run_id",
        "agent_steps",
        ["agent_run_id"],
        unique=False,
    )
    op.create_index(
        "ix_agent_steps_agent_name",
        "agent_steps",
        ["agent_name"],
        unique=False,
    )
    op.create_index(
        "ix_agent_steps_user_id",
        "agent_steps",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_agent_steps_user_status",
        "agent_steps",
        ["user_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_agent_steps_run_agent",
        "agent_steps",
        ["agent_run_id", "agent_name"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_agent_steps_run_agent", table_name="agent_steps")
    op.drop_index("ix_agent_steps_user_status", table_name="agent_steps")
    op.drop_index("ix_agent_steps_user_id", table_name="agent_steps")
    op.drop_index("ix_agent_steps_agent_name", table_name="agent_steps")
    op.drop_index("ix_agent_steps_agent_run_id", table_name="agent_steps")
    op.drop_index("ix_agent_steps_id", table_name="agent_steps")
    op.drop_table("agent_steps")

    op.drop_index("ix_agent_runs_user_created", table_name="agent_runs")
    op.drop_index("ix_agent_runs_user_status", table_name="agent_runs")
    op.drop_index("ix_agent_runs_user_id", table_name="agent_runs")
    op.drop_index("ix_agent_runs_retry_of_run_id", table_name="agent_runs")
    op.drop_index("ix_agent_runs_id", table_name="agent_runs")
    op.drop_table("agent_runs")
