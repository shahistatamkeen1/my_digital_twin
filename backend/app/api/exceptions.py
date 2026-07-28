from __future__ import annotations

from typing import Any, Mapping


class APIError(Exception):
    """Explicit application error that is safe to expose to API clients."""

    def __init__(
        self,
        *,
        status_code: int,
        code: str,
        message: str,
        details: Any | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details
        self.headers = dict(headers or {})
