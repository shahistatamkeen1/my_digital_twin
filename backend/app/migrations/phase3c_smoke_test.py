from __future__ import annotations

import tempfile
from pathlib import Path

from alembic import command
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import configure_mappers

from app.models.agent_memory import AgentMemory
from app.models.agent_plan import AgentPlan
from app.models.agent_profile import AgentProfile
from app.models.agent_reflection import AgentReflection
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
from app.services.migration_status_service import build_alembic_config
from app.services.schema_optimization_service import inspect_schema_optimization


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
    (TwinProgressSnapshot, "user", "twin_progress_snapshots"),
)


def _verify_relationships() -> None:
    configure_mappers()
    user_relationships = inspect(User).relationships

    for model, child_name, parent_name in RELATIONSHIPS:
        if child_name not in inspect(model).relationships:
            raise RuntimeError(
                f"{model.__name__}.{child_name} relationship is missing."
            )
        if parent_name not in user_relationships:
            raise RuntimeError(
                f"User.{parent_name} relationship is missing."
            )


def main() -> int:
    _verify_relationships()

    with tempfile.TemporaryDirectory(prefix="mdt-phase3c-") as temp_dir:
        database_path = Path(temp_dir) / "phase3c-smoke.db"
        database_url = f"sqlite:///{database_path.as_posix()}"
        config = build_alembic_config(database_url)

        command.upgrade(config, "20260722_0002")

        engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False},
        )
        try:
            with engine.begin() as connection:
                connection.execute(text("PRAGMA foreign_keys=ON"))
                user_id = connection.execute(
                    text(
                        'INSERT INTO "users" '
                        "(email, full_name, hashed_password, role, is_active, "
                        "is_verified, created_at, updated_at) "
                        "VALUES ('phase3c@example.com', 'Phase 3C', 'hash', "
                        "'user', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
                    )
                ).lastrowid

                connection.execute(
                    text(
                        'INSERT INTO "applications" '
                        "(company, role, status, created_at, user_id) "
                        "VALUES ('Smoke Company', 'Engineer', NULL, NULL, :user_id)"
                    ),
                    {"user_id": user_id},
                )
                connection.execute(
                    text(
                        'INSERT INTO "finance_transactions" '
                        "(type, title, amount, category, user_id) "
                        "VALUES ('Expense', 'Smoke', 25, 'Test', :user_id)"
                    ),
                    {"user_id": user_id},
                )
        finally:
            engine.dispose()

        command.upgrade(config, "head")

        engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False},
        )
        try:
            optimization = inspect_schema_optimization(engine)
            if not optimization.ready:
                raise RuntimeError(
                    "Fresh SQLite Phase 3C schema verification failed: "
                    f"{optimization}"
                )

            with engine.connect() as connection:
                application = connection.execute(
                    text(
                        'SELECT status, created_at FROM "applications" LIMIT 1'
                    )
                ).one()
                if application.status != "Saved":
                    raise RuntimeError("Application status was not backfilled.")
                if application.created_at is None:
                    raise RuntimeError("Application timestamp was not backfilled.")

                application_count = int(
                    connection.execute(
                        text('SELECT COUNT(*) FROM "applications"')
                    ).scalar_one()
                )
                if application_count != 1:
                    raise RuntimeError("Application row count changed.")
        finally:
            engine.dispose()

        command.downgrade(config, "20260722_0002")
        command.upgrade(config, "head")

    print("Phase 3C upgrade/downgrade smoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
