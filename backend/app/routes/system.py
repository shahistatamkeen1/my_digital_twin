
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.versioning import api_version_payload
from app.config import settings
from app.database import engine
from app.dependencies.auth import get_current_user
from app.services.monitoring_service import (
    collect_monitoring_snapshot,
    health_payload,
    liveness_payload,
    public_status_payload,
)


infrastructure_router = APIRouter(tags=["System"])
api_router = APIRouter(tags=["v1 / System"])


def _no_store(response: Response) -> None:
    response.headers["Cache-Control"] = "no-store, max-age=0"
    response.headers["Pragma"] = "no-cache"


def _readiness_response(response: Response) -> dict[str, Any]:
    _no_store(response)
    snapshot = collect_monitoring_snapshot(engine)

    if not snapshot.ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "not_ready",
                "message": "The service is not ready to accept traffic.",
                "monitoring": snapshot.payload,
            },
            headers={
                "Cache-Control": "no-store, max-age=0",
                "Pragma": "no-cache",
                "Retry-After": "10",
            },
        )

    return snapshot.payload


@infrastructure_router.get("/")
def home() -> dict[str, Any]:
    return {
        "message": "My Digital Twin backend is running",
        "environment": settings.environment,
        "version": settings.app_version,
        "database_dialect": engine.dialect.name,
        "api_version": settings.api_current_version,
        "api_prefix": settings.normalized_api_v1_prefix,
    }


@infrastructure_router.get("/live")
def live(response: Response) -> dict[str, Any]:
    _no_store(response)
    return liveness_payload()


@infrastructure_router.get("/health")
def health(response: Response) -> dict[str, Any]:
    _no_store(response)
    return health_payload()


@infrastructure_router.get("/ready")
def ready(response: Response) -> dict[str, Any]:
    return _readiness_response(response)


@api_router.get("/version")
def version(response: Response) -> dict[str, object]:
    _no_store(response)
    return api_version_payload()


@api_router.get("/live")
def versioned_live(response: Response) -> dict[str, Any]:
    _no_store(response)
    return liveness_payload()


@api_router.get("/health")
def versioned_health(response: Response) -> dict[str, Any]:
    _no_store(response)
    return health_payload()


@api_router.get("/ready")
def versioned_ready(response: Response) -> dict[str, Any]:
    return _readiness_response(response)


@api_router.get("/status")
def system_status(response: Response) -> dict[str, Any]:
    """Public, credential-safe operational summary for dashboards."""

    _no_store(response)
    snapshot = collect_monitoring_snapshot(engine)
    return public_status_payload(snapshot)


@api_router.get(
    "/diagnostics",
    dependencies=[Depends(get_current_user)],
)
def system_diagnostics(response: Response) -> dict[str, Any]:
    """Authenticated diagnostics without secrets, URLs, or user records."""

    _no_store(response)
    snapshot = collect_monitoring_snapshot(
        engine,
        include_diagnostics=True,
        force_refresh=True,
    )
    return snapshot.payload
