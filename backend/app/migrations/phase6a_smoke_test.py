from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect

from app.services.migration_status_service import build_alembic_config
from app.services.ownership_schema_service import inspect_ownership_schema
from app.services.schema_optimization_service import inspect_schema_optimization


BACKEND_DIR = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = BACKEND_DIR / ".test_artifacts"
DATABASE_FILE = ARTIFACT_DIR / "phase6a_migration.db"
DATABASE_URL = f"sqlite:///{DATABASE_FILE.as_posix()}"
EXPECTED_HEAD = "20260729_0004"


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
        tables = set(inspector.get_table_names())
        assert {"agent_runs", "agent_steps"}.issubset(tables)
        assert _current_heads(engine) == (EXPECTED_HEAD,)

        run_columns = {
            item["name"]: item for item in inspector.get_columns("agent_runs")
        }
        step_columns = {
            item["name"]: item for item in inspector.get_columns("agent_steps")
        }
        assert run_columns["user_id"]["nullable"] is False
        assert step_columns["user_id"]["nullable"] is False
        assert run_columns["selected_agents"]["nullable"] is False
        assert step_columns["input_payload"]["nullable"] is False

        ownership = inspect_ownership_schema(engine)
        optimization = inspect_schema_optimization(engine)
        assert ownership.ready, ownership
        assert optimization.ready, optimization

        command.downgrade(config, "20260723_0003")
        assert "agent_runs" not in set(inspect(engine).get_table_names())
        assert "agent_steps" not in set(inspect(engine).get_table_names())

        command.upgrade(config, "head")
        assert _current_heads(engine) == (EXPECTED_HEAD,)
    finally:
        engine.dispose()
        for suffix in ("", "-journal", "-shm", "-wal"):
            path = Path(f"{DATABASE_FILE}{suffix}")
            if path.exists():
                path.unlink()

    print("Phase 6A Alembic migration smoke test passed.")


if __name__ == "__main__":
    verify()
