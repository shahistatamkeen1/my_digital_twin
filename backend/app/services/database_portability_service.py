from __future__ import annotations

import hashlib
import json
import shutil
import sqlite3
from dataclasses import dataclass
from datetime import date, datetime, time, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Iterable

from alembic import command
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from dotenv import dotenv_values
from sqlalchemy import MetaData, Table, create_engine, inspect, select, text
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.sql.sqltypes import Boolean, DateTime

from app.services.migration_status_service import build_alembic_config
from app.services.ownership_schema_service import OWNED_TABLES


TRANSFER_ORDER: tuple[str, ...] = (
    "users",
    "agent_memory",
    "agent_plans",
    "agent_profiles",
    "agent_reflections",
    "applications",
    "career_memory",
    "career_roadmap",
    "finance_memory",
    "finance_transactions",
    "health_habits",
    "health_memory",
    "learning_memory",
    "learning_progress",
    "personal_memory",
    "savings_goals",
    "twin_progress_snapshots",
)

APPLICATION_TABLES = TRANSFER_ORDER


@dataclass(frozen=True)
class DatabaseVerification:
    database_url_masked: str
    dialect: str
    current_heads: tuple[str, ...]
    expected_heads: tuple[str, ...]
    table_counts: dict[str, int]
    table_fingerprints: dict[str, str]
    owned_tables_verified: int


def create_portable_engine(database_url: str) -> Engine:
    url = make_url(database_url)
    kwargs: dict[str, Any] = {"pool_pre_ping": True}

    if url.get_backend_name() == "sqlite":
        kwargs["connect_args"] = {"check_same_thread": False}

    return create_engine(database_url, **kwargs)


def mask_database_url(database_url: str) -> str:
    return make_url(database_url).render_as_string(hide_password=True)


def load_database_url_from_env_file(
    env_file: str | Path,
    keys: Iterable[str] = ("POSTGRES_DATABASE_URL", "DATABASE_URL"),
) -> str:
    path = Path(env_file).expanduser().resolve()
    if not path.exists():
        raise FileNotFoundError(f"Database environment file not found: {path}")

    values = dotenv_values(path)
    for key in keys:
        value = values.get(key)
        if value and str(value).strip():
            return str(value).strip()

    raise RuntimeError(
        f"None of {tuple(keys)} were found in database environment file: {path}"
    )


def expected_alembic_heads(database_url: str) -> tuple[str, ...]:
    config = build_alembic_config(database_url)
    scripts = ScriptDirectory.from_config(config)
    return tuple(sorted(scripts.get_heads()))


def current_alembic_heads(engine: Engine) -> tuple[str, ...]:
    with engine.connect() as connection:
        context = MigrationContext.configure(connection)
        return tuple(sorted(context.get_current_heads()))


def upgrade_database_to_head(database_url: str) -> None:
    config = build_alembic_config(database_url)
    command.upgrade(config, "head")


def resolve_sqlite_path(database_url: str) -> Path | None:
    url = make_url(database_url)
    if url.get_backend_name() != "sqlite":
        return None
    if not url.database or url.database == ":memory:":
        return None

    path = Path(url.database)
    if not path.is_absolute():
        path = (Path.cwd() / path).resolve()
    return path


def backup_sqlite_database(database_url: str, phase: str = "phase3b") -> Path | None:
    database_path = resolve_sqlite_path(database_url)
    if database_path is None or not database_path.exists():
        return None

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = database_path.with_name(
        f"{database_path.stem}.{phase}-backup-{timestamp}{database_path.suffix}"
    )

    source = sqlite3.connect(database_path)
    destination = sqlite3.connect(backup_path)
    try:
        source.backup(destination)
    finally:
        destination.close()
        source.close()

    return backup_path


def restore_sqlite_backup(backup_path: Path, database_url: str) -> None:
    destination = resolve_sqlite_path(database_url)
    if destination is None:
        raise RuntimeError("Cannot restore backup: destination is not SQLite.")
    shutil.copy2(backup_path, destination)


def _canonical_value(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, bool)):
        return value

    if isinstance(value, float):
        return format(value, ".17g")

    if isinstance(value, Decimal):
        return format(value, "f")

    if isinstance(value, datetime):
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return value.isoformat(timespec="microseconds")

    if isinstance(value, date):
        return value.isoformat()

    if isinstance(value, time):
        return value.isoformat(timespec="microseconds")

    if isinstance(value, bytes):
        return value.hex()

    if isinstance(value, (list, tuple)):
        return [_canonical_value(item) for item in value]

    if isinstance(value, dict):
        return {
            str(key): _canonical_value(item)
            for key, item in sorted(value.items(), key=lambda pair: str(pair[0]))
        }

    return str(value)


def table_counts(engine: Engine) -> dict[str, int]:
    inspector = inspect(engine)
    available = set(inspector.get_table_names())
    missing = [table for table in APPLICATION_TABLES if table not in available]
    if missing:
        raise RuntimeError(f"Missing application tables: {', '.join(missing)}")

    counts: dict[str, int] = {}
    with engine.connect() as connection:
        for table in APPLICATION_TABLES:
            counts[table] = int(
                connection.execute(
                    text(f'SELECT COUNT(*) FROM "{table}"')
                ).scalar_one()
            )
    return counts


