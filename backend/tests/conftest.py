from __future__ import annotations

import os
from pathlib import Path
from typing import Iterator

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_ARTIFACT_DIR = BACKEND_DIR / ".test_artifacts"
TEST_DATABASE_FILE = TEST_ARTIFACT_DIR / "phase5_test.db"

# These values are established before application modules are imported during
# test collection. dotenv uses override=False, so the test process cannot
# accidentally inherit the developer's PostgreSQL URL or production secrets.
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./.test_artifacts/phase5_test.db"
os.environ["AUTO_CREATE_TABLES"] = "false"
os.environ["JWT_SECRET_KEY"] = (
    "phase5-test-secret-0123456789abcdef-0123456789abcdef"
)
os.environ["OPENAI_API_KEY"] = ""
os.environ["AUTH_COOKIE_SECURE"] = "false"
os.environ["ENABLE_LEGACY_API_ROUTES"] = "true"
os.environ["API_DOCS_ENABLED"] = "true"
os.environ["EXPOSE_INTERNAL_ERROR_DETAILS"] = "false"
os.environ["LOG_FORMAT"] = "text"
os.environ["LOG_LEVEL"] = "WARNING"


@pytest.fixture(scope="session", autouse=True)
def test_database_schema() -> Iterator[None]:
    """Create a disposable schema and guarantee that tests never use live data."""

    TEST_ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    # Importing main registers every model before metadata.create_all().
    from main import app as _app  # noqa: F401
    from app.config import settings
    from app.database import Base, engine

    if settings.environment != "test":
        raise RuntimeError("Pytest refused to run outside ENVIRONMENT=test.")
    if engine.dialect.name != "sqlite":
        raise RuntimeError(
            "Phase 5A tests must use the disposable SQLite database. "
            f"Received dialect: {engine.dialect.name}."
        )

    engine.dispose()
    if TEST_DATABASE_FILE.exists():
        TEST_DATABASE_FILE.unlink()

    Base.metadata.create_all(bind=engine)

    try:
        yield
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        for suffix in ("", "-journal", "-shm", "-wal"):
            path = Path(f"{TEST_DATABASE_FILE}{suffix}")
            if path.exists():
                path.unlink()


@pytest.fixture
def clean_database(test_database_schema: None) -> Iterator[None]:
    """Delete rows around an integration test while preserving the schema."""

    from app.database import Base, engine

    def clean() -> None:
        with engine.begin() as connection:
            for table in reversed(Base.metadata.sorted_tables):
                connection.execute(table.delete())

    clean()
    try:
        yield
    finally:
        clean()


@pytest.fixture
def client(clean_database: None) -> Iterator[TestClient]:
    from main import app

    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
