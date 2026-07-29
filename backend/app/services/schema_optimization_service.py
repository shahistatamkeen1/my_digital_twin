from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import DateTime, Engine, inspect


EXPECTED_INDEXES: dict[str, tuple[str, ...]] = {
    "agent_memory": (
        "ix_agent_memory_user_agent_created",
        "ix_agent_memory_user_created",
    ),
    "agent_plans": (
        "ix_agent_plans_user_status",
        "ix_agent_plans_user_created",
    ),
    "agent_profiles": (
        "ix_agent_profiles_user_confidence",
    ),
    "agent_reflections": (
        "ix_agent_reflections_user_agent_created",
    ),
    "agent_runs": (
        "ix_agent_runs_user_status",
        "ix_agent_runs_user_created",
    ),
    "agent_steps": (
        "ix_agent_steps_user_status",
        "ix_agent_steps_run_agent",
    ),
    "applications": (
        "ix_applications_user_status",
        "ix_applications_user_created",
        "ix_applications_user_company_role",
    ),
    "career_memory": (
        "ix_career_memory_user_created",
    ),
    "career_roadmap": (
        "ix_career_roadmap_user_completed",
        "ix_career_roadmap_user_created",
    ),
    "finance_transactions": (
        "ix_finance_transactions_user_date",
        "ix_finance_transactions_user_type",
        "ix_finance_transactions_user_category",
    ),
    "savings_goals": (
        "ix_savings_goals_user_deadline",
    ),
    "health_habits": (
        "ix_health_habits_user_date",
    ),
    "learning_memory": (
        "ix_learning_memory_user_status",
        "ix_learning_memory_user_category",
    ),
    "learning_progress": (
        "ix_learning_progress_user_completed",
        "ix_learning_progress_user_created",
    ),
    "twin_progress_snapshots": (
        "ix_twin_progress_snapshots_user_created",
    ),
}


EXPECTED_CHECKS: dict[str, tuple[str, ...]] = {
    "agent_memory": ("ck_agent_memory_confidence_range",),
    "agent_plans": ("ck_agent_plans_completion_percent_range",),
    "agent_profiles": ("ck_agent_profiles_confidence_score_range",),
    "agent_reflections": (
        "ck_agent_reflections_confidence_score_range",
    ),
    "agent_runs": (
        "ck_agent_runs_status_values",
        "ck_agent_runs_execution_mode_values",
        "ck_agent_runs_total_tokens_nonnegative",
        "ck_agent_runs_estimated_cost_nonnegative",
    ),
    "agent_steps": (
        "ck_agent_steps_status_values",
        "ck_agent_steps_step_order_positive",
        "ck_agent_steps_attempt_count_nonnegative",
        "ck_agent_steps_timeout_seconds_positive",
        "ck_agent_steps_max_retries_nonnegative",
    ),
    "finance_transactions": (
        "ck_finance_transactions_amount_nonnegative",
    ),
    "savings_goals": (
        "ck_savings_goals_target_amount_positive",
        "ck_savings_goals_current_amount_nonnegative",
    ),
    "finance_memory": (
        "ck_finance_memory_monthly_income_nonnegative",
        "ck_finance_memory_target_savings_nonnegative",
    ),
    "health_memory": (
        "ck_health_memory_sleep_goal_range",
        "ck_health_memory_water_goal_range",
        "ck_health_memory_workout_goal_range",
    ),
    "health_habits": (
        "ck_health_habits_sleep_hours_range",
        "ck_health_habits_water_cups_range",
        "ck_health_habits_workout_minutes_range",
    ),
    "twin_progress_snapshots": (
        "ck_twin_progress_snapshots_career_score_range",
        "ck_twin_progress_snapshots_finance_score_range",
        "ck_twin_progress_snapshots_health_score_range",
        "ck_twin_progress_snapshots_learning_score_range",
        "ck_twin_progress_snapshots_overall_score_range",
    ),
}


UTC_TIMESTAMP_COLUMNS: dict[str, tuple[str, ...]] = {
    "users": ("created_at", "updated_at"),
    "agent_memory": ("created_at",),
    "agent_plans": ("created_at", "updated_at"),
    "agent_profiles": ("created_at", "updated_at"),
    "agent_reflections": ("created_at",),
    "agent_runs": ("created_at", "updated_at"),
    "agent_steps": ("created_at", "updated_at"),
    "applications": ("created_at",),
    "career_memory": ("created_at",),
    "career_roadmap": ("created_at",),
    "learning_progress": ("created_at",),
    "twin_progress_snapshots": ("created_at",),
}


SERVER_DEFAULT_OPTIONAL_COLUMNS = {
    "agent_runs.goal",
    "agent_steps.agent_run_id",
    "agent_steps.agent_name",
    "agent_steps.step_order",
}


