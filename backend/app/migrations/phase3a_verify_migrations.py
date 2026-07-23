from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

from alembic import command
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect, text

from app.config import settings
from app.services.migration_status_service import build_alembic_config
from app.services.ownership_schema_service import OWNED_TABLES


EXPECTED_TABLES = {"users", *OWNED_TABLES}


def _heads(database_url: str) -> tuple[tuple[str, ...], tuple[str, ...]]:
    config = build_alembic_config(database_url)
    scripts = ScriptDirectory.from_config(config)
    expected = tuple(sorted(scripts.get_heads()))
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
        if database_url.startswith("sqlite")
        else {},
    )
    try:
        with engine.connect() as connection:
            current = tuple(
                sorted(MigrationContext.configure(connection).get_current_heads())
            )
        return current, expected
    finally:
        engine.dispose()


def verify_database(database_url: str) -> dict[str, object]:
    current_heads, expected_heads = _heads(database_url)
    if current_heads != expected_heads or not expected_heads:
        raise RuntimeError(
            f"Database revisions are not at head. Current={current_heads}, "
            f"expected={expected_heads}."
        )

    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
        if database_url.startswith("sqlite")
        else {},
        pool_pre_ping=True,
    )

    try:
        inspector = inspect(engine)
        available = set(inspector.get_table_names())
        missing = sorted(EXPECTED_TABLES - available)
        if missing:
            raise RuntimeError(f"Missing application tables: {missing}")

        with engine.connect() as connection:
            for table in OWNED_TABLES:
                columns = {
                    column["name"]: column
                    for column in inspector.get_columns(table)
                }
                user_column = columns.get("user_id")
                if user_column is None:
                    raise RuntimeError(f"{table}.user_id is missing.")
                if user_column.get("nullable", True):
                    raise RuntimeError(f"{table}.user_id is still nullable.")

                unowned = int(
                    connection.execute(
                        text(
                            f'SELECT COUNT(*) FROM "{table}" '
                            "WHERE user_id IS NULL"
                        )
                    ).scalar_one()
                )
                if unowned:
                    raise RuntimeError(
                        f"{table} still contains {unowned} unowned rows."
                    )

                foreign_keys = inspector.get_foreign_keys(table)
                owns_user_fk = any(
                    fk.get("referred_table") == "users"
                    and fk.get("constrained_columns") == ["user_id"]
                    and fk.get("referred_columns") == ["id"]
                    for fk in foreign_keys
                )
                if not owns_user_fk:
                    raise RuntimeError(
                        f"{table}.user_id does not have a foreign key to users.id."
                    )

            if database_url.startswith("sqlite"):
                pragma = int(
                    connection.execute(text("PRAGMA foreign_keys")).scalar_one()
                )
                # This verifier creates a standalone engine without the app's
                # connection listener, so enable and confirm enforcement here.
                if pragma == 0:
                    connection.execute(text("PRAGMA foreign_keys=ON"))
                    pragma = int(
                        connection.execute(text("PRAGMA foreign_keys")).scalar_one()
                    )
                if pragma != 1:
                    raise RuntimeError("SQLite foreign-key enforcement is disabled.")

        return {
            "current_heads": current_heads,
            "expected_heads": expected_heads,
            "tables": len(EXPECTED_TABLES),
            "owned_tables": len(OWNED_TABLES),
        }
    finally:
        engine.dispose()


def fresh_database_smoke_test() -> dict[str, object]:
    with tempfile.TemporaryDirectory(prefix="mdt-phase3a-") as temp_dir:
        database_path = Path(temp_dir) / "fresh.db"
        database_url = f"sqlite:///{database_path.as_posix()}"
        config = build_alembic_config(database_url)

        command.upgrade(config, "head")
        result = verify_database(database_url)
        command.downgrade(config, "base")

        engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False},
        )
        try:
            remaining = set(inspect(engine).get_table_names())
        finally:
            engine.dispose()

        unexpected = remaining - {"alembic_version"}
        if unexpected:
            raise RuntimeError(
                f"Downgrade to base left application tables behind: {unexpected}"
            )

        return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Verify the Phase 3A Alembic migration foundation."
    )
    parser.add_argument(
        "--database-url",
        default=settings.database_url,
        help="Database URL to verify.",
    )
    parser.add_argument(
        "--skip-fresh-smoke-test",
        action="store_true",
    )
    args = parser.parse_args()

    try:
        current = verify_database(args.database_url)
        fresh = (
            None
            if args.skip_fresh_smoke_test
            else fresh_database_smoke_test()
        )
    except Exception as exc:
        print(f"Phase 3A verification failed: {exc}", file=sys.stderr)
        return 1

    print("Current database migration verification passed.")
    print(f"Current revision heads: {current['current_heads']}")
    print(f"Verified owned tables: {current['owned_tables']}")

    if fresh is not None:
        print("Fresh database upgrade/downgrade smoke test passed.")
        print(f"Fresh revision heads: {fresh['current_heads']}")

    print("Phase 3A Alembic verification passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
