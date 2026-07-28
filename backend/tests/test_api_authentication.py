from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.support import DEFAULT_PASSWORD, bearer, register_user


@pytest.mark.integration
def test_register_login_me_refresh_and_logout(client: TestClient) -> None:
    registered = register_user(
        client,
        email="auth-user@example.com",
        full_name="Auth User",
    )
    access_token = registered["access_token"]

    me = client.get("/api/v1/auth/me", headers=bearer(access_token))
    assert me.status_code == 200, me.text
    assert me.json()["email"] == "auth-user@example.com"

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "AUTH-USER@example.com",
            "password": DEFAULT_PASSWORD,
        },
    )
    assert login.status_code == 200, login.text
    assert login.json()["access_token"]

    refresh = client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200, refresh.text
    assert refresh.json()["user"]["email"] == "auth-user@example.com"

    logout = client.post("/api/v1/auth/logout")
    assert logout.status_code == 200, logout.text
    assert logout.json()["message"] == "Logged out successfully."


@pytest.mark.integration
def test_authentication_errors_use_the_standard_contract(client: TestClient) -> None:
    register_user(
        client,
        email="duplicate@example.com",
        full_name="Duplicate User",
    )

    duplicate = client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "full_name": "Duplicate User",
            "password": DEFAULT_PASSWORD,
        },
    )
    assert duplicate.status_code == 409
    duplicate_body = duplicate.json()
    assert duplicate_body["success"] is False
    assert duplicate_body["error"]["code"] == "CONFLICT"
    assert duplicate_body["meta"]["request_id"]

    invalid_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "duplicate@example.com",
            "password": "WrongPassword123",
        },
    )
    assert invalid_login.status_code == 401
    assert invalid_login.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"

    client.cookies.clear()
    unauthenticated = client.get("/api/v1/applications/")
    assert unauthenticated.status_code == 401
    assert unauthenticated.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"