REQUIRED_NOT_NULL_COLUMNS: dict[str, tuple[str, ...]] = {
    "users": (
        "role",
        "is_active",
        "is_verified",
        "created_at",
        "updated_at",
    ),
    "agent_memory": (
        "insight_type",
        "summary",
        "recommendation",
        "risks",
        "confidence",
        "source_question",
        "created_at",
    ),
    "agent_plans": (
        "plan_type",
        "tasks",
        "completed_tasks",
        "risks",
        "success_metric",
        "status",
        "completion_percent",
        "created_at",
        "updated_at",
    ),
    "agent_profiles": (
        "learned_preferences",
        "behavior_patterns",
        "recurring_goals",
        "recurring_risks",
        "decision_style",
        "confidence_score",
        "created_at",
        "updated_at",
    ),
    "agent_reflections": (
        "reflection_type",
        "wins",
        "concerns",
        "recommendation",
        "summary",
        "confidence_score",
        "created_at",
    ),
    "agent_runs": (
        "goal",
        "status",
        "execution_mode",
        "selected_agents",
        "preferred_agents",
        "include_weekly_plan",
        "routing_reason",
        "request_payload",
        "total_tokens",
        "estimated_cost",
        "created_at",
        "updated_at",
    ),
    "agent_steps": (
        "agent_run_id",
        "agent_name",
        "step_order",
        "status",
        "input_payload",
        "attempt_count",
        "timeout_seconds",
        "max_retries",
        "requires_approval",
        "created_at",
        "updated_at",
    ),
    "applications": ("status", "created_at"),
    "career_memory": ("created_at",),
    "career_roadmap": ("completed", "created_at"),
    "finance_memory": ("monthly_income", "target_monthly_savings"),
    "savings_goals": ("current_amount",),
    "health_memory": (
        "sleep_goal_hours",
        "water_goal_cups",
        "workout_goal_minutes",
    ),
    "health_habits": (
        "water_cups",
        "sleep_hours",
        "workout_minutes",
    ),
    "learning_memory": (
        "current_level",
        "target_level",
        "status",
    ),
    "learning_progress": ("completed", "created_at"),
    "twin_progress_snapshots": (
        "career_score",
        "finance_score",
        "health_score",
        "learning_score",
        "overall_score",
        "created_at",
    ),
}


@dataclass(frozen=True)
class SchemaOptimizationStatus:
    ready: bool
    missing_indexes: tuple[str, ...]
    missing_check_constraints: tuple[str, ...]
    nullable_columns: tuple[str, ...]
    timestamp_issues: tuple[str, ...]
    missing_server_defaults: tuple[str, ...]


def inspect_schema_optimization(engine: Engine) -> SchemaOptimizationStatus:
    inspector = inspect(engine)
    missing_indexes: list[str] = []
    missing_checks: list[str] = []
    nullable_columns: list[str] = []
    timestamp_issues: list[str] = []
    missing_defaults: list[str] = []

    for table, expected_names in EXPECTED_INDEXES.items():
        actual = {
            str(item.get("name"))
            for item in inspector.get_indexes(table)
            if item.get("name")
        }
        for name in expected_names:
            if name not in actual:
                missing_indexes.append(f"{table}.{name}")

    for table, expected_names in EXPECTED_CHECKS.items():
        actual = {
            str(item.get("name"))
            for item in inspector.get_check_constraints(table)
            if item.get("name")
        }
        for name in expected_names:
            if name not in actual:
                missing_checks.append(f"{table}.{name}")

    for table, required_columns in REQUIRED_NOT_NULL_COLUMNS.items():
        columns = {
            str(item["name"]): item
            for item in inspector.get_columns(table)
        }
        for name in required_columns:
            column = columns.get(name)
            if column is None:
                nullable_columns.append(f"{table}.{name}:missing")
                continue
            if column.get("nullable", True):
                nullable_columns.append(f"{table}.{name}")
            qualified_name = f"{table}.{name}"
            if (
                column.get("default") is None
                and qualified_name not in SERVER_DEFAULT_OPTIONAL_COLUMNS
            ):
                missing_defaults.append(qualified_name)

    if engine.dialect.name == "postgresql":
        for table, timestamp_columns in UTC_TIMESTAMP_COLUMNS.items():
            columns = {
                str(item["name"]): item
                for item in inspector.get_columns(table)
            }
            for name in timestamp_columns:
                column = columns.get(name)
                if column is None:
                    timestamp_issues.append(f"{table}.{name}:missing")
                    continue
                type_ = column.get("type")
                if not isinstance(type_, DateTime) or not bool(type_.timezone):
                    timestamp_issues.append(
                        f"{table}.{name}:not-timezone-aware"
                    )

    ready = not any(
        (
            missing_indexes,
            missing_checks,
            nullable_columns,
            timestamp_issues,
            missing_defaults,
        )
    )

    return SchemaOptimizationStatus(
        ready=ready,
        missing_indexes=tuple(sorted(missing_indexes)),
        missing_check_constraints=tuple(sorted(missing_checks)),
        nullable_columns=tuple(sorted(nullable_columns)),
        timestamp_issues=tuple(sorted(timestamp_issues)),
        missing_server_defaults=tuple(sorted(missing_defaults)),
    )
