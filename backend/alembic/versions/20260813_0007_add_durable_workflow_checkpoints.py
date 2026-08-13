"""Add durable workflow checkpoints and approval-aware resume states.

Revision ID: 20260813_0007
Revises: 20260806_0006
Create Date: 2026-08-13
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260813_0007"
down_revision: Union[str, Sequence[str], None] = "20260806_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


RUN_STATUS_CHECK = (
    "status IN ('planned', 'running', 'awaiting_approval', 'resuming', "
    "'synthesizing', 'completed', 'partially_completed', 'failed', 'cancelled')"
)
OLD_RUN_STATUS_CHECK = (
    "status IN ('planned', 'running', 'synthesizing', 'completed', "
    "'partially_completed', 'failed', 'cancelled')"
)
STEP_STATUS_CHECK = (
    "status IN ('planned', 'running', 'awaiting_approval', 'approved', "
    "'rejected', 'resuming', 'completed', 'failed', 'skipped', 'cancelled')"
)
OLD_STEP_STATUS_CHECK = (
    "status IN ('planned', 'running', 'completed', 'failed', 'skipped', 'cancelled')"
)


def upgrade() -> None:
    with op.batch_alter_table("agent_runs") as batch_op:
        batch_op.drop_constraint(
            op.f("ck_agent_runs_status_values"),
            type_="check",
        )
        batch_op.create_check_constraint(
            op.f("ck_agent_runs_status_values"),
            RUN_STATUS_CHECK,
        )

    with op.batch_alter_table("agent_steps") as batch_op:
        batch_op.drop_constraint(
            op.f("ck_agent_steps_status_values"),
            type_="check",
        )
        batch_op.create_check_constraint(
            op.f("ck_agent_steps_status_values"),
            STEP_STATUS_CHECK,
        )

    op.create_table(
        "agent_checkpoints",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_run_id", sa.Integer(), nullable=False),
        sa.Column("agent_step_id", sa.Integer(), nullable=True),
        sa.Column("approval_id", sa.Integer(), nullable=True),
        sa.Column(
            "checkpoint_type",
            sa.String(length=48),
            server_default="approval_gate",
            nullable=False,
        ),
        sa.Column("execution_key", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="pending",
            nullable=False,
        ),
        sa.Column(
            "rejection_policy",
            sa.String(length=32),
            server_default="skip_and_continue",
            nullable=False,
        ),
        sa.Column(
            "workflow_state",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
        sa.Column("resume_payload", sa.JSON(), nullable=True),
        sa.Column(
            "checkpoint_version",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
        sa.Column(
            "resume_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column("resumed_at", sa.DateTime(timezone=True), nullable=True),
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
            "status IN ('pending', 'resumed', 'skipped', 'cancelled', 'expired')",
            name=op.f("ck_agent_checkpoints_status_values"),
        ),
        sa.CheckConstraint(
            "rejection_policy IN ('skip_and_continue', 'stop_workflow')",
            name=op.f("ck_agent_checkpoints_rejection_policy_values"),
        ),
        sa.CheckConstraint(
            "checkpoint_version > 0",
            name=op.f("ck_agent_checkpoints_version_positive"),
        ),
        sa.CheckConstraint(
            "resume_count >= 0",
            name=op.f("ck_agent_checkpoints_resume_count_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["agent_run_id"],
            ["agent_runs.id"],
            name=op.f("fk_agent_checkpoints_agent_run_id_agent_runs"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["agent_step_id"],
            ["agent_steps.id"],
            name=op.f("fk_agent_checkpoints_agent_step_id_agent_steps"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["approval_id"],
            ["agent_approvals.id"],
            name=op.f("fk_agent_checkpoints_approval_id_agent_approvals"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_agent_checkpoints_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_agent_checkpoints")),
        sa.UniqueConstraint(
            "execution_key",
            name=op.f("uq_agent_checkpoints_execution_key"),
        ),
    )
    for column in ("id", "agent_run_id", "agent_step_id", "approval_id", "execution_key", "status", "user_id"):
        op.create_index(
            op.f(f"ix_agent_checkpoints_{column}"),
            "agent_checkpoints",
            [column],
            unique=(column == "execution_key"),
        )
    op.create_index(
        "ix_agent_checkpoints_run_status",
        "agent_checkpoints",
        ["agent_run_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_agent_checkpoints_user_created",
        "agent_checkpoints",
        ["user_id", "created_at"],
        unique=False,
    )

    op.create_table(
        "agent_workflow_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_run_id", sa.Integer(), nullable=False),
        sa.Column("agent_step_id", sa.Integer(), nullable=True),
        sa.Column("approval_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=48), nullable=False),
        sa.Column(
            "event_payload",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "event_type IN ("
            "'workflow_started', 'approval_requested', 'workflow_paused', "
            "'approval_approved', 'approval_rejected', 'approval_cancelled', "
            "'approval_expired', 'workflow_resumed', 'step_skipped', "
            "'workflow_synthesizing', 'workflow_completed', 'workflow_failed', "
            "'workflow_cancelled')",
            name=op.f("ck_agent_workflow_events_event_type_values"),
        ),
        sa.ForeignKeyConstraint(
            ["agent_run_id"],
            ["agent_runs.id"],
            name=op.f("fk_agent_workflow_events_agent_run_id_agent_runs"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["agent_step_id"],
            ["agent_steps.id"],
            name=op.f("fk_agent_workflow_events_agent_step_id_agent_steps"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["approval_id"],
            ["agent_approvals.id"],
            name=op.f("fk_agent_workflow_events_approval_id_agent_approvals"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_agent_workflow_events_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_agent_workflow_events")),
    )
    for column in ("id", "agent_run_id", "agent_step_id", "approval_id", "event_type", "user_id"):
        op.create_index(
            op.f(f"ix_agent_workflow_events_{column}"),
            "agent_workflow_events",
            [column],
            unique=False,
        )
    op.create_index(
        "ix_agent_workflow_events_run_created",
        "agent_workflow_events",
        ["agent_run_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_agent_workflow_events_user_created",
        "agent_workflow_events",
        ["user_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_agent_workflow_events_user_created",
        table_name="agent_workflow_events",
    )
    op.drop_index(
        "ix_agent_workflow_events_run_created",
        table_name="agent_workflow_events",
    )
    for column in ("user_id", "event_type", "approval_id", "agent_step_id", "agent_run_id", "id"):
        op.drop_index(
            op.f(f"ix_agent_workflow_events_{column}"),
            table_name="agent_workflow_events",
        )
    op.drop_table("agent_workflow_events")

    op.drop_index(
        "ix_agent_checkpoints_user_created",
        table_name="agent_checkpoints",
    )
    op.drop_index(
        "ix_agent_checkpoints_run_status",
        table_name="agent_checkpoints",
    )
    for column in ("user_id", "status", "execution_key", "approval_id", "agent_step_id", "agent_run_id", "id"):
        op.drop_index(
            op.f(f"ix_agent_checkpoints_{column}"),
            table_name="agent_checkpoints",
        )
    op.drop_table("agent_checkpoints")

    op.execute(
        "UPDATE agent_runs SET status = 'planned' "
        "WHERE status IN ('awaiting_approval', 'resuming')"
    )
    op.execute(
        "UPDATE agent_steps SET status = 'planned' "
        "WHERE status IN ('awaiting_approval', 'approved', 'resuming')"
    )
    op.execute(
        "UPDATE agent_steps SET status = 'skipped' "
        "WHERE status = 'rejected'"
    )

    with op.batch_alter_table("agent_steps") as batch_op:
        batch_op.drop_constraint(
            op.f("ck_agent_steps_status_values"),
            type_="check",
        )
        batch_op.create_check_constraint(
            op.f("ck_agent_steps_status_values"),
            OLD_STEP_STATUS_CHECK,
        )

    with op.batch_alter_table("agent_runs") as batch_op:
        batch_op.drop_constraint(
            op.f("ck_agent_runs_status_values"),
            type_="check",
        )
        batch_op.create_check_constraint(
            op.f("ck_agent_runs_status_values"),
            OLD_RUN_STATUS_CHECK,
        )
