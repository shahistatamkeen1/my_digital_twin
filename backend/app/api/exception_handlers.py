from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

try:
    from openai import (
        APIConnectionError as OpenAIConnectionError,
        APIStatusError as OpenAIStatusError,
        APITimeoutError as OpenAITimeoutError,
        AuthenticationError as OpenAIAuthenticationError,
        RateLimitError as OpenAIRateLimitError,
    )
except ImportError:  # pragma: no cover - OpenAI is an optional integration.
    OpenAIConnectionError = None
    OpenAIStatusError = None
    OpenAITimeoutError = None
    OpenAIAuthenticationError = None
    OpenAIRateLimitError = None
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.exceptions import APIError
from app.api.responses import build_error_response


logger = logging.getLogger("my_digital_twin.api")


_STATUS_CODES: dict[int, str] = {
    status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
    status.HTTP_401_UNAUTHORIZED: "AUTHENTICATION_REQUIRED",
    status.HTTP_403_FORBIDDEN: "FORBIDDEN",
    status.HTTP_404_NOT_FOUND: "NOT_FOUND",
    status.HTTP_405_METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    status.HTTP_409_CONFLICT: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
    422: "VALIDATION_ERROR",
    status.HTTP_429_TOO_MANY_REQUESTS: "RATE_LIMITED",
    status.HTTP_503_SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
}


def _default_code(status_code: int) -> str:
    return _STATUS_CODES.get(status_code, f"HTTP_{status_code}")


def _http_error_parts(
    status_code: int,
    detail: Any,
) -> tuple[str, str, Any | None]:
    code = _default_code(status_code)
    details: Any | None = None

    if isinstance(detail, dict):
        raw_code = detail.get("code") or detail.get("status")
        if isinstance(raw_code, str) and raw_code.strip():
            code = raw_code.strip().upper().replace(" ", "_")

        raw_message = detail.get("message")
        if isinstance(raw_message, str) and raw_message.strip():
            message = raw_message.strip()
        elif status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
            message = "The service is not ready to process this request."
        else:
            message = "The request could not be completed."

        details = detail
    elif isinstance(detail, str) and detail.strip():
        message = detail.strip()
    else:
        message = "The request could not be completed."
        details = detail

    return code, message, details


def _sanitize_validation_errors(
    errors: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    sanitized: list[dict[str, Any]] = []

    for error in errors:
        location = [
            str(part)
            for part in error.get("loc", ())
            if str(part) not in {"body"}
        ]
        sanitized.append(
            {
                "field": ".".join(location) or "request",
                "location": location,
                "message": error.get("msg", "Invalid value."),
                "type": error.get("type", "validation_error"),
            }
        )

    return sanitized


async def api_error_handler(
    _request: Request,
    exc: APIError,
):
    return build_error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
        legacy_detail=exc.details or exc.message,
        headers=exc.headers,
    )


async def http_exception_handler(
    _request: Request,
    exc: StarletteHTTPException,
):
    code, message, details = _http_error_parts(
        exc.status_code,
        exc.detail,
    )

    return build_error_response(
        status_code=exc.status_code,
        code=code,
        message=message,
        details=details,
        legacy_detail=exc.detail,
        headers=exc.headers,
    )


async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
):
    details = _sanitize_validation_errors(exc.errors())

    return build_error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message="The submitted data is invalid.",
        details=details,
        legacy_detail=details,
    )


async def integrity_error_handler(
    _request: Request,
    exc: IntegrityError,
):
    logger.warning(
        "Database integrity conflict",
        exc_info=exc,
        extra={"event": "database_integrity_error"},
    )
    return build_error_response(
        status_code=status.HTTP_409_CONFLICT,
        code="DATABASE_CONFLICT",
        message="The request conflicts with existing data.",
    )


async def database_error_handler(
    _request: Request,
    exc: SQLAlchemyError,
):
    logger.exception(
        "Database operation failed",
        exc_info=exc,
        extra={"event": "database_error"},
    )
    return build_error_response(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        code="DATABASE_UNAVAILABLE",
        message="The database is temporarily unavailable.",
    )



async def openai_authentication_error_handler(
    _request: Request,
    exc: Exception,
):
    logger.error(
        "AI provider authentication failed",
        exc_info=exc,
        extra={"event": "ai_authentication_error"},
    )
    return build_error_response(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        code="AI_CONFIGURATION_ERROR",
        message="The AI service is not configured correctly.",
    )


async def openai_rate_limit_error_handler(
    _request: Request,
    exc: Exception,
):
    logger.warning(
        "AI provider rate limit reached",
        exc_info=exc,
        extra={"event": "ai_rate_limit"},
    )
    return build_error_response(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        code="AI_RATE_LIMITED",
        message="The AI service is temporarily busy. Please try again shortly.",
    )


async def openai_unavailable_error_handler(
    _request: Request,
    exc: Exception,
):
    logger.error(
        "AI provider request failed",
        exc_info=exc,
        extra={"event": "ai_provider_error"},
    )
    return build_error_response(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        code="AI_SERVICE_UNAVAILABLE",
        message="The AI service is temporarily unavailable.",
    )

def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(APIError, api_error_handler)
    app.add_exception_handler(
        StarletteHTTPException,
        http_exception_handler,
    )
    app.add_exception_handler(
        RequestValidationError,
        validation_exception_handler,
    )
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(SQLAlchemyError, database_error_handler)

    if OpenAIAuthenticationError is not None:
        app.add_exception_handler(
            OpenAIAuthenticationError,
            openai_authentication_error_handler,
        )
    if OpenAIRateLimitError is not None:
        app.add_exception_handler(
            OpenAIRateLimitError,
            openai_rate_limit_error_handler,
        )
    for error_type in (
        OpenAIConnectionError,
        OpenAITimeoutError,
        OpenAIStatusError,
    ):
        if error_type is not None:
            app.add_exception_handler(
                error_type,
                openai_unavailable_error_handler,
            )
