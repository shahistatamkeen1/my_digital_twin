from __future__ import annotations

import argparse
import json
import sys
import uuid
from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import configure_mappers

from app.config import settings
from app.database import engine
from app.models.agent_memory import AgentMemory
from app.models.agent_plan import AgentPlan
from app.models.agent_profile import AgentProfile
from app.models.agent_reflection import AgentReflection
from app.models.agent_run import AgentRun, AgentStep
from app.models.application import Application
from app.models.finance import FinanceMemory, FinanceTransaction, SavingsGoal
from app.models.health import HealthHabit, HealthMemory
from app.models.learning import LearningMemory
from app.models.learning_progress import LearningProgress
from app.models.memory import CareerMemory
from app.models.personal_memory import PersonalMemory
from app.models.roadmap import CareerRoadmap
from app.models.twin_snapshot import TwinProgressSnapshot
from app.models.user import User
from app.services.database_portability_service import (
    mask_database_url,
    table_counts,
)
from app.services.migration_status_service import inspect_migration_status
from app.services.ownership_schema_service import inspect_ownership_schema
from app.services.schema_optimization_service import (
    inspect_schema_optimization,
)


EXPECTED_HEAD = ("20260729_0005",)


RELATIONSHIPS: tuple[tuple[type, str, str], ...] = (
    (Application, "user", "applications"),
    (CareerMemory, "user", "career_memories"),
    (CareerRoadmap, "user", "career_roadmaps"),
    (FinanceTransaction, "user", "finance_transactions"),
    (SavingsGoal, "user", "savings_goals"),
    (FinanceMemory, "user", "finance_memories"),
    (HealthMemory, "user", "health_memories"),
    (HealthHabit, "user", "health_habits"),
    (LearningMemory, "user", "learning_memories"),
    (LearningProgress, "user", "learning_progress_items"),
    (PersonalMemory, "user", "personal_memories"),
    (AgentMemory, "user", "agent_memories"),
    (AgentPlan, "user", "agent_plans"),
    (AgentProfile, "user", "agent_profiles"),
    (AgentReflection, "user", "agent_reflections"),
    (AgentRun, "user", "agent_runs"),
    (AgentStep, "user", "agent_steps"),
    (TwinProgressSnapshot, "user", "twin_progress_snapshots"),
)


def _verify_relationships() -> None:
    configure_mappers()
    user_relationships = inspect(User).relationships

    for model, child_name, parent_name in RELATIONSHIPS:
        child_relationships = inspect(model).relationships
        if child_name not in child_relationships:
            raise RuntimeError(
                f"{model.__name__}.{child_name} relationship is missing."
            )
        if parent_name not in user_relationships:
            raise RuntimeError(
                f"User.{parent_name} relationship is missing."
            )

        child = child_relationships[child_name]
        parent = user_relationships[parent_name]
        if child.back_populates != parent_name:
            raise RuntimeError(
                f"{model.__name__}.{child_name} back_populates is incorrect."
            )
        if parent.back_populates != child_name:
            raise RuntimeError(
                f"User.{parent_name} back_populates is incorrect."
            )


def _verify_snapshot(snapshot_file: str) -> None:
    path = Path(snapshot_file).expanduser().resolve()
    if not path.exists():
        print(
            f"Preflight snapshot not found; skipping count comparison: {path}"
        )
        return

    snapshot = json.loads(path.read_text(encoding="utf-8"))
    expected_counts = {
        str(key): int(value)
        for key, value in snapshot.get("table_counts", {}).items()
    }
    actual_counts = table_counts(engine)

    if expected_counts != actual_counts:
        mismatched = sorted(
            table
            for table in set(expected_counts) | set(actual_counts)
            if expected_counts.get(table) != actual_counts.get(table)
        )
        raise RuntimeError(
            "Record counts changed during Phase 3C migration: "
            + ", ".join(mismatched)
        )


def _verify_database_cascade_and_defaults() -> None:
    suffix = uuid.uuid4().hex
    connection = engine.connect()
    transaction = connection.begin()

    try:
        user_id = connection.execute(
            text(
                'INSERT INTO "users" '
                "(email, full_name, hashed_password) "
                "VALUES (:email, :full_name, :password) RETURNING id"
            ),
            {
                "email": f"phase3c-{suffix}@example.com",
                "full_name": "Phase 3C Verification",
                "password": "not-a-real-password-hash",
            },
        ).scalar_one()

        application_id = connection.execute(
            text(
                'INSERT INTO "applications" '
                "(user_id, company, role) "
                "VALUES (:user_id, :company, :role) RETURNING id"
            ),
            {
                "user_id": user_id,
                "company": "Phase 3C Verification",
                "role": "Schema Test",
            },
        ).scalar_one()

        created_at = connection.execute(
            text(
                'SELECT created_at FROM "applications" WHERE id = :id'
            ),
            {"id": application_id},
        ).scalar_one()
        if created_at is None or created_at.tzinfo is None:
            raise RuntimeError(
                "Application created_at default is not timezone-aware."
            )

        savepoint = connection.begin_nested()
        try:
            connection.execute(
                text(
                    'INSERT INTO "finance_transactions" '
                    "(user_id, type, title, amount, category) "
                    "VALUES (:user_id, 'Expense', 'Invalid', -1, 'Test')"
                ),
                {"user_id": user_id},
            )
        except IntegrityError:
            savepoint.rollback()
        else:
            savepoint.rollback()
            raise RuntimeError(
                "Negative finance transaction bypassed the check constraint."
            )

        connection.execute(
            text('DELETE FROM "users" WHERE id = :id'),
            {"id": user_id},
        )
        remaining = int(
            connection.execute(
                text(
                    'SELECT COUNT(*) FROM "applications" WHERE id = :id'
                ),
                {"id": application_id},
            ).scalar_one()
        )
        if remaining:
            raise RuntimeError(
                "ON DELETE CASCADE did not remove the test application."
            )
    finally:
        transaction.rollback()
        connection.close()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Verify Phase 3C relationships, constraints, indexes, timestamps, "
            "defaults, row counts, and cascade behavior."
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
                "Phase 3C production verification requires PostgreSQL. "
                f"Active dialect: {engine.dialect.name}"
            )

        migration = inspect_migration_status(engine)
        if migration.current_heads != EXPECTED_HEAD:
            raise RuntimeError(
                f"Expected migration head {EXPECTED_HEAD}, received "
                f"{migration.current_heads}."
            )

        ownership = inspect_ownership_schema(engine)
        if not ownership.ready:
            raise RuntimeError(
                "Ownership schema verification failed before Phase 3C checks."
            )

        optimization = inspect_schema_optimization(engine)
        if not optimization.ready:
            raise RuntimeError(
                "Schema optimization is incomplete: "
                f"missing_indexes={optimization.missing_indexes}; "
                "missing_checks="
                f"{optimization.missing_check_constraints}; "
                f"nullable_columns={optimization.nullable_columns}; "
                f"timestamp_issues={optimization.timestamp_issues}; "
                "missing_defaults="
                f"{optimization.missing_server_defaults}"
            )

        _verify_relationships()
        _verify_snapshot(args.snapshot_file)
        _verify_database_cascade_and_defaults()
    except Exception as exc:
        print(f"Phase 3C verification failed: {exc}", file=sys.stderr)
        return 1

    print("Phase 3C schema verification passed.")
    print(f"Database: {mask_database_url(settings.database_url)}")
    print(f"Migration head: {EXPECTED_HEAD[0]}")
    print("Relationships: 18 user-owned model mappings verified")
    print("Indexes, checks, defaults, UTC timestamps, and cascade verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
