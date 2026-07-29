"""Add the Phase 6B agent execution engine and execution metrics.

Revision ID: 20260729_0005
Revises: 20260729_0004
Create Date: 2026-07-29

The migration expands AgentRun lifecycle states and stores execution provider,
latency, token, cost, retry, and fallback metadata. It is portable across
PostgreSQL and SQLite through Alembic batch operations.
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260729_0005"
down_revision: Union[str, Sequence[str], None] = "20260729_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


RUN_STATUS_CHECK = (
    "status IN ('planned', 'running', 'synthesizing', 'completed', "
    "'partially_completed', 'failed', 'cancelled')"
)
LEGACY_RUN_STATUS_CHECK = (
    "status IN ('planned', 'running', 'completed', 'failed', 'cancelled')"
)


def upgrade() -> None:
    with op.batch_alter_table("agent_runs") as batch:
        batch.drop_constraint(
            op.f("ck_agent_runs_status_values"),
            type_="check",
        )
        batch.add_column(
            sa.Column("execution_provider", sa.String(length=32), nullable=True)
        )
        batch.add_column(
            sa.Column(
                "prompt_tokens",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch.add_column(
            sa.Column(
                "completion_tokens",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch.add_column(
            sa.Column(
                "duration_ms",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch.add_column(
            sa.Column(
                "fallback_count",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch.create_check_constraint("status_values", RUN_STATUS_CHECK)
        batch.create_check_constraint(
            "prompt_tokens_nonnegative",
            "prompt_tokens >= 0",
        )
        batch.create_check_constraint(
            "completion_tokens_nonnegative",
            "completion_tokens >= 0",
        )
        batch.create_check_constraint(
            "duration_ms_nonnegative",
            "duration_ms >= 0",
        )
        batch.create_check_constraint(
            "fallback_count_nonnegative",
            "fallback_count >= 0",
        )

    with op.batch_alter_table("agent_steps") as batch:
        batch.add_column(
            sa.Column("provider", sa.String(length=32), nullable=True)
        )
        batch.add_column(
            sa.Column("model", sa.String(length=128), nullable=True)
        )
        batch.add_column(
            sa.Column(
                "fallback_used",
                sa.Boolean(),
                server_default=sa.false(),
                nullable=False,
            )
        )
        batch.add_column(
            sa.Column(
                "prompt_tokens",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch.add_column(
            sa.Column(
                "completion_tokens",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch.add_column(
            sa.Column(
                "total_tokens",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch.add_column(
            sa.Column(
                "estimated_cost",
                sa.Float(),
                server_default="0",
                nullable=False,
            )
        )
        batch.add_column(
            sa.Column(
                "duration_ms",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch.create_check_constraint(
            "prompt_tokens_nonnegative",
            "prompt_tokens >= 0",
        )
        batch.create_check_constraint(
            "completion_tokens_nonnegative",
            "completion_tokens >= 0",
        )
        batch.create_check_constraint(
            "total_tokens_nonnegative",
            "total_tokens >= 0",
        )
        batch.create_check_constraint(
            "estimated_cost_nonnegative",
            "estimated_cost >= 0",
        )
        batch.create_check_constraint(
            "duration_ms_nonnegative",
            "duration_ms >= 0",
        )


def downgrade() -> None:
    with op.batch_alter_table("agent_steps") as batch:
        batch.drop_constraint(
            op.f("ck_agent_steps_duration_ms_nonnegative"),
            type_="check",
        )
        batch.drop_constraint(
            op.f("ck_agent_steps_estimated_cost_nonnegative"),
            type_="check",
        )
        batch.drop_constraint(
            op.f("ck_agent_steps_total_tokens_nonnegative"),
            type_="check",
        )
        batch.drop_constraint(
            op.f("ck_agent_steps_completion_tokens_nonnegative"),
            type_="check",
        )
        batch.drop_constraint(
            op.f("ck_agent_steps_prompt_tokens_nonnegative"),
            type_="check",
        )
        batch.drop_column("duration_ms")
        batch.drop_column("estimated_cost")
        batch.drop_column("total_tokens")
        batch.drop_column("completion_tokens")
        batch.drop_column("prompt_tokens")
        batch.drop_column("fallback_used")
        batch.drop_column("model")
        batch.drop_column("provider")

    with op.batch_alter_table("agent_runs") as batch:
        batch.drop_constraint(
            op.f("ck_agent_runs_fallback_count_nonnegative"),
            type_="check",
        )
        batch.drop_constraint(
            op.f("ck_agent_runs_duration_ms_nonnegative"),
            type_="check",
        )
        batch.drop_constraint(
            op.f("ck_agent_runs_completion_tokens_nonnegative"),
            type_="check",
        )
        batch.drop_constraint(
            op.f("ck_agent_runs_prompt_tokens_nonnegative"),
            type_="check",
        )
        batch.drop_constraint(
            op.f("ck_agent_runs_status_values"),
            type_="check",
        )
        batch.create_check_constraint(
            "status_values",
            LEGACY_RUN_STATUS_CHECK,
        )
        batch.drop_column("fallback_count")
        batch.drop_column("duration_ms")
        batch.drop_column("completion_tokens")
        batch.drop_column("prompt_tokens")
        batch.drop_column("execution_provider")
