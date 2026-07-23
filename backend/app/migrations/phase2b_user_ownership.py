from __future__ import annotations

import argparse
import shutil
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url

from app.config import settings
from app.services.ownership_schema_service import OWNED_TABLES


AGENT_PROFILES_TABLE_SQL = """
CREATE TABLE agent_profiles_phase2b (
    id INTEGER NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    agent_name VARCHAR NOT NULL,
    learned_preferences TEXT,
    behavior_patterns TEXT,
    recurring_goals TEXT,
    recurring_risks TEXT,
    decision_style VARCHAR,
    confidence_score INTEGER,
    created_at DATETIME,
    updated_at DATETIME,
    CONSTRAINT uq_agent_profiles_user_agent UNIQUE (user_id, agent_name),
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)
"""


def _quote(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _resolve_sqlite_path(database_url: str) -> Path:
    url = make_url(database_url)
    if not url.drivername.startswith("sqlite"):
        raise RuntimeError(
            "Phase 2B's controlled migration currently supports SQLite only. "
            "PostgreSQL and Alembic are introduced in Phase 3."
        )

    if not url.database or url.database == ":memory:":
        raise RuntimeError("A file-based SQLite database is required.")

    database_path = Path(url.database)
    if not database_path.is_absolute():
        database_path = (Path.cwd() / database_path).resolve()

    return database_path


def _backup_database(database_path: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = database_path.with_name(
        f"{database_path.stem}.phase2b-backup-{timestamp}{database_path.suffix}"
    )
    shutil.copy2(database_path, backup_path)
    return backup_path


def _find_owner_id(connection, owner_email: str) -> int:
    row = connection.execute(
        text(
            "SELECT id FROM users "
            "WHERE lower(email) = lower(:owner_email) LIMIT 1"
        ),
        {"owner_email": owner_email.strip()},
    ).first()

    if row is None:
        raise RuntimeError(
            "No registered user was found for the supplied owner email. "
            "Create or log in to the Phase 2A account first."
        )

    return int(row[0])


def _table_columns(connection, table: str) -> set[str]:
    rows = connection.execute(
        text(f"PRAGMA table_info({_quote(table)})")
    ).fetchall()
    return {str(row[1]) for row in rows}


def _rebuild_agent_profiles(connection, owner_id: int) -> None:
    columns = _table_columns(connection, "agent_profiles")
    has_user_id = "user_id" in columns

    connection.execute(text("PRAGMA foreign_keys=OFF"))
    connection.execute(text("DROP TABLE IF EXISTS agent_profiles_phase2b"))
    connection.execute(text(AGENT_PROFILES_TABLE_SQL))

    user_expression = "COALESCE(user_id, :owner_id)" if has_user_id else ":owner_id"

    connection.execute(
        text(
            f"""
            INSERT INTO agent_profiles_phase2b (
                id,
                user_id,
                agent_name,
                learned_preferences,
                behavior_patterns,
                recurring_goals,
                recurring_risks,
                decision_style,
                confidence_score,
                created_at,
                updated_at
            )
            SELECT
                id,
                {user_expression},
                agent_name,
                learned_preferences,
                behavior_patterns,
                recurring_goals,
                recurring_risks,
                decision_style,
                confidence_score,
                created_at,
                updated_at
            FROM agent_profiles
            """
        ),
        {"owner_id": owner_id},
    )

    connection.execute(text("DROP TABLE agent_profiles"))
    connection.execute(
        text("ALTER TABLE agent_profiles_phase2b RENAME TO agent_profiles")
    )
    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_agent_profiles_id "
            "ON agent_profiles (id)"
        )
    )
    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_agent_profiles_user_id "
            "ON agent_profiles (user_id)"
        )
    )
    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_agent_profiles_agent_name "
            "ON agent_profiles (agent_name)"
        )
    )
    connection.execute(text("PRAGMA foreign_keys=ON"))


def migrate(owner_email: str, create_backup: bool = True) -> dict:
    database_path = _resolve_sqlite_path(settings.database_url)

    if not database_path.exists():
        raise RuntimeError(f"Database file not found: {database_path}")

    backup_path = _backup_database(database_path) if create_backup else None
    migration_engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
    )

    summary: dict[str, object] = {
        "database": str(database_path),
        "backup": str(backup_path) if backup_path else None,
        "owner_email": owner_email,
        "tables": {},
    }

    try:
        with migration_engine.begin() as connection:
            available_tables = set(inspect(connection).get_table_names())

            if "users" not in available_tables:
                raise RuntimeError(
                    "The users table does not exist. Apply and verify Phase 2A first."
                )

            owner_id = _find_owner_id(connection, owner_email)
            summary["owner_user_id"] = owner_id

            for table in OWNED_TABLES:
                if table not in available_tables:
                    summary["tables"][table] = {"status": "missing"}
                    continue

                if table == "agent_profiles":
                    _rebuild_agent_profiles(connection, owner_id)
                    remaining = connection.execute(
                        text(
                            "SELECT COUNT(*) FROM agent_profiles "
                            "WHERE user_id IS NULL"
                        )
                    ).scalar_one()
                    summary["tables"][table] = {
                        "status": "rebuilt",
                        "unowned_rows": int(remaining),
                    }
                    continue

                columns = _table_columns(connection, table)
                column_added = False

                if "user_id" not in columns:
                    connection.execute(
                        text(
                            f"ALTER TABLE {_quote(table)} "
                            "ADD COLUMN user_id INTEGER"
                        )
                    )
                    column_added = True

                updated = connection.execute(
                    text(
                        f"UPDATE {_quote(table)} SET user_id = :owner_id "
                        "WHERE user_id IS NULL"
                    ),
                    {"owner_id": owner_id},
                ).rowcount

                connection.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS "
                        f"{_quote(f'ix_{table}_user_id')} "
                        f"ON {_quote(table)} (user_id)"
                    )
                )

                remaining = connection.execute(
                    text(
                        f"SELECT COUNT(*) FROM {_quote(table)} "
                        "WHERE user_id IS NULL"
                    )
                ).scalar_one()

                summary["tables"][table] = {
                    "status": "updated",
                    "column_added": column_added,
                    "rows_assigned": int(updated or 0),
                    "unowned_rows": int(remaining),
                }

        return summary
    except Exception:
        if backup_path is not None and backup_path.exists():
            shutil.copy2(backup_path, database_path)
        raise
    finally:
        migration_engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Add user ownership to existing Digital Twin records and assign "
            "legacy rows to the specified Phase 2A account."
        )
    )
    parser.add_argument("--owner-email", required=True)
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip the automatic SQLite backup (not recommended).",
    )
    args = parser.parse_args()

    try:
        summary = migrate(
            owner_email=args.owner_email,
            create_backup=not args.no_backup,
        )
    except Exception as exc:
        print(f"Phase 2B migration failed: {exc}", file=sys.stderr)
        return 1

    print("Phase 2B ownership migration completed.")
    print(f"Database: {summary['database']}")
    print(f"Backup: {summary['backup']}")
    print(f"Legacy owner user ID: {summary['owner_user_id']}")

    for table, details in summary["tables"].items():
        print(f"- {table}: {details}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
