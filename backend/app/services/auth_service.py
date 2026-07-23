from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.config import settings
from app.schemas.auth import TokenPayload


password_hash = PasswordHash.recommended()


class AuthConfigurationError(RuntimeError):
    pass


class AuthTokenError(ValueError):
    pass


def ensure_auth_configured() -> None:
    if not settings.auth_configured:
        raise AuthConfigurationError(
            "JWT_SECRET_KEY is missing or shorter than 32 characters."
        )


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return password_hash.verify(password, hashed_password)
    except Exception:
        return False


def create_access_token(user_id: int) -> str:
    return _create_token(
        user_id=user_id,
        token_type="access",
        expires_delta=timedelta(
            minutes=settings.access_token_expire_minutes
        ),
    )


def create_refresh_token(user_id: int) -> str:
    return _create_token(
        user_id=user_id,
        token_type="refresh",
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str, expected_type: str) -> TokenPayload:
    ensure_auth_configured()

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={
                "require": ["sub", "type", "jti", "exp", "iat"],
            },
        )
    except InvalidTokenError as exc:
        raise AuthTokenError("The authentication token is invalid or expired.") from exc

    parsed = TokenPayload.model_validate(payload)

    if parsed.type != expected_type:
        raise AuthTokenError("The authentication token type is invalid.")

    return parsed


def _create_token(
    user_id: int,
    token_type: str,
    expires_delta: timedelta,
) -> str:
    ensure_auth_configured()

    now = datetime.now(timezone.utc)
    expires_at = now + expires_delta

    payload = {
        "sub": str(user_id),
        "type": token_type,
        "jti": str(uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
