from __future__ import annotations

from fastapi.testclient import TestClient


DEFAULT_PASSWORD = "Phase5Test123"


def register_user(
    client: TestClient,
    *,
    email: str,
    full_name: str,
    password: str = DEFAULT_PASSWORD,
) -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": full_name,
            "password": password,
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == email.lower()
    return body


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
