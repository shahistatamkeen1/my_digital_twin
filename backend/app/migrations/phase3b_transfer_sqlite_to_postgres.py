from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import MetaData, inspect, select, text
from sqlalchemy.engine import Engine, make_url

from app.config import settings
from app.services.database_portability_service import (
    APPLICATION_TABLES,
    TRANSFER_ORDER,
    backup_sqlite_database,
    convert_row_for_target,
    create_portable_engine,
    load_database_url_from_env_file,
    mask_database_url,
    table_counts,
    table_fingerprints,
    upgrade_database_to_head,
    verify_database,
)


def _target_url_from_args(args: argparse.Namespace) -> str:
    if args.target_database_url:
        return args.target_database_url
    return load_database_url_from_env_file(args.target_env_file)


def _assert_source_and_target_dialects(
    source_engine: Engine,
    target_engine: Engine,
    *,
    allow_non_sqlite_source: bool,
    allow_non_postgres_target: bool,
) -> None:
    if not allow_non_sqlite_source and source_engine.dialect.name != "sqlite":
        raise RuntimeError(
            f"Phase 3B source must be SQLite, received: {source_engine.dialect.name}"
        )
    if not allow_non_postgres_target and target_engine.dialect.name != "postgresql":
        raise RuntimeError(
            "Phase 3B target must be PostgreSQL, received: "
            f"{target_engine.dialect.name}"
        )


def _clear_target(connection, target_engine: Engine) -> None:
    if target_engine.dialect.name == "postgresql":
        quoted = ", ".join(f'"{table}"' for table in TRANSFER_ORDER)
        connection.execute(
            text(f"TRUNCATE TABLE {quoted} RESTART IDENTITY CASCADE")
        )
        return

    for table in reversed(TRANSFER_ORDER):
        connection.execute(text(f'DELETE FROM "{table}"'))


def _reset_postgres_sequences(connection, target_engine: Engine) -> None:
    if target_engine.dialect.name != "postgresql":
        return

    for table in TRANSFER_ORDER:
        sequence_name = connection.execute(
            text("SELECT pg_get_serial_sequence(:table_name, 'id')"),
            {"table_name": table},
        ).scalar_one_or_none()
        if not sequence_name:
            continue

        maximum_id = connection.execute(
            text(f'SELECT MAX(id) FROM "{table}"')
        ).scalar_one_or_none()

        if maximum_id is None:
            connection.execute(
                text("SELECT setval(CAST(:sequence AS regclass), 1, false)"),
                {"sequence": sequence_name},
            )
        else:
            connection.execute(
                text("SELECT setval(CAST(:sequence AS regclass), :value, true)"),
                {"sequence": sequence_name, "value": int(maximum_id)},
            )


def _copy_table(
    *,
    source_connection,
    target_connection,
    source_table,
    target_table,
    batch_size: int,
) -> int:
    source_columns = set(source_table.columns.keys())
    target_columns = set(target_table.columns.keys())
    if source_columns != target_columns:
        raise RuntimeError(
            f"Column mismatch for {source_table.name}. "
            f"Source-only: {sorted(source_columns - target_columns)}; "
            f"target-only: {sorted(target_columns - source_columns)}"
        )

    primary_keys = list(source_table.primary_key.columns)
    statement = select(source_table)
    if primary_keys:
        statement = statement.order_by(*primary_keys)

    result = source_connection.execute(statement).mappings()
    copied = 0

    while True:
        batch = result.fetchmany(batch_size)
        if not batch:
            break

        payload: list[dict[str, Any]] = [
            convert_row_for_target(dict(row), target_table)
            for row in batch
        ]
        target_connection.execute(target_table.insert(), payload)
        copied += len(payload)

    return copied


