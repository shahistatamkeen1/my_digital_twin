from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect

from app.services.migration_status_service import build_alembic_config


BACKEND_DIR = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = BACKEND_DIR / ".test_artifacts"
DATABASE_FILE = ARTIFACT_DIR / "phase6d1_migration.db"
DATABASE_URL = f"sqlite:///{DATABASE_FILE.as_posix()}"
EXPECTED_HEAD = "20260806_0006"


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
        assert "agent_approvals" in inspector.get_table_names()
        assert "agent_approval_events" in inspector.get_table_names()

        approval_columns = {
            item["name"]
            for item in inspector.get_columns("agent_approvals")
        }
        assert {
            "agent_run_id",
            "agent_step_id",
            "action_type",
            "action_summary",
            "proposed_payload",
            "decision_payload",
            "status",
            "decision_note",
            "requested_at",
            "decided_at",
            "expires_at",
            "user_id",
        }.issubset(approval_columns)

        event_columns = {
            item["name"]
            for item in inspector.get_columns("agent_approval_events")
        }
        assert {
            "approval_id",
            "event_type",
            "previous_status",
            "new_status",
            "note",
            "event_payload",
            "user_id",
        }.issubset(event_columns)

        command.downgrade(config, "20260729_0005")
        downgraded_tables = set(inspect(engine).get_table_names())
        assert "agent_approvals" not in downgraded_tables
        assert "agent_approval_events" not in downgraded_tables

        command.upgrade(config, "head")
        assert _current_heads(engine) == (EXPECTED_HEAD,)
    finally:
        engine.dispose()
        for suffix in ("", "-journal", "-shm", "-wal"):
            path = Path(f"{DATABASE_FILE}{suffix}")
            if path.exists():
                path.unlink()

    print("Phase 6D1 Alembic migration smoke test passed.")


if __name__ == "__main__":
    verify()
