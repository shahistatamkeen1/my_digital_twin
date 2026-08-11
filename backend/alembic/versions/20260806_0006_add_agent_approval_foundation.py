"""Add durable agent approvals and immutable approval audit events.

Revision ID: 20260806_0006
Revises: 20260729_0005
Create Date: 2026-08-06
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260806_0006"
down_revision: Union[str, Sequence[str], None] = "20260729_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agent_approvals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_run_id", sa.Integer(), nullable=False),
        sa.Column("agent_step_id", sa.Integer(), nullable=True),
        sa.Column("action_type", sa.String(length=48), nullable=False),
        sa.Column("action_summary", sa.Text(), nullable=False),
        sa.Column(
            "proposed_payload",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
        sa.Column("decision_payload", sa.JSON(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("decision_note", sa.Text(), nullable=True),
        sa.Column(
            "requested_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
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
            "status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')",
            name=op.f("ck_agent_approvals_status_values"),
        ),
        sa.CheckConstraint(
            "action_type IN ('send_email', 'create_calendar_event', "
            "'submit_application', 'delete_data', 'change_financial_plan', "
            "'external_action', 'other')",
            name=op.f("ck_agent_approvals_action_type_values"),
        ),
        sa.ForeignKeyConstraint(
            ["agent_run_id"],
            ["agent_runs.id"],
            name=op.f("fk_agent_approvals_agent_run_id_agent_runs"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["agent_step_id"],
            ["agent_steps.id"],
            name=op.f("fk_agent_approvals_agent_step_id_agent_steps"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_agent_approvals_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name=op.f("pk_agent_approvals"),
        ),
    )
    op.create_index(
        op.f("ix_agent_approvals_action_type"),
        "agent_approvals",
        ["action_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_approvals_agent_run_id"),
        "agent_approvals",
        ["agent_run_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_approvals_agent_step_id"),
        "agent_approvals",
        ["agent_step_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_approvals_id"),
        "agent_approvals",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_approvals_status"),
        "agent_approvals",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_approvals_user_id"),
        "agent_approvals",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_agent_approvals_user_status",
        "agent_approvals",
        ["user_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_agent_approvals_run_status",
        "agent_approvals",
        ["agent_run_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_agent_approvals_user_requested",
        "agent_approvals",
        ["user_id", "requested_at"],
        unique=False,
    )

    op.create_table(
        "agent_approval_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("approval_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column("previous_status", sa.String(length=32), nullable=True),
        sa.Column("new_status", sa.String(length=32), nullable=False),
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
            "event_type IN ('requested', 'approved', 'rejected', 'cancelled', 'expired')",
            name=op.f("ck_agent_approval_events_event_type_values"),
        ),
        sa.CheckConstraint(
            "new_status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')",
            name=op.f("ck_agent_approval_events_new_status_values"),
        ),
        sa.ForeignKeyConstraint(
            ["approval_id"],
            ["agent_approvals.id"],
            name=op.f("fk_agent_approval_events_approval_id_agent_approvals"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_agent_approval_events_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name=op.f("pk_agent_approval_events"),
        ),
    )
    op.create_index(
        op.f("ix_agent_approval_events_approval_id"),
        "agent_approval_events",
        ["approval_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_approval_events_id"),
        "agent_approval_events",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_approval_events_user_id"),
        "agent_approval_events",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_agent_approval_events_user_created",
        "agent_approval_events",
        ["user_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_agent_approval_events_approval_created",
        "agent_approval_events",
        ["approval_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_agent_approval_events_approval_created",
        table_name="agent_approval_events",
    )
    op.drop_index(
        "ix_agent_approval_events_user_created",
        table_name="agent_approval_events",
    )
    op.drop_index(
        op.f("ix_agent_approval_events_user_id"),
        table_name="agent_approval_events",
    )
    op.drop_index(
        op.f("ix_agent_approval_events_id"),
        table_name="agent_approval_events",
    )
    op.drop_index(
        op.f("ix_agent_approval_events_approval_id"),
        table_name="agent_approval_events",
    )
    op.drop_table("agent_approval_events")

    op.drop_index(
        "ix_agent_approvals_user_requested",
        table_name="agent_approvals",
    )
    op.drop_index(
        "ix_agent_approvals_run_status",
        table_name="agent_approvals",
    )
    op.drop_index(
        "ix_agent_approvals_user_status",
        table_name="agent_approvals",
    )
    op.drop_index(
        op.f("ix_agent_approvals_user_id"),
        table_name="agent_approvals",
    )
    op.drop_index(
        op.f("ix_agent_approvals_status"),
        table_name="agent_approvals",
    )
    op.drop_index(
        op.f("ix_agent_approvals_id"),
        table_name="agent_approvals",
    )
    op.drop_index(
        op.f("ix_agent_approvals_agent_step_id"),
        table_name="agent_approvals",
    )
    op.drop_index(
        op.f("ix_agent_approvals_agent_run_id"),
        table_name="agent_approvals",
    )
    op.drop_index(
        op.f("ix_agent_approvals_action_type"),
        table_name="agent_approvals",
    )
    op.drop_table("agent_approvals")
