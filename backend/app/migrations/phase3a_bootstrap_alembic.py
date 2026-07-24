from __future__ import annotations

import argparse
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

from alembic import command
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url

from app.config import settings
from app.services.migration_status_service import build_alembic_config
from app.services.ownership_schema_service import OWNED_TABLES


BASELINE_REVISION = "20260722_0001"
HEAD_REVISION = "head"
EXPECTED_APPLICATION_TABLES = {"users", *OWNED_TABLES}


def _resolve_sqlite_path(database_url: str) -> Path | None:
    url = make_url(database_url)
    if not url.drivername.startswith("sqlite"):
        return None
    if not url.database or url.database == ":memory:":
        return None

    database_path = Path(url.database)
    if not database_path.is_absolute():
        database_path = (Path.cwd() / database_path).resolve()
    return database_path


def _backup_sqlite_database(database_path: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = database_path.with_name(
        f"{database_path.stem}.phase3a-backup-{timestamp}{database_path.suffix}"
    )

    source = sqlite3.connect(database_path)
    destination = sqlite3.connect(backup_path)
    try:
        source.backup(destination)
    finally:
        destination.close()
        source.close()

    return backup_path


def _current_heads(connection) -> tuple[str, ...]:
    return tuple(sorted(MigrationContext.configure(connection).get_current_heads()))


def _table_counts(connection, tables: set[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for table in sorted(tables):
        counts[table] = int(
            connection.execute(
                text(f'SELECT COUNT(*) FROM "{table}"')
            ).scalar_one()
        )
    return counts


def _validate_phase2b_schema(connection) -> dict[str, int]:
    inspector = inspect(connection)
    available = set(inspector.get_table_names())
    missing = sorted(EXPECTED_APPLICATION_TABLES - available)
    if missing:
        raise RuntimeError(
            "The existing database is not a complete Phase 2B schema. "
            f"Missing tables: {', '.join(missing)}"
        )

    for table in OWNED_TABLES:
        columns = {column["name"] for column in inspector.get_columns(table)}
        if "user_id" not in columns:
            raise RuntimeError(f"Table {table} does not contain user_id.")

        unowned = int(
            connection.execute(
                text(f'SELECT COUNT(*) FROM "{table}" WHERE user_id IS NULL')
            ).scalar_one()
        )
        if unowned:
            raise RuntimeError(
                f"Table {table} contains {unowned} unowned rows. "
                "Complete Phase 2B before Phase 3A."
            )

    return _table_counts(connection, EXPECTED_APPLICATION_TABLES)


def bootstrap(database_url: str, create_backup: bool = True) -> dict:
    config = build_alembic_config(database_url)
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
        if database_url.startswith("sqlite")
        else {},
        pool_pre_ping=True,
    )

    sqlite_path = _resolve_sqlite_path(database_url)
    backup_path: Path | None = None
    if create_backup and sqlite_path is not None and sqlite_path.exists():
        backup_path = _backup_sqlite_database(sqlite_path)

    summary: dict[str, object] = {
        "database_url": database_url,
        "backup": str(backup_path) if backup_path else None,
        "mode": None,
        "before_heads": (),
        "after_heads": (),
        "before_counts": {},
        "after_counts": {},
    }

    try:
        with engine.connect() as connection:
            available = set(inspect(connection).get_table_names())
            application_tables = available - {"alembic_version"}
            before_heads = _current_heads(connection)
            summary["before_heads"] = before_heads

            if not application_tables:
                summary["mode"] = "new_database_upgrade"
            else:
                summary["before_counts"] = _validate_phase2b_schema(connection)
                summary["mode"] = (
                    "existing_versioned_upgrade"
                    if before_heads
                    else "legacy_phase2b_adoption"
                )

        if summary["mode"] == "new_database_upgrade":
            command.upgrade(config, HEAD_REVISION)
        elif summary["mode"] == "legacy_phase2b_adoption":
            command.stamp(config, BASELINE_REVISION, purge=True)
            command.upgrade(config, HEAD_REVISION)
        else:
            command.upgrade(config, HEAD_REVISION)

        with engine.connect() as connection:
            summary["after_heads"] = _current_heads(connection)
            summary["after_counts"] = _table_counts(
                connection,
                EXPECTED_APPLICATION_TABLES,
            )

        if summary["before_counts"] and (
            summary["before_counts"] != summary["after_counts"]
        ):
            raise RuntimeError(
                "Record counts changed during Phase 3A. The SQLite backup "
                "will be restored."
            )

        return summary
    except Exception:
        engine.dispose()
        if backup_path is not None and sqlite_path is not None:
            shutil.copy2(backup_path, sqlite_path)
        raise
    finally:
        engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Adopt an existing Phase 2B database into Alembic or create a "
            "new migrated database from scratch."
        )
    )
    parser.add_argument(
        "--database-url",
        default=settings.database_url,
        help="Override DATABASE_URL for this bootstrap run.",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip the automatic SQLite backup (not recommended).",
    )
    args = parser.parse_args()

    try:
        summary = bootstrap(
            database_url=args.database_url,
            create_backup=not args.no_backup,
        )
    except Exception as exc:
        print(f"Phase 3A Alembic bootstrap failed: {exc}", file=sys.stderr)
        return 1

    print("Phase 3A Alembic bootstrap completed.")
    print(f"Mode: {summary['mode']}")
    print(f"Backup: {summary['backup']}")
    print(f"Before revisions: {summary['before_heads']}")
    print(f"After revisions: {summary['after_heads']}")

    if summary["before_counts"]:
        print("Application record counts were preserved.")
        for table, count in summary["after_counts"].items():
            print(f"- {table}: {count}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
