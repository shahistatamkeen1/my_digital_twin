
from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.exception_handlers import register_exception_handlers
from app.api.middleware import request_context_middleware
from app.config import settings
from app.dependencies.auth import get_current_user
from app.routes import system as system_routes
from app.services.monitoring_service import MonitoringSnapshot


def _ready_payload(*, ready: bool, diagnostics: bool = False) -> dict[str, Any]:
    status_value = "ready" if ready else "not_ready"
    payload: dict[str, Any] = {
        "status": status_value,
        "overall_status": "operational" if ready else "degraded",
        "service": "Test Digital Twin",
        "version": "0.4.3",
        "environment": "test",
        "timestamp": "2026-07-28T12:00:00+00:00",
        "uptime_seconds": 120,
        "check_duration_ms": 4.2,
        "checks": {
            "database": {"status": "healthy" if ready else "unhealthy"},
            "migrations": {"status": "healthy" if ready else "unhealthy"},
            "ownership_schema": {"status": "healthy"},
            "schema_optimization": {"status": "healthy"},
            "authentication": {"status": "configured"},
            "ai": {"status": "configured"},
            "disk": {"status": "healthy"},
            "memory": {"status": "healthy"},
        },
        "database": "connected" if ready else "unavailable",
        "ai_configured": True,
        "auth_configured": True,
        "migration_schema_ready": ready,
        "ownership_schema_ready": True,
        "schema_optimization_ready": True,
        "database_dialect": "postgresql",
        "database_driver": "postgresql+psycopg2",
        "migration_heads": ["20260723_0003"],
        "cache": {"status": "miss", "ttl_seconds": 5},
    }
    if diagnostics:
        payload["diagnostics"] = {
            "process": {"pid": 123, "uptime_seconds": 120},
            "runtime": {"python_version": "3.11.0"},
            "database_pool": {"class": "QueuePool"},
            "monitoring_policy": {"readiness_requires_auth": True},
        }
    return payload


def _create_test_app() -> FastAPI:
    app = FastAPI()
    app.middleware("http")(request_context_middleware)
    register_exception_handlers(app)
    app.include_router(system_routes.infrastructure_router)
    app.include_router(
        system_routes.api_router,
        prefix=f"{settings.normalized_api_v1_prefix}/system",
    )
    app.dependency_overrides[get_current_user] = lambda: object()
    return app


def run_smoke_test() -> None:
    original = system_routes.collect_monitoring_snapshot
    request_logger = logging.getLogger("my_digital_twin.requests")
    previous_disabled = request_logger.disabled
    request_logger.disabled = True

    try:
        system_routes.collect_monitoring_snapshot = lambda *_args, **kwargs: (
            MonitoringSnapshot(
                ready=True,
                payload=_ready_payload(
                    ready=True,
                    diagnostics=bool(kwargs.get("include_diagnostics")),
                ),
            )
        )

        with TestClient(_create_test_app(), raise_server_exceptions=False) as client:
            live = client.get("/live")
            assert live.status_code == 200
            assert live.json()["status"] == "alive"
            assert live.headers["Cache-Control"].startswith("no-store")

            health = client.get("/health")
            assert health.status_code == 200
            assert health.json()["status"] == "healthy"

            ready = client.get("/ready")
            assert ready.status_code == 200
            assert ready.json()["status"] == "ready"
            assert ready.json()["migration_schema_ready"] is True

            versioned_ready = client.get("/api/v1/system/ready")
            assert versioned_ready.status_code == 200
            assert versioned_ready.headers[settings.api_version_header] == "v1"

            status_response = client.get("/api/v1/system/status")
            assert status_response.status_code == 200
            assert status_response.json()["status"] == "operational"
            assert "database_driver" not in status_response.json()

            diagnostics = client.get("/api/v1/system/diagnostics")
            assert diagnostics.status_code == 200
            assert "diagnostics" in diagnostics.json()
            serialized = diagnostics.text.lower()
            for forbidden in (
                "database_url",
                "jwt_secret_key",
                "openai_api_key",
                "password",
                "postgresql+psycopg2://",
            ):
                assert forbidden not in serialized

        system_routes.collect_monitoring_snapshot = lambda *_args, **_kwargs: (
            MonitoringSnapshot(
                ready=False,
                payload=_ready_payload(ready=False),
            )
        )

        with TestClient(_create_test_app(), raise_server_exceptions=False) as client:
            unavailable = client.get("/ready")
            assert unavailable.status_code == 503
            body = unavailable.json()
            assert body["success"] is False
            assert body["error"]["code"] == "NOT_READY"
            assert body["error"]["details"]["status"] == "not_ready"
            assert "no-store" in unavailable.headers["Cache-Control"]
            assert unavailable.headers["Retry-After"] == "10"
    finally:
        system_routes.collect_monitoring_snapshot = original
        request_logger.disabled = previous_disabled

    print("Phase 4D monitoring smoke test passed.")
    print("Liveness, health, readiness, status, diagnostics, and 503 behavior passed.")
    print("Diagnostics secret-exposure safeguards passed.")


if __name__ == "__main__":
    run_smoke_test()
