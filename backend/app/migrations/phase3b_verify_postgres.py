from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import text

from app.config import settings
from app.services.database_portability_service import (
    APPLICATION_TABLES,
    create_portable_engine,
    load_database_url_from_env_file,
    mask_database_url,
    verify_database,
)


def _target_url(args: argparse.Namespace) -> str:
    if args.target_database_url:
        return args.target_database_url
    return load_database_url_from_env_file(args.target_env_file)


def _verify_restricted_postgres_role(database_url: str) -> dict[str, object]:
    engine = create_portable_engine(database_url)
    try:
        with engine.connect() as connection:
            identity = connection.execute(
                text(
                    "SELECT current_user, current_database(), "
                    "current_setting('TimeZone')"
                )
            ).one()
            privileges = connection.execute(
                text(
                    "SELECT rolsuper, rolcreatedb, rolcreaterole, "
                    "rolreplication, rolcanlogin "
                    "FROM pg_roles WHERE rolname = current_user"
                )
            ).one()
            owner = connection.execute(
                text(
                    "SELECT owner_role.rolname "
                    "FROM pg_database database_record "
                    "JOIN pg_roles owner_role "
                    "ON owner_role.oid = database_record.datdba "
                    "WHERE database_record.datname = current_database()"
                )
            ).scalar_one()

            current_user, current_database, current_timezone = identity
            rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolcanlogin = (
                privileges
            )

            if rolsuper or rolcreatedb or rolcreaterole or rolreplication:
                raise RuntimeError(
                    "Application role has elevated PostgreSQL cluster privileges."
                )
            if not rolcanlogin:
                raise RuntimeError("Application role cannot log in.")
            if owner != current_user:
                raise RuntimeError(
                    f"Database owner is {owner}, expected application role "
                    f"{current_user}."
                )
            if str(current_timezone).upper() not in {"UTC", "ETC/UTC"}:
                raise RuntimeError(
                    f"Application role timezone must be UTC, received {current_timezone}."
                )

            sequence_issues: list[str] = []
            for table in APPLICATION_TABLES:
                sequence_name = connection.execute(
                    text("SELECT pg_get_serial_sequence(:table_name, 'id')"),
                    {"table_name": table},
                ).scalar_one_or_none()
                if not sequence_name:
                    sequence_issues.append(f"{table}: no ID sequence")
                    continue

                maximum_id = connection.execute(
                    text(f'SELECT MAX(id) FROM "{table}"')
                ).scalar_one_or_none()
                schema_name, sequence_short_name = (
                    sequence_name.split(".", 1)
                    if "." in sequence_name
                    else ("public", sequence_name)
                )
                sequence_last_value = connection.execute(
                    text(
                        "SELECT last_value FROM pg_sequences "
                        "WHERE schemaname = :schema_name "
                        "AND sequencename = :sequence_name"
                    ),
                    {
                        "schema_name": schema_name.strip('"'),
                        "sequence_name": sequence_short_name.strip('"'),
                    },
                ).scalar_one_or_none()

                if maximum_id is not None and (
                    sequence_last_value is None
                    or int(sequence_last_value) < int(maximum_id)
                ):
                    sequence_issues.append(
                        f"{table}: sequence {sequence_last_value} < max id {maximum_id}"
                    )

            if sequence_issues:
                raise RuntimeError(
                    "PostgreSQL sequence verification failed: "
                    + "; ".join(sequence_issues)
                )

            return {
                "current_user": current_user,
                "database": current_database,
                "timezone": current_timezone,
                "database_owner": owner,
            }
    finally:
        engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Verify the Phase 3B PostgreSQL schema, role restrictions, data "
            "counts, fingerprints, ownership, foreign keys, and sequences."
        )
    )
    parser.add_argument("--target-database-url")
    parser.add_argument(
        "--target-env-file",
        default=".phase3b-postgres.env",
    )
    parser.add_argument(
        "--source-database-url",
        default=settings.database_url,
    )
    parser.add_argument(
        "--skip-source-comparison",
        action="store_true",
    )
    args = parser.parse_args()

    try:
        target_database_url = _target_url(args)
        target = verify_database(
            target_database_url,
            require_postgresql=True,
            include_fingerprints=True,
        )
        role = _verify_restricted_postgres_role(target_database_url)

        source = None
        if not args.skip_source_comparison:
            source = verify_database(
                args.source_database_url,
                include_fingerprints=True,
            )
            if source.table_counts != target.table_counts:
                raise RuntimeError(
                    "SQLite and PostgreSQL record counts differ."
                )
            if source.table_fingerprints != target.table_fingerprints:
                mismatched = [
                    table
                    for table in APPLICATION_TABLES
                    if source.table_fingerprints.get(table)
                    != target.table_fingerprints.get(table)
                ]
                raise RuntimeError(
                    "SQLite and PostgreSQL fingerprints differ for: "
                    + ", ".join(mismatched)
                )
    except Exception as exc:
        print(f"Phase 3B PostgreSQL verification failed: {exc}", file=sys.stderr)
        return 1

    print("Phase 3B PostgreSQL verification passed.")
    print(f"PostgreSQL: {mask_database_url(target_database_url)}")
    print(f"Revision heads: {target.current_heads}")
    print(f"Verified tables: {len(target.table_counts)}")
    print(f"Verified owned tables: {target.owned_tables_verified}")
    print(f"Application role: {role['current_user']}")
    print(f"Database: {role['database']}")
    print(f"Database owner: {role['database_owner']}")
    print(f"Timezone: {role['timezone']}")
    if source is not None:
        print("SQLite/PostgreSQL record counts and fingerprints match.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
