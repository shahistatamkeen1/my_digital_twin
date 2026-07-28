from __future__ import annotations

import os
import sys
from urllib.parse import urlsplit

from app.config import settings


CONTAINER_ENVIRONMENTS = {"container", "production", "staging"}


def _fail(message: str) -> None:
    print(f"Container environment validation failed: {message}", file=sys.stderr)
    raise SystemExit(1)


def _safe_database_summary() -> str:
    try:
        parsed = urlsplit(settings.database_url)
        host = parsed.hostname or "local"
        port = parsed.port or 5432
        database = parsed.path.lstrip("/") or "unknown"
        return f"{parsed.scheme}://{host}:{port}/{database}"
    except Exception:
        return "configured"


def validate() -> None:
    environment = settings.environment.strip().lower()

    if environment in CONTAINER_ENVIRONMENTS and not settings.is_postgresql:
        _fail("container, staging, and production environments require PostgreSQL.")

    if not settings.auth_configured:
        _fail("JWT_SECRET_KEY must be configured with at least 32 characters.")

    if settings.auto_create_tables:
        _fail("AUTO_CREATE_TABLES must remain false; Alembic owns schema changes.")

    if not settings.cors_origins:
        _fail("CORS_ORIGINS must contain at least one allowed frontend origin.")

    if "*" in settings.cors_origins:
        _fail("Wildcard CORS is not allowed when credential cookies are enabled.")

    run_migrations = os.getenv("CONTAINER_RUN_MIGRATIONS", "true").strip().lower()
    if run_migrations not in {"1", "0", "true", "false", "yes", "no", "on", "off"}:
        _fail("CONTAINER_RUN_MIGRATIONS must be a boolean value.")

    print(
        "Container environment validated: "
        f"environment={environment or 'development'}, "
        f"database={_safe_database_summary()}, "
        f"auth_configured={settings.auth_configured}, "
        f"run_migrations={run_migrations}"
    )


if __name__ == "__main__":
    validate()
