from __future__ import annotations

import os
import sys
import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings


def _positive_float(name: str, default: float) -> float:
    raw = os.getenv(name, str(default)).strip()
    try:
        value = float(raw)
    except ValueError:
        raise SystemExit(f"{name} must be numeric.") from None
    if value <= 0:
        raise SystemExit(f"{name} must be greater than zero.")
    return value


def wait_for_database() -> None:
    timeout_seconds = _positive_float(
        "CONTAINER_DB_WAIT_TIMEOUT_SECONDS",
        60,
    )
    interval_seconds = _positive_float(
        "CONTAINER_DB_WAIT_INTERVAL_SECONDS",
        2,
    )
    deadline = time.monotonic() + timeout_seconds
    attempt = 0
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=1,
        max_overflow=0,
    )

    try:
        while True:
            attempt += 1
            try:
                with engine.connect() as connection:
                    connection.execute(text("SELECT 1"))
                print(f"Database is available after {attempt} attempt(s).")
                return
            except SQLAlchemyError as exc:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    print(
                        "Database did not become available before the "
                        f"{timeout_seconds:g}-second timeout. "
                        f"Last error type: {type(exc).__name__}",
                        file=sys.stderr,
                    )
                    raise SystemExit(1) from None

                print(
                    f"Database unavailable; retrying in "
                    f"{min(interval_seconds, remaining):g} second(s)."
                )
                time.sleep(min(interval_seconds, remaining))
    finally:
        engine.dispose()


if __name__ == "__main__":
    wait_for_database()
