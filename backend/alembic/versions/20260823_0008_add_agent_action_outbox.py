"""Add the approval-controlled agent action outbox.

Revision ID: 20260823_0008
Revises: 20260813_0007
Create Date: 2026-08-23
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260823_0008"
down_revision: Union[str, Sequence[str], None] = "20260813_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agent_action_outbox",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("approval_id", sa.Integer(), nullable=False),
        sa.Column("agent_run_id", sa.Integer(), nullable=False),
        sa.Column("agent_step_id", sa.Integer(), nullable=True),
        sa.Column("idempotency_key", sa.String(length=255), nullable=False),
        sa.Column("action_type", sa.String(length=48), nullable=False),
        sa.Column("action_summary", sa.Text(), nullable=False),
        sa.Column(
            "execution_payload",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
        sa.Column(
            "execution_mode",
            sa.String(length=32),
            server_default="dry_run",
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="queued",
            nullable=False,
        ),
        sa.Column(
            "attempt_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "max_attempts",
            sa.Integer(),
            server_default="3",
            nullable=False,
        ),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("result_payload", sa.JSON(), nullable=True),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
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
            "status IN ('queued', 'dispatching', 'succeeded', 'failed', "
            "'cancelled', 'dead_lettered')",
            name=op.f("ck_agent_action_outbox_status_values"),
        ),
        sa.CheckConstraint(
            "execution_mode IN ('dry_run')",
            name=op.f("ck_agent_action_outbox_execution_mode_values"),
        ),
        sa.CheckConstraint(
            "attempt_count >= 0",
            name=op.f("ck_agent_action_outbox_attempt_count_nonnegative"),
        ),
        sa.CheckConstraint(
            "max_attempts > 0",
            name=op.f("ck_agent_action_outbox_max_attempts_positive"),
        ),
        sa.ForeignKeyConstraint(
            ["approval_id"],
            ["agent_approvals.id"],
            name=op.f("fk_agent_action_outbox_approval_id_agent_approvals"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["agent_run_id"],
            ["agent_runs.id"],
            name=op.f("fk_agent_action_outbox_agent_run_id_agent_runs"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["agent_step_id"],
            ["agent_steps.id"],
            name=op.f("fk_agent_action_outbox_agent_step_id_agent_steps"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_agent_action_outbox_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_agent_action_outbox")),
        sa.UniqueConstraint(
            "approval_id",
            name="uq_agent_action_outbox_approval_id",
        ),
        sa.UniqueConstraint(
            "idempotency_key",
            name="uq_agent_action_outbox_idempotency_key",
        ),
    )
    for column in (
        "id",
        "approval_id",
        "agent_run_id",
        "agent_step_id",
        "idempotency_key",
        "action_type",
        "status",
        "user_id",
    ):
        op.create_index(
            op.f(f"ix_agent_action_outbox_{column}"),
            "agent_action_outbox",
            [column],
            unique=False,
        )
    op.create_index(
        "ix_agent_action_outbox_user_status",
        "agent_action_outbox",
        ["user_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_agent_action_outbox_run_created",
        "agent_action_outbox",
        ["agent_run_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_agent_action_outbox_ready",
        "agent_action_outbox",
        ["status", "next_attempt_at", "created_at"],
        unique=False,
    )

    op.create_table(
        "agent_action_outbox_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("outbox_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column("previous_status", sa.String(length=32), nullable=True),
        sa.Column("new_status", sa.String(length=32), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "event_payload",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "event_type IN ('queued', 'dispatch_started', 'dispatch_succeeded', "
            "'dispatch_failed', 'retry_scheduled', 'cancelled', "
            "'dead_lettered', 'stale_requeued')",
            name=op.f("ck_agent_action_outbox_events_event_type_values"),
        ),
        sa.ForeignKeyConstraint(
            ["outbox_id"],
            ["agent_action_outbox.id"],
            name=op.f(
                "fk_agent_action_outbox_events_outbox_id_agent_action_outbox"
            ),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_agent_action_outbox_events_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name=op.f("pk_agent_action_outbox_events"),
        ),
    )
    for column in ("id", "outbox_id", "event_type", "user_id"):
        op.create_index(
            op.f(f"ix_agent_action_outbox_events_{column}"),
            "agent_action_outbox_events",
            [column],
            unique=False,
        )
    op.create_index(
        "ix_agent_action_outbox_events_entry_created",
        "agent_action_outbox_events",
        ["outbox_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_agent_action_outbox_events_user_created",
        "agent_action_outbox_events",
        ["user_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_agent_action_outbox_events_user_created",
        table_name="agent_action_outbox_events",
    )
    op.drop_index(
        "ix_agent_action_outbox_events_entry_created",
        table_name="agent_action_outbox_events",
    )
    for column in ("user_id", "event_type", "outbox_id", "id"):
        op.drop_index(
            op.f(f"ix_agent_action_outbox_events_{column}"),
            table_name="agent_action_outbox_events",
        )
    op.drop_table("agent_action_outbox_events")

    op.drop_index(
        "ix_agent_action_outbox_ready",
        table_name="agent_action_outbox",
    )
    op.drop_index(
        "ix_agent_action_outbox_run_created",
        table_name="agent_action_outbox",
    )
    op.drop_index(
        "ix_agent_action_outbox_user_status",
        table_name="agent_action_outbox",
    )
    for column in (
        "user_id",
        "status",
        "action_type",
        "idempotency_key",
        "agent_step_id",
        "agent_run_id",
        "approval_id",
        "id",
    ):
        op.drop_index(
            op.f(f"ix_agent_action_outbox_{column}"),
            table_name="agent_action_outbox",
        )
    op.drop_table("agent_action_outbox")
