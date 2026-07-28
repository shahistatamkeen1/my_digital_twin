from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Tuple

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"
load_dotenv(ENV_FILE, override=False)


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _get_csv(name: str, default: str) -> Tuple[str, ...]:
    value = os.getenv(name, default)
    return tuple(item.strip() for item in value.split(",") if item.strip())


def _get_optional(name: str) -> str | None:
    value = os.getenv(name)
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "My Digital Twin API")
    app_version: str = os.getenv("APP_VERSION", "0.4.2")
    environment: str = os.getenv("ENVIRONMENT", "development")

    log_level: str = os.getenv("LOG_LEVEL", "INFO").strip().upper()
    log_format: str = os.getenv("LOG_FORMAT", "json").strip().lower()
    request_id_header: str = os.getenv(
        "REQUEST_ID_HEADER",
        "X-Request-ID",
    ).strip() or "X-Request-ID"
    expose_internal_error_details: bool = _get_bool(
        "EXPOSE_INTERNAL_ERROR_DETAILS",
        False,
    )

    # Phase 4B API versioning. v1 is the canonical contract while legacy
    # /api routes remain temporarily available with deprecation headers.
    api_current_version: str = os.getenv(
        "API_CURRENT_VERSION",
        "v1",
    ).strip() or "v1"
    api_v1_prefix: str = os.getenv(
        "API_V1_PREFIX",
        "/api/v1",
    ).strip() or "/api/v1"
    api_version_header: str = os.getenv(
        "API_VERSION_HEADER",
        "X-API-Version",
    ).strip() or "X-API-Version"
    enable_legacy_api_routes: bool = _get_bool(
        "ENABLE_LEGACY_API_ROUTES",
        True,
    )
    legacy_api_sunset: str = os.getenv(
        "LEGACY_API_SUNSET",
        "Fri, 31 Dec 2027 23:59:59 GMT",
    ).strip() or "Fri, 31 Dec 2027 23:59:59 GMT"

    # Phase 4C collection-query defaults. Existing clients still receive
    # legacy array bodies unless page or page_size is requested explicitly.
    api_default_page_size: int = max(
        1,
        _get_int("API_DEFAULT_PAGE_SIZE", 20),
    )
    api_max_page_size: int = max(
        api_default_page_size,
        _get_int("API_MAX_PAGE_SIZE", 100),
    )

    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./my_digital_twin.db",
    )
    database_pool_size: int = _get_int("DATABASE_POOL_SIZE", 5)
    database_max_overflow: int = _get_int("DATABASE_MAX_OVERFLOW", 10)
    database_pool_timeout_seconds: int = _get_int(
        "DATABASE_POOL_TIMEOUT_SECONDS",
        30,
    )
    database_pool_recycle_seconds: int = _get_int(
        "DATABASE_POOL_RECYCLE_SECONDS",
        1800,
    )

    # Retained only so an old local .env does not become invalid. Phase 3 uses
    # Alembic exclusively; main.py no longer calls Base.metadata.create_all().
    auto_create_tables: bool = _get_bool("AUTO_CREATE_TABLES", False)

    cors_origins: Tuple[str, ...] = _get_csv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )

    openai_api_key: str | None = _get_optional("OPENAI_API_KEY")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    openai_timeout_seconds: int = _get_int("OPENAI_TIMEOUT_SECONDS", 60)

    jwt_secret_key: str | None = _get_optional("JWT_SECRET_KEY")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = _get_int(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        30,
    )
    refresh_token_expire_days: int = _get_int(
        "REFRESH_TOKEN_EXPIRE_DAYS",
        7,
    )

    access_cookie_name: str = os.getenv(
        "ACCESS_COOKIE_NAME",
        "mdt_access_token",
    )
    refresh_cookie_name: str = os.getenv(
        "REFRESH_COOKIE_NAME",
        "mdt_refresh_token",
    )
    refresh_cookie_path: str = os.getenv(
        "REFRESH_COOKIE_PATH",
        "/api",
    ).strip() or "/api"
    auth_cookie_secure: bool = _get_bool("AUTH_COOKIE_SECURE", False)
    auth_cookie_samesite: str = os.getenv(
        "AUTH_COOKIE_SAMESITE",
        "lax",
    ).lower()
    auth_cookie_domain: str | None = _get_optional("AUTH_COOKIE_DOMAIN")

    @property
    def normalized_api_v1_prefix(self) -> str:
        prefix = f"/{self.api_v1_prefix.strip('/')}"
        return prefix if prefix != "/" else "/api/v1"

    @property
    def auth_configured(self) -> bool:
        return bool(self.jwt_secret_key and len(self.jwt_secret_key) >= 32)

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def is_postgresql(self) -> bool:
        return self.database_url.startswith("postgresql")


settings = Settings()
