from __future__ import annotations

from typing import Any, Mapping

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.api.request_context import get_request_id


def build_error_payload(
    *,
    code: str,
    message: str,
    details: Any | None = None,
    legacy_detail: Any | None = None,
) -> dict[str, Any]:
    """Build the standard error envelope plus backward-compatible fields."""

    compatible_detail = (
        legacy_detail
        if legacy_detail is not None
        else details if details is not None else message
    )

    return jsonable_encoder(
        {
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
            "meta": {
                "request_id": get_request_id(),
            },
            "detail": compatible_detail,
            "message": message,
        }
    )


def build_error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    details: Any | None = None,
    legacy_detail: Any | None = None,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=build_error_payload(
            code=code,
            message=message,
            details=details,
            legacy_detail=legacy_detail,
        ),
        headers=dict(headers or {}),
    )
