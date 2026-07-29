from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect

from app.services.migration_status_service import build_alembic_config


BACKEND_DIR = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = BACKEND_DIR / ".test_artifacts"
DATABASE_FILE = ARTIFACT_DIR / "phase6b_migration.db"
DATABASE_URL = f"sqlite:///{DATABASE_FILE.as_posix()}"
EXPECTED_HEAD = "20260729_0005"


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

        run_columns = {
            item["name"]: item for item in inspector.get_columns("agent_runs")
        }
        step_columns = {
            item["name"]: item for item in inspector.get_columns("agent_steps")
        }

        assert {
            "execution_provider",
            "prompt_tokens",
            "completion_tokens",
            "duration_ms",
            "fallback_count",
        }.issubset(run_columns)
        assert {
            "provider",
            "model",
            "fallback_used",
            "prompt_tokens",
            "completion_tokens",
            "total_tokens",
            "estimated_cost",
            "duration_ms",
        }.issubset(step_columns)

        command.downgrade(config, "20260729_0004")
        downgraded_runs = {
            item["name"] for item in inspect(engine).get_columns("agent_runs")
        }
        assert "execution_provider" not in downgraded_runs

        command.upgrade(config, "head")
        assert _current_heads(engine) == (EXPECTED_HEAD,)
    finally:
        engine.dispose()
        for suffix in ("", "-journal", "-shm", "-wal"):
            path = Path(f"{DATABASE_FILE}{suffix}")
            if path.exists():
                path.unlink()

    print("Phase 6B Alembic migration smoke test passed.")


if __name__ == "__main__":
    verify()
