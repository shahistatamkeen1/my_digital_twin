from __future__ import annotations

import logging
import re
from time import perf_counter
from typing import Awaitable, Callable

from fastapi import Request, Response, status

from app.api.request_context import (
    create_request_id,
    reset_request_id,
    set_request_id,
)
from app.api.responses import build_error_response
from app.config import settings


logger = logging.getLogger("my_digital_twin.requests")

_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]{1,128}$")


def _resolve_request_id(request: Request) -> str:
    incoming = request.headers.get(settings.request_id_header, "").strip()
    if incoming and _REQUEST_ID_PATTERN.fullmatch(incoming):
        return incoming
    return create_request_id()


async def request_context_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Correlate, time, and safely log every HTTP request."""

    request_id = _resolve_request_id(request)
    request.state.request_id = request_id
    token = set_request_id(request_id)
    started = perf_counter()
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    try:
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            logger.exception(
                "Unhandled request failure",
                exc_info=exc,
                extra={
                    "event": "unhandled_request_error",
                    "http_method": request.method,
                    "http_path": request.url.path,
                },
            )
            details = (
                {
                    "exception_type": type(exc).__name__,
                    "reason": str(exc),
                }
                if settings.expose_internal_error_details
                else None
            )
            response = build_error_response(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected server error occurred.",
                details=details,
            )

        response.headers[settings.request_id_header] = request_id
        return response
    finally:
        duration_ms = round((perf_counter() - started) * 1000, 2)
        logger.info(
            "HTTP request completed",
            extra={
                "event": "http_request",
                "http_method": request.method,
                "http_path": request.url.path,
                "http_status": status_code,
                "duration_ms": duration_ms,
                "client_ip": (
                    request.client.host if request.client is not None else None
                ),
            },
        )
        reset_request_id(token)
