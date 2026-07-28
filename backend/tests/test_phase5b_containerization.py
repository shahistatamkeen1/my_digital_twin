from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent


def test_container_files_define_non_root_health_checked_services() -> None:
    backend_dockerfile = (BACKEND_DIR / "Dockerfile").read_text(encoding="utf-8")
    frontend_dockerfile = (
        PROJECT_ROOT / "frontend" / "Dockerfile"
    ).read_text(encoding="utf-8")
    compose = (PROJECT_ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    next_config = (
        PROJECT_ROOT / "frontend" / "next.config.ts"
    ).read_text(encoding="utf-8")

    assert "USER app" in backend_dockerfile
    assert "USER nextjs" in frontend_dockerfile
    assert "HEALTHCHECK" in backend_dockerfile
    assert "HEALTHCHECK" in frontend_dockerfile
    assert "alembic upgrade head" in (
        BACKEND_DIR / "docker" / "entrypoint.sh"
    ).read_text(encoding="utf-8")
    assert "internal: true" in compose
    assert "condition: service_healthy" in compose
    assert 'output: "standalone"' in next_config


def test_container_environment_validation_accepts_safe_configuration() -> None:
    environment = os.environ.copy()
    environment.update(
        {
            "ENVIRONMENT": "container",
            "DATABASE_URL": (
                "postgresql+psycopg2://mdt_app:safe@database:5432/"
                "my_digital_twin"
            ),
            "JWT_SECRET_KEY": "a" * 64,
            "AUTO_CREATE_TABLES": "false",
            "CORS_ORIGINS": "http://localhost:3000",
            "CONTAINER_RUN_MIGRATIONS": "true",
        }
    )

    result = subprocess.run(
        [sys.executable, "-m", "app.container.validate_environment"],
        cwd=BACKEND_DIR,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert "auth_configured=True" in result.stdout
    assert "safe@" not in result.stdout


def test_container_environment_validation_rejects_sqlite_in_container() -> None:
    environment = os.environ.copy()
    environment.update(
        {
            "ENVIRONMENT": "container",
            "DATABASE_URL": "sqlite:///./unsafe.db",
            "JWT_SECRET_KEY": "a" * 64,
            "AUTO_CREATE_TABLES": "false",
            "CORS_ORIGINS": "http://localhost:3000",
        }
    )

    result = subprocess.run(
        [sys.executable, "-m", "app.container.validate_environment"],
        cwd=BACKEND_DIR,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "require PostgreSQL" in result.stderr
