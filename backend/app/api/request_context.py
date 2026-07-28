from __future__ import annotations

from contextvars import ContextVar, Token
from uuid import uuid4


_request_id_context: ContextVar[str | None] = ContextVar(
    "request_id",
    default=None,
)


def create_request_id() -> str:
    return str(uuid4())


def set_request_id(request_id: str) -> Token:
    return _request_id_context.set(request_id)


def reset_request_id(token: Token) -> None:
    _request_id_context.reset(token)


def get_request_id(default: str = "unavailable") -> str:
    return _request_id_context.get() or default
