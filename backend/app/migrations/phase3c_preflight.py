from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import inspect, text

from app.config import settings
from app.database import engine
from app.services.database_portability_service import (
    APPLICATION_TABLES,
    mask_database_url,
    table_counts,
)
from app.services.migration_status_service import inspect_migration_status
from app.services.schema_optimization_service import (
    REQUIRED_NOT_NULL_COLUMNS,
)


EXPECTED_START_HEAD = ("20260722_0002",)


RANGE_CHECKS: tuple[tuple[str, str, str], ...] = (
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


def _quoted(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Validate the active PostgreSQL database before applying the "
            "Phase 3C schema-optimization migration."
        )
    )
    parser.add_argument(
        "--snapshot-file",
        default=".phase3c-preflight.json",
    )
    args = parser.parse_args()

    try:
        if engine.dialect.name != "postgresql":
            raise RuntimeError(
                "Phase 3C production preflight requires PostgreSQL. "
                f"Active dialect: {engine.dialect.name}"
            )

        migration = inspect_migration_status(engine)
        if migration.current_heads != EXPECTED_START_HEAD:
            raise RuntimeError(
                "Phase 3C must start at revision 20260722_0002. "
                f"Current revisions: {migration.current_heads}"
            )

        inspector = inspect(engine)
        available = set(inspector.get_table_names())
        missing_tables = sorted(set(APPLICATION_TABLES) - available)
        if missing_tables:
            raise RuntimeError(
                "Missing application tables: " + ", ".join(missing_tables)
            )

        violations: list[str] = []
        null_backfills: dict[str, int] = {}

        with engine.connect() as connection:
            for table, column, condition in RANGE_CHECKS:
                count = int(
                    connection.execute(
                        text(
                            f"SELECT COUNT(*) FROM {_quoted(table)} "
                            f"WHERE {_quoted(column)} IS NOT NULL "
                            f"AND ({condition})"
                        )
                    ).scalar_one()
                )
                if count:
                    violations.append(
                        f"{table}.{column}: {count} invalid rows"
                    )

            for table, columns in REQUIRED_NOT_NULL_COLUMNS.items():
                for column in columns:
                    count = int(
                        connection.execute(
                            text(
                                f"SELECT COUNT(*) FROM {_quoted(table)} "
                                f"WHERE {_quoted(column)} IS NULL"
                            )
                        ).scalar_one()
                    )
                    if count:
                        null_backfills[f"{table}.{column}"] = count

        if violations:
            raise RuntimeError(
                "Unsafe values must be corrected before migration: "
                + "; ".join(violations)
            )

        snapshot_path = Path(args.snapshot_file).expanduser().resolve()
        snapshot = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "database": mask_database_url(settings.database_url),
            "dialect": engine.dialect.name,
            "starting_heads": migration.current_heads,
            "table_counts": table_counts(engine),
            "null_values_to_backfill": null_backfills,
            "timestamp_assumption": (
                "Legacy timezone-naive application timestamps are interpreted "
                "as UTC during migration."
            ),
        }
        snapshot_path.write_text(
            json.dumps(snapshot, indent=2, sort_keys=True),
            encoding="utf-8",
        )
    except Exception as exc:
        print(f"Phase 3C preflight failed: {exc}", file=sys.stderr)
        return 1

    print("Phase 3C preflight passed.")
    print(f"Database: {mask_database_url(settings.database_url)}")
    print(f"Starting revision: {EXPECTED_START_HEAD[0]}")
    print(f"Verified tables: {len(APPLICATION_TABLES)}")
    print(f"Null values to backfill: {sum(null_backfills.values())}")
    print(f"Snapshot: {snapshot_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