def transfer(
    *,
    source_database_url: str,
    target_database_url: str,
    truncate_target: bool,
    batch_size: int,
    create_source_backup: bool,
    allow_non_sqlite_source: bool = False,
    allow_non_postgres_target: bool = False,
) -> dict[str, Any]:
    source_engine = create_portable_engine(source_database_url)
    target_engine = create_portable_engine(target_database_url)

    try:
        _assert_source_and_target_dialects(
            source_engine,
            target_engine,
            allow_non_sqlite_source=allow_non_sqlite_source,
            allow_non_postgres_target=allow_non_postgres_target,
        )

        source_verification = verify_database(
            source_database_url,
            include_fingerprints=True,
        )
        source_backup = (
            backup_sqlite_database(source_database_url, phase="phase3b")
            if create_source_backup
            else None
        )

        upgrade_database_to_head(target_database_url)
        target_verification_before = verify_database(
            target_database_url,
            require_postgresql=not allow_non_postgres_target,
            include_fingerprints=False,
        )

        existing_target_counts = target_verification_before.table_counts
        target_has_data = any(existing_target_counts.values())
        if target_has_data and not truncate_target:
            populated = {
                table: count
                for table, count in existing_target_counts.items()
                if count
            }
            raise RuntimeError(
                "Target PostgreSQL database already contains application data. "
                "Rerun with --truncate-target only when you intend to replace it. "
                f"Populated tables: {populated}"
            )

        source_metadata = MetaData()
        target_metadata = MetaData()
        source_metadata.reflect(bind=source_engine, only=list(APPLICATION_TABLES))
        target_metadata.reflect(bind=target_engine, only=list(APPLICATION_TABLES))

        copied_counts: dict[str, int] = {}
        with source_engine.connect() as source_connection:
            with target_engine.begin() as target_connection:
                if truncate_target:
                    _clear_target(target_connection, target_engine)

                for table_name in TRANSFER_ORDER:
                    copied_counts[table_name] = _copy_table(
                        source_connection=source_connection,
                        target_connection=target_connection,
                        source_table=source_metadata.tables[table_name],
                        target_table=target_metadata.tables[table_name],
                        batch_size=batch_size,
                    )

                _reset_postgres_sequences(target_connection, target_engine)

        target_verification_after = verify_database(
            target_database_url,
            require_postgresql=not allow_non_postgres_target,
            include_fingerprints=True,
        )

        if source_verification.table_counts != target_verification_after.table_counts:
            raise RuntimeError(
                "Source and target table counts differ after transfer. "
                f"Source: {source_verification.table_counts}; "
                f"target: {target_verification_after.table_counts}"
            )

        if (
            source_verification.table_fingerprints
            != target_verification_after.table_fingerprints
        ):
            mismatched = [
                table
                for table in APPLICATION_TABLES
                if source_verification.table_fingerprints.get(table)
                != target_verification_after.table_fingerprints.get(table)
            ]
            raise RuntimeError(
                "Source and target content fingerprints differ for: "
                + ", ".join(mismatched)
            )

        return {
            "source": mask_database_url(source_database_url),
            "target": mask_database_url(target_database_url),
            "source_backup": str(source_backup) if source_backup else None,
            "copied_counts": copied_counts,
            "source_heads": source_verification.current_heads,
            "target_heads": target_verification_after.current_heads,
        }
    finally:
        source_engine.dispose()
        target_engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Create the PostgreSQL schema with Alembic and transfer all "
            "Phase 3A SQLite records while preserving IDs and user ownership."
        )
    )
    parser.add_argument(
        "--source-database-url",
        default=settings.database_url,
        help="SQLite source URL. Keep backend/.env on SQLite during transfer.",
    )
    parser.add_argument("--target-database-url")
    parser.add_argument(
        "--target-env-file",
        default=".phase3b-postgres.env",
    )
    parser.add_argument("--batch-size", type=int, default=500)
    parser.add_argument("--truncate-target", action="store_true")
    parser.add_argument("--skip-source-backup", action="store_true")
    parser.add_argument(
        "--allow-non-sqlite-source",
        action="store_true",
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--allow-non-postgres-target",
        action="store_true",
        help=argparse.SUPPRESS,
    )
    args = parser.parse_args()

    if args.batch_size < 1:
        print("Batch size must be at least 1.", file=sys.stderr)
        return 1

    try:
        target_database_url = _target_url_from_args(args)
        summary = transfer(
            source_database_url=args.source_database_url,
            target_database_url=target_database_url,
            truncate_target=args.truncate_target,
            batch_size=args.batch_size,
            create_source_backup=not args.skip_source_backup,
            allow_non_sqlite_source=args.allow_non_sqlite_source,
            allow_non_postgres_target=args.allow_non_postgres_target,
        )
    except Exception as exc:
        print(f"Phase 3B data transfer failed: {exc}", file=sys.stderr)
        return 1

    print("Phase 3B SQLite-to-PostgreSQL transfer completed.")
    print(f"Source: {summary['source']}")
    print(f"Target: {summary['target']}")
    print(f"SQLite backup: {summary['source_backup']}")
    print(f"Source revisions: {summary['source_heads']}")
    print(f"Target revisions: {summary['target_heads']}")
    print("Transferred records:")
    for table, count in summary["copied_counts"].items():
        print(f"- {table}: {count}")
    print("Record counts and content fingerprints match.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
