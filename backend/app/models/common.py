from __future__ import annotations

from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp for ORM defaults."""

    return datetime.now(timezone.utc)
