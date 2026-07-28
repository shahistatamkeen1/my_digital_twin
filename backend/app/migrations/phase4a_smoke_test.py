from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

from app.api.exception_handlers import register_exception_handlers
from app.api.exceptions import APIError
from app.api.middleware import request_context_middleware
from app.config import settings


class _SecretPayload(BaseModel):
    password: str = Field(min_length=8)


def create_contract_test_app() -> FastAPI:
    app = FastAPI()
    app.middleware("http")(request_context_middleware)
    register_exception_handlers(app)

    @app.get("/success")
    def success():
        return {"value": "unchanged"}

    @app.get("/missing")
    def missing():
        raise HTTPException(status_code=404, detail="Record not found.")

    @app.post("/validation")
    def validation(_payload: _SecretPayload):
        return {"ok": True}

    @app.get("/custom")
    def custom():
        raise APIError(
            status_code=409,
            code="TEST_CONFLICT",
            message="The test resource already exists.",
            details={"resource": "test"},
        )

    @app.get("/unexpected")
    def unexpected():
        raise RuntimeError("private internal implementation detail")

    return app


def _assert_error_contract(
    response,
    *,
    status_code: int,
    code: str,
) -> dict:
    assert response.status_code == status_code, response.text
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == code
    assert isinstance(body["error"]["message"], str)
    assert body["meta"]["request_id"]
    assert response.headers[settings.request_id_header]
    assert "detail" in body
    return body


def run_smoke_test() -> None:
    app = create_contract_test_app()
    request_logger = logging.getLogger("my_digital_twin.requests")
    previous_disabled = request_logger.disabled
    request_logger.disabled = True

    try:
        with TestClient(app, raise_server_exceptions=False) as client:
            request_id = "phase4a-smoke-request"

            success = client.get(
                "/success",
                headers={settings.request_id_header: request_id},
            )
            assert success.status_code == 200
            assert success.json() == {"value": "unchanged"}
            assert success.headers[settings.request_id_header] == request_id

            missing = client.get("/missing")
            missing_body = _assert_error_contract(
                missing,
                status_code=404,
                code="NOT_FOUND",
            )
            assert missing_body["detail"] == "Record not found."

            invalid = client.post(
                "/validation",
                json={"password": "short"},
            )
            invalid_body = _assert_error_contract(
                invalid,
                status_code=422,
                code="VALIDATION_ERROR",
            )
            assert "input" not in invalid_body["error"]["details"][0]
            assert invalid_body["error"]["details"][0]["field"] == "password"

            custom = client.get("/custom")
            custom_body = _assert_error_contract(
                custom,
                status_code=409,
                code="TEST_CONFLICT",
            )
            assert custom_body["error"]["details"]["resource"] == "test"

            unexpected = client.get("/unexpected")
            unexpected_body = _assert_error_contract(
                unexpected,
                status_code=500,
                code="INTERNAL_SERVER_ERROR",
            )
            if not settings.expose_internal_error_details:
                assert "private internal implementation detail" not in str(
                    unexpected_body
                )
    finally:
        request_logger.disabled = previous_disabled

    print("Phase 4A API contract smoke test passed.")
    print("Success responses remain backward compatible.")
    print("Request IDs, standardized errors, and safe validation passed.")


if __name__ == "__main__":
    run_smoke_test()