def table_fingerprints(engine: Engine) -> dict[str, str]:
    metadata = MetaData()
    metadata.reflect(bind=engine, only=list(APPLICATION_TABLES))

    fingerprints: dict[str, str] = {}
    with engine.connect() as connection:
        for table_name in APPLICATION_TABLES:
            table = metadata.tables[table_name]
            primary_keys = list(table.primary_key.columns)
            statement = select(table)
            if primary_keys:
                statement = statement.order_by(*primary_keys)

            digest = hashlib.sha256()
            for row in connection.execute(statement).mappings():
                canonical = {
                    key: _canonical_value(row[key])
                    for key in sorted(row.keys())
                }
                digest.update(
                    json.dumps(
                        canonical,
                        sort_keys=True,
                        separators=(",", ":"),
                        ensure_ascii=False,
                    ).encode("utf-8")
                )
                digest.update(b"\n")

            fingerprints[table_name] = digest.hexdigest()

    return fingerprints


def _verify_owned_table(engine: Engine, table_name: str) -> None:
    inspector = inspect(engine)
    columns = {column["name"]: column for column in inspector.get_columns(table_name)}

    user_column = columns.get("user_id")
    if user_column is None:
        raise RuntimeError(f"{table_name}.user_id is missing.")
    if user_column.get("nullable", True):
        raise RuntimeError(f"{table_name}.user_id must be NOT NULL.")

    foreign_keys = inspector.get_foreign_keys(table_name)
    matching = [
        foreign_key
        for foreign_key in foreign_keys
        if foreign_key.get("constrained_columns") == ["user_id"]
        and foreign_key.get("referred_table") == "users"
        and foreign_key.get("referred_columns") == ["id"]
    ]
    if not matching:
        raise RuntimeError(
            f"{table_name}.user_id does not reference users.id."
        )

    foreign_key_options = matching[0].get("options") or {}
    on_delete = str(foreign_key_options.get("ondelete", "")).upper()
    if on_delete != "CASCADE":
        raise RuntimeError(
            f"{table_name}.user_id foreign key must use ON DELETE CASCADE."
        )

    with engine.connect() as connection:
        unowned = int(
            connection.execute(
                text(f'SELECT COUNT(*) FROM "{table_name}" WHERE user_id IS NULL')
            ).scalar_one()
        )
        if unowned:
            raise RuntimeError(f"{table_name} contains {unowned} unowned rows.")

        orphaned = int(
            connection.execute(
                text(
                    f'SELECT COUNT(*) FROM "{table_name}" child '
                    'LEFT JOIN "users" parent ON parent.id = child.user_id '
                    'WHERE parent.id IS NULL'
                )
            ).scalar_one()
        )
        if orphaned:
            raise RuntimeError(f"{table_name} contains {orphaned} orphaned rows.")


def verify_database(
    database_url: str,
    *,
    require_postgresql: bool = False,
    include_fingerprints: bool = True,
) -> DatabaseVerification:
    engine = create_portable_engine(database_url)
    try:
        dialect = engine.dialect.name
        if require_postgresql and dialect != "postgresql":
            raise RuntimeError(
                f"Expected a PostgreSQL database, received dialect: {dialect}"
            )

        inspector = inspect(engine)
        available = set(inspector.get_table_names())
        missing = sorted(set(APPLICATION_TABLES) - available)
        if missing:
            raise RuntimeError(f"Missing application tables: {', '.join(missing)}")

        expected_heads = expected_alembic_heads(database_url)
        current_heads = current_alembic_heads(engine)
        if current_heads != expected_heads:
            raise RuntimeError(
                f"Database revisions {current_heads} do not match expected heads "
                f"{expected_heads}."
            )

        for table_name in OWNED_TABLES:
            _verify_owned_table(engine, table_name)

        counts = table_counts(engine)
        fingerprints = table_fingerprints(engine) if include_fingerprints else {}

        return DatabaseVerification(
            database_url_masked=mask_database_url(database_url),
            dialect=dialect,
            current_heads=current_heads,
            expected_heads=expected_heads,
            table_counts=counts,
            table_fingerprints=fingerprints,
            owned_tables_verified=len(OWNED_TABLES),
        )
    finally:
        engine.dispose()


def convert_row_for_target(row: dict[str, Any], target_table: Table) -> dict[str, Any]:
    converted: dict[str, Any] = {}

    for column in target_table.columns:
        value = row.get(column.name)

        if value is not None and isinstance(column.type, DateTime):
            if isinstance(value, str):
                normalized = value.replace("Z", "+00:00")
                value = datetime.fromisoformat(normalized)
            if column.type.timezone and isinstance(value, datetime):
                if value.tzinfo is None:
                    value = value.replace(tzinfo=timezone.utc)
                else:
                    value = value.astimezone(timezone.utc)

        if value is not None and isinstance(column.type, Boolean):
            value = bool(value)

        converted[column.name] = value

    return converted
