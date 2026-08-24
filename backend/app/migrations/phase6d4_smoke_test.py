from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect

from app.services.migration_status_service import build_alembic_config


BACKEND_DIR = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = BACKEND_DIR / ".test_artifacts"
DATABASE_FILE = ARTIFACT_DIR / "phase6d4_migration.db"
DATABASE_URL = f"sqlite:///{DATABASE_FILE.as_posix()}"
EXPECTED_HEAD = "20260823_0008"


def _current_heads(engine) -> tuple[str, ...]:
    with engine.connect() as connection:
        context = MigrationContext.configure(connection)
        return tuple(sorted(context.get_current_heads()))


def verify() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    for suffix in ("", "-journal", "-shm", "-wal"):
        path = Path(f"{DATABASE_FILE}{suffix}")
        if path.exists():
            path.unlink()

    config = build_alembic_config(DATABASE_URL)
    engine = create_engine(DATABASE_URL)

    try:
        command.upgrade(config, "head")
        inspector = inspect(engine)
        assert _current_heads(engine) == (EXPECTED_HEAD,)
        tables = set(inspector.get_table_names())
        assert {"agent_action_outbox", "agent_action_outbox_events"}.issubset(tables)

        columns = {
            item["name"]
            for item in inspector.get_columns("agent_action_outbox")
        }
        assert {
            "approval_id",
            "agent_run_id",
            "agent_step_id",
            "idempotency_key",
            "action_type",
            "execution_payload",
            "execution_mode",
            "status",
            "attempt_count",
            "max_attempts",
            "result_payload",
            "last_error",
            "user_id",
        }.issubset(columns)

        command.downgrade(config, "20260813_0007")
        downgraded = set(inspect(engine).get_table_names())
        assert "agent_action_outbox" not in downgraded
        assert "agent_action_outbox_events" not in downgraded

        command.upgrade(config, "head")
        assert _current_heads(engine) == (EXPECTED_HEAD,)
    finally:
        engine.dispose()
        for suffix in ("", "-journal", "-shm", "-wal"):
            path = Path(f"{DATABASE_FILE}{suffix}")
            if path.exists():
                path.unlink()

    print("Phase 6D4 Action Outbox migration smoke test passed.")


if __name__ == "__main__":
    verify()
