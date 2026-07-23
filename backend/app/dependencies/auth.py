from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.auth_service import (
    AuthConfigurationError,
    AuthTokenError,
    decode_token,
)


bearer_scheme = HTTPBearer(auto_error=False)


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication is required.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ] = None,
) -> User:
    token = (
        credentials.credentials
        if credentials is not None
        else request.cookies.get(settings.access_cookie_name)
    )

    if not token:
        raise _credentials_exception()

    try:
        payload = decode_token(token, expected_type="access")
        user_id = int(payload.sub)
    except AuthConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except (AuthTokenError, TypeError, ValueError) as exc:
        raise _credentials_exception() from exc

    user = db.query(User).filter(User.id == user_id).first()

    if user is None or not user.is_active:
        raise _credentials_exception()

    return user


def get_optional_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ] = None,
) -> User | None:
    token = (
        credentials.credentials
        if credentials is not None
        else request.cookies.get(settings.access_cookie_name)
    )

    if not token:
        return None

    try:
        payload = decode_token(token, expected_type="access")
        user_id = int(payload.sub)
    except (AuthConfigurationError, AuthTokenError, TypeError, ValueError):
        return None

    return (
        db.query(User)
        .filter(User.id == user_id, User.is_active.is_(True))
        .first()
    )
