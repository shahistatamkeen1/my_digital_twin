from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    AuthStatusResponse,
    MessageResponse,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.services.auth_service import (
    AuthConfigurationError,
    AuthTokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    ensure_auth_configured,
    hash_password,
    verify_password,
)


router = APIRouter()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _auth_unavailable(exc: AuthConfigurationError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=str(exc),
    )



def _ensure_auth_ready() -> None:
    try:
        ensure_auth_configured()
    except AuthConfigurationError as exc:
        raise _auth_unavailable(exc) from exc


def _set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    common = {
        "httponly": True,
        "secure": settings.auth_cookie_secure,
        "samesite": settings.auth_cookie_samesite,
        "domain": settings.auth_cookie_domain,
    }

    response.set_cookie(
        key=settings.access_cookie_name,
        value=access_token,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
        **common,
    )
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/api/auth",
        **common,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=settings.access_cookie_name,
        path="/",
        domain=settings.auth_cookie_domain,
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite=settings.auth_cookie_samesite,
    )
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path="/api/auth",
        domain=settings.auth_cookie_domain,
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite=settings.auth_cookie_samesite,
    )


def _build_auth_response(response: Response, user: User) -> AuthResponse:
    try:
        ensure_auth_configured()
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
    except AuthConfigurationError as exc:
        raise _auth_unavailable(exc) from exc

    _set_auth_cookies(response, access_token, refresh_token)

    return AuthResponse(
        access_token=access_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserRead.model_validate(user),
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserCreate,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
):
    _ensure_auth_ready()
    email = _normalize_email(str(payload.email))

    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        last_login_at=datetime.now(timezone.utc),
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from exc

    db.refresh(user)
    return _build_auth_response(response, user)


@router.post("/login", response_model=AuthResponse)
def login(
    payload: UserLogin,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
):
    _ensure_auth_ready()
    email = _normalize_email(str(payload.email))
    user = db.query(User).filter(User.email == email).first()

    if user is None or not verify_password(
        payload.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The email or password is incorrect.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled.",
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return _build_auth_response(response, user)


@router.post("/refresh", response_model=AuthResponse)
def refresh_session(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
):
    refresh_token = request.cookies.get(settings.refresh_cookie_name)

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh session is available.",
        )

    try:
        payload = decode_token(refresh_token, expected_type="refresh")
        user_id = int(payload.sub)
    except AuthConfigurationError as exc:
        raise _auth_unavailable(exc) from exc
    except (AuthTokenError, TypeError, ValueError) as exc:
        _clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The refresh session is invalid or expired.",
        ) from exc

    user = (
        db.query(User)
        .filter(User.id == user_id, User.is_active.is_(True))
        .first()
    )

    if user is None:
        _clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The user account is no longer available.",
        )

    return _build_auth_response(response, user)


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response):
    _clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=UserRead)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user


@router.get("/status", response_model=AuthStatusResponse)
def get_auth_status(
    current_user: Annotated[User | None, Depends(get_optional_current_user)],
):
    return AuthStatusResponse(
        authenticated=current_user is not None,
        user=(
            UserRead.model_validate(current_user)
            if current_user is not None
            else None
        ),
    )
