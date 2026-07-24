from __future__ import annotations

import argparse
import getpass
import re
import sys
from pathlib import Path

from sqlalchemy.engine import URL


IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _validate_identifier(value: str, label: str) -> str:
    if not IDENTIFIER_PATTERN.fullmatch(value):
        raise ValueError(
            f"{label} must start with a letter or underscore and contain only "
            "letters, numbers, and underscores."
        )
    return value


def _prompt_password(label: str, *, confirm: bool = False) -> str:
    password = getpass.getpass(label)
    if not password:
        raise ValueError("Password cannot be empty.")

    if confirm:
        repeated = getpass.getpass("Confirm application password: ")
        if password != repeated:
            raise ValueError("Application passwords do not match.")
        if len(password) < 16:
            raise ValueError("Application password must contain at least 16 characters.")

    return password


def provision(
    *,
    admin_host: str,
    admin_port: int,
    admin_database: str,
    admin_user: str,
    admin_password: str,
    app_user: str,
    app_password: str,
    database_name: str,
    output_env_file: Path,
    recreate_database: bool,
) -> dict[str, str]:
    try:
        import psycopg2
        from psycopg2 import sql
    except ImportError as exc:
        raise RuntimeError(
            "psycopg2 is not installed. Run: pip install -r requirements.txt"
        ) from exc

    _validate_identifier(app_user, "Application role")
    _validate_identifier(database_name, "Database name")

    admin_connection = psycopg2.connect(
        host=admin_host,
        port=admin_port,
        dbname=admin_database,
        user=admin_user,
        password=admin_password,
        connect_timeout=10,
    )
    admin_connection.autocommit = True

    try:
        with admin_connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (app_user,))
            role_exists = cursor.fetchone() is not None

            role_identifier = sql.Identifier(app_user)
            if role_exists:
                cursor.execute(
                    sql.SQL(
                        "ALTER ROLE {} WITH LOGIN PASSWORD %s NOSUPERUSER "
                        "NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT "
                        "CONNECTION LIMIT 20"
                    ).format(role_identifier),
                    (app_password,),
                )
            else:
                cursor.execute(
                    sql.SQL(
                        "CREATE ROLE {} WITH LOGIN PASSWORD %s NOSUPERUSER "
                        "NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT "
                        "CONNECTION LIMIT 20"
                    ).format(role_identifier),
                    (app_password,),
                )

            cursor.execute(
                sql.SQL("ALTER ROLE {} SET timezone TO 'UTC'").format(
                    role_identifier
                )
            )

            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (database_name,),
            )
            database_exists = cursor.fetchone() is not None

            database_identifier = sql.Identifier(database_name)
            if recreate_database and database_exists:
                cursor.execute(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = %s AND pid <> pg_backend_pid()",
                    (database_name,),
                )
                cursor.execute(
                    sql.SQL("DROP DATABASE {}").format(database_identifier)
                )
                database_exists = False

            if not database_exists:
                cursor.execute(
                    sql.SQL(
                        "CREATE DATABASE {} OWNER {} ENCODING 'UTF8' "
                        "TEMPLATE template0"
                    ).format(database_identifier, role_identifier)
                )
            else:
                cursor.execute(
                    sql.SQL("ALTER DATABASE {} OWNER TO {}").format(
                        database_identifier,
                        role_identifier,
                    )
                )

            cursor.execute(
                sql.SQL("GRANT CONNECT, TEMPORARY ON DATABASE {} TO {}").format(
                    database_identifier,
                    role_identifier,
                )
            )
    finally:
        admin_connection.close()

    database_connection = psycopg2.connect(
        host=admin_host,
        port=admin_port,
        dbname=database_name,
        user=admin_user,
        password=admin_password,
        connect_timeout=10,
    )
    database_connection.autocommit = True

    try:
        with database_connection.cursor() as cursor:
            role_identifier = sql.Identifier(app_user)
            cursor.execute(
                sql.SQL("ALTER SCHEMA public OWNER TO {}").format(role_identifier)
            )
            cursor.execute("REVOKE CREATE ON SCHEMA public FROM PUBLIC")
            cursor.execute(
                sql.SQL("GRANT USAGE, CREATE ON SCHEMA public TO {}").format(
                    role_identifier
                )
            )
    finally:
        database_connection.close()

    app_connection = psycopg2.connect(
        host=admin_host,
        port=admin_port,
        dbname=database_name,
        user=app_user,
        password=app_password,
        connect_timeout=10,
    )
    try:
        with app_connection.cursor() as cursor:
            cursor.execute(
                "SELECT current_user, current_database(), current_setting('TimeZone')"
            )
            current_user, current_database, current_timezone = cursor.fetchone()
    finally:
        app_connection.close()

    url = URL.create(
        drivername="postgresql+psycopg2",
        username=app_user,
        password=app_password,
        host=admin_host,
        port=admin_port,
        database=database_name,
    ).render_as_string(hide_password=False)

    output_env_file.parent.mkdir(parents=True, exist_ok=True)
    output_env_file.write_text(
        "# Private Phase 3B PostgreSQL connection file. Do not commit.\n"
        f"POSTGRES_DATABASE_URL={url}\n"
        f"DATABASE_URL={url}\n",
        encoding="utf-8",
    )
    try:
        output_env_file.chmod(0o600)
    except OSError:
        pass

    return {
        "app_user": current_user,
        "database": current_database,
        "timezone": current_timezone,
        "env_file": str(output_env_file),
        "masked_url": URL.create(
            drivername="postgresql+psycopg2",
            username=app_user,
            password=app_password,
            host=admin_host,
            port=admin_port,
            database=database_name,
        ).render_as_string(hide_password=True),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Create the restricted My Digital Twin PostgreSQL role/database and "
            "write a private SQLAlchemy connection file."
        )
    )
    parser.add_argument("--admin-host", default="127.0.0.1")
    parser.add_argument("--admin-port", type=int, default=5432)
    parser.add_argument("--admin-database", default="postgres")
    parser.add_argument("--admin-user", default="postgres")
    parser.add_argument("--app-user", default="mdt_app")
    parser.add_argument("--database", default="my_digital_twin")
    parser.add_argument(
        "--output-env-file",
        default=".phase3b-postgres.env",
    )
    parser.add_argument(
        "--recreate-database",
        action="store_true",
        help="Drop and recreate the target database. This deletes target data.",
    )
    args = parser.parse_args()

    try:
        admin_password = _prompt_password("PostgreSQL postgres password: ")
        app_password = _prompt_password(
            f"New password for {args.app_user}: ",
            confirm=True,
        )
        result = provision(
            admin_host=args.admin_host,
            admin_port=args.admin_port,
            admin_database=args.admin_database,
            admin_user=args.admin_user,
            admin_password=admin_password,
            app_user=args.app_user,
            app_password=app_password,
            database_name=args.database,
            output_env_file=Path(args.output_env_file).expanduser().resolve(),
            recreate_database=args.recreate_database,
        )
    except Exception as exc:
        print(f"Phase 3B PostgreSQL provisioning failed: {exc}", file=sys.stderr)
        return 1

    print("Phase 3B PostgreSQL provisioning completed.")
    print(f"Application role: {result['app_user']}")
    print(f"Database: {result['database']}")
    print(f"Role timezone: {result['timezone']}")
    print(f"Private connection file: {result['env_file']}")
    print(f"Connection: {result['masked_url']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
