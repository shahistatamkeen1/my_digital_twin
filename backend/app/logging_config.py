from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from app.api.request_context import get_request_id
from app.config import settings


_RESERVED_LOG_RECORD_FIELDS = set(logging.makeLogRecord({}).__dict__)


class JsonLogFormatter(logging.Formatter):
    """Compact structured JSON logs for application and API events."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": get_request_id(),
        }

        for key, value in record.__dict__.items():
            if key in _RESERVED_LOG_RECORD_FIELDS or key.startswith("_"):
                continue
            payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str, ensure_ascii=False)


class TextLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        base = (
            "%(asctime)s | %(levelname)s | %(name)s | "
            f"request_id={get_request_id()} | %(message)s"
        )
        self._style._fmt = base
        return super().format(record)


def configure_logging() -> None:
    logger = logging.getLogger("my_digital_twin")
    logger.setLevel(settings.log_level)
    logger.propagate = False

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(settings.log_level)
    handler.setFormatter(
        JsonLogFormatter()
        if settings.log_format == "json"
        else TextLogFormatter()
    )

    logger.handlers.clear()
    logger.addHandler(handler)
