from __future__ import annotations

import logging

from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient

from app.api.middleware import request_context_middleware
from app.api.router_registration import include_versioned_router
from app.config import settings


def _create_versioning_test_app() -> FastAPI:
    app = FastAPI()
    app.middleware("http")(request_context_middleware)
    router = APIRouter()

    @router.get("/demo")
    def demo():
        return {"value": "compatible"}

    include_versioned_router(
        app,
        router,
        legacy_prefix="/api/example",
        tags=["Example"],
    )
    return app


def _verify_runtime_headers() -> None:
    app = _create_versioning_test_app()
    request_logger = logging.getLogger("my_digital_twin.requests")
    previous_disabled = request_logger.disabled
    request_logger.disabled = True

    try:
        with TestClient(app) as client:
            versioned = client.get("/api/v1/example/demo")
            legacy = client.get("/api/example/demo")

            assert versioned.status_code == 200
            assert legacy.status_code == 200
            assert versioned.json() == legacy.json() == {"value": "compatible"}

            assert versioned.headers[settings.api_version_header] == "v1"
            assert "Deprecation" not in versioned.headers

            assert legacy.headers[settings.api_version_header] == "legacy"
            assert legacy.headers["Deprecation"] == "true"
            assert legacy.headers["Sunset"] == settings.legacy_api_sunset
            assert "/api/v1/example/demo" in legacy.headers["Link"]
    finally:
        request_logger.disabled = previous_disabled


def _verify_openapi_contract() -> None:
    schema = _create_versioning_test_app().openapi()
    paths = schema["paths"]

    assert "/api/v1/example/demo" in paths
    assert "/api/example/demo" in paths
    assert paths["/api/example/demo"]["get"]["deprecated"] is True
    assert not paths["/api/v1/example/demo"]["get"].get("deprecated", False)


def run_smoke_test() -> None:
    assert settings.normalized_api_v1_prefix == "/api/v1"
    assert settings.refresh_cookie_path == "/api"
    _verify_runtime_headers()
    _verify_openapi_contract()

    print("Phase 4B API versioning smoke test passed.")
    print("v1 registration, legacy deprecation, headers, and cookie scope verified.")


if __name__ == "__main__":
    run_smoke_test()
