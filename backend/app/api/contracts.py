from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ApiErrorInfo(BaseModel):
    """Machine-readable API error information."""

    code: str = Field(
        description="Stable machine-readable error code.",
        examples=["VALIDATION_ERROR"],
    )
    message: str = Field(
        description="Safe human-readable error message.",
        examples=["The submitted data is invalid."],
    )
    details: Any | None = Field(
        default=None,
        description="Optional safe structured details.",
    )


class ApiResponseMeta(BaseModel):
    """Metadata included with standardized API errors."""

    request_id: str = Field(
        description="Request correlation identifier.",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )


class ApiErrorResponse(BaseModel):
    """Standard error response used by every API endpoint."""

    success: Literal[False] = False
    error: ApiErrorInfo
    meta: ApiResponseMeta

    # Compatibility fields keep existing frontend and extension consumers
    # working during the gradual Phase 4 API migration.
    detail: Any | None = None
    message: str | None = None
