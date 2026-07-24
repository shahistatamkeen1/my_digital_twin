from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import Engine

from app.config import settings


BACKEND_ROOT = Path(__file__).resolve().parents[2]
ALEMBIC_INI_PATH = BACKEND_ROOT / "alembic.ini"


@dataclass(frozen=True)
class MigrationStatus:
    ready: bool
    current_heads: tuple[str, ...]
    expected_heads: tuple[str, ...]
    alembic_config_found: bool


def build_alembic_config(database_url: str | None = None) -> Config:
    if not ALEMBIC_INI_PATH.exists():
        raise RuntimeError(f"Alembic configuration not found: {ALEMBIC_INI_PATH}")

    config = Config(str(ALEMBIC_INI_PATH))
    url = database_url or settings.database_url
    # Alembic uses ConfigParser interpolation, so literal percent signs in
    # database passwords must be escaped when set programmatically.
    config.set_main_option("sqlalchemy.url", url.replace("%", "%%"))
    return config


def inspect_migration_status(engine: Engine) -> MigrationStatus:
    if not ALEMBIC_INI_PATH.exists():
        return MigrationStatus(
            ready=False,
            current_heads=(),
            expected_heads=(),
            alembic_config_found=False,
        )

    config = build_alembic_config(settings.database_url)
    scripts = ScriptDirectory.from_config(config)
    expected_heads = tuple(sorted(scripts.get_heads()))

    with engine.connect() as connection:
        context = MigrationContext.configure(connection)
        current_heads = tuple(sorted(context.get_current_heads()))

    return MigrationStatus(
        ready=current_heads == expected_heads and bool(expected_heads),
        current_heads=current_heads,
        expected_heads=expected_heads,
        alembic_config_found=True,
    )
