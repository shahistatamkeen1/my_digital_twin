from __future__ import annotations

import json
import logging
from collections import Counter
from typing import Any

from fastapi.testclient import TestClient

from app.api.contract_inventory import build_route_inventory, route_inventory_payload
from app.api.openapi import canonical_openapi_schema, iter_operations
from app.config import settings


def _assert_operation_contracts(schema: dict[str, Any]) -> None:
    operations = list(iter_operations(schema))
    assert operations, "OpenAPI schema has no operations."

    operation_ids = [operation.get("operationId") for _, _, operation in operations]
    assert all(operation_ids), "Every operation must have an operationId."
    duplicates = [value for value, count in Counter(operation_ids).items() if count > 1]
    assert not duplicates, f"Duplicate operation IDs: {duplicates}"

    for path, method, operation in operations:
        assert operation.get("summary"), f"Missing summary: {method} {path}"
        assert operation.get("description"), f"Missing description: {method} {path}"
        assert operation.get("x-api-version"), f"Missing version metadata: {method} {path}"
        assert operation.get("x-error-contract") == "ApiErrorResponse"
        responses = operation.get("responses", {})
        assert responses, f"Missing responses: {method} {path}"
        for response in responses.values():
            if isinstance(response, dict):
                headers = response.get("headers", {})
                assert settings.request_id_header in headers, (
                    f"Missing request-id header docs: {method} {path}"
                )


def _assert_versioning(full_schema: dict[str, Any]) -> None:
    prefix = settings.normalized_api_v1_prefix
    canonical_paths = [
        path
        for path in full_schema["paths"]
        if path == prefix or path.startswith(f"{prefix}/")
    ]
    legacy_paths = [
        path
        for path in full_schema["paths"]
        if (path == "/api" or path.startswith("/api/"))
        and path not in canonical_paths
    ]
    assert canonical_paths, "Canonical v1 paths are missing."
    if settings.enable_legacy_api_routes:
        assert legacy_paths, "Legacy compatibility paths are missing."
        for path in legacy_paths:
            for method, operation in full_schema["paths"][path].items():
                if method not in {"get", "post", "put", "patch", "delete", "head", "options"}:
                    continue
                assert operation.get("deprecated") is True
                successor = operation.get("x-successor-version")
                assert successor and successor.startswith(prefix)
                assert operation.get("x-sunset") == settings.legacy_api_sunset

    canonical_schema = canonical_openapi_schema(full_schema)
    assert canonical_schema.get("x-contract-scope") == "canonical"
    assert all(
        path in {"/", "/live", "/health", "/ready"}
        or path == prefix
        or path.startswith(f"{prefix}/")
        for path in canonical_schema["paths"]
    )
    assert not any(
        str(tag.get("name", "")).startswith("Legacy / ")
        for tag in canonical_schema.get("tags", [])
    )


def _assert_security(schema: dict[str, Any]) -> None:
    schemes = schema["components"]["securitySchemes"]
    assert "HTTPBearer" in schemes
    assert schemes["AccessCookieAuth"]["in"] == "cookie"
    assert schemes["RefreshCookieAuth"]["in"] == "cookie"

    protected = schema["paths"]["/api/v1/applications/"]["get"]
    assert {"HTTPBearer": []} in protected["security"]
    assert {"AccessCookieAuth": []} in protected["security"]

    refresh = schema["paths"]["/api/v1/auth/refresh"]["post"]
    assert refresh["security"] == [{"RefreshCookieAuth": []}]

    status = schema["paths"]["/api/v1/auth/status"]["get"]
    assert {} in status["security"]

    login = schema["paths"]["/api/v1/auth/login"]["post"]
    assert not login.get("security")


def _assert_examples_and_headers(schema: dict[str, Any]) -> None:
    login = schema["paths"]["/api/v1/auth/login"]["post"]
    media = login["requestBody"]["content"]["application/json"]
    assert "examples" in media

    applications = schema["paths"]["/api/v1/applications/"]["get"]
    ok_response = applications["responses"]["200"]
    for header in (
        "X-Total-Count",
        "X-Page",
        "X-Page-Size",
        "X-Total-Pages",
        "X-Pagination-Mode",
    ):
        assert header in ok_response["headers"]

    validation = login["responses"]["422"]["content"]["application/json"]
    assert "examples" in validation


def _assert_no_secret_values(schema: dict[str, Any]) -> None:
    serialized = json.dumps(schema, sort_keys=True)
    for secret in (
        settings.jwt_secret_key,
        settings.openai_api_key,
    ):
        if secret and len(secret) >= 8:
            assert secret not in serialized
    if settings.database_url and "://" in settings.database_url:
        assert settings.database_url not in serialized


def run_smoke_test() -> None:
    from main import app

    app.openapi_schema = None
    full_schema = app.openapi()

    _assert_operation_contracts(full_schema)
    _assert_versioning(full_schema)
    _assert_security(full_schema)
    _assert_examples_and_headers(full_schema)
    _assert_no_secret_values(full_schema)

    inventory = build_route_inventory(full_schema)
    inventory_payload = route_inventory_payload(full_schema)
    assert len(inventory) == inventory_payload["total_operations"]
    assert inventory_payload["counts"]["canonical"] > 0
    assert inventory_payload["counts"]["infrastructure"] >= 4

    request_logger = logging.getLogger("my_digital_twin.requests")
    previous_disabled = request_logger.disabled
    request_logger.disabled = True
    try:
        with TestClient(app, raise_server_exceptions=False) as client:
            full_response = client.get("/openapi.json")
            assert full_response.status_code == 200
            assert full_response.json()["x-api-contract"]["canonical_version"] == "v1"

            canonical_response = client.get(settings.api_openapi_path)
            assert canonical_response.status_code == 200
            canonical_body = canonical_response.json()
            assert canonical_body["x-contract-scope"] == "canonical"
            assert "/api/applications/" not in canonical_body["paths"]
            assert "/api/v1/applications/" in canonical_body["paths"]
            assert canonical_response.headers[settings.api_version_header] == "v1"

            if settings.api_docs_enabled:
                docs = client.get(settings.api_docs_path)
                assert docs.status_code == 200
                assert settings.api_openapi_path in docs.text
                assert "Swagger UI" in docs.text

                redoc = client.get(settings.api_redoc_path)
                assert redoc.status_code == 200
                assert settings.api_openapi_path in redoc.text
                assert "ReDoc" in redoc.text
    finally:
        request_logger.disabled = previous_disabled

    print("Phase 4E API documentation and contract smoke test passed.")
    print("OpenAPI metadata, unique operation IDs, examples, and headers passed.")
    print("Canonical docs, legacy compatibility, authentication, and inventory passed.")


if __name__ == "__main__":
    run_smoke_test()
