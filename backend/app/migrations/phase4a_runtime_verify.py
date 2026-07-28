from __future__ import annotations

import argparse

import httpx


def _assert_error_contract(
    response: httpx.Response,
    *,
    status_code: int,
    code: str,
) -> dict:
    if response.status_code != status_code:
        raise RuntimeError(
            f"Expected HTTP {status_code}, received {response.status_code}: "
            f"{response.text}"
        )

    body = response.json()
    if body.get("success") is not False:
        raise RuntimeError(f"Missing error envelope: {body}")
    if body.get("error", {}).get("code") != code:
        raise RuntimeError(
            f"Expected error code {code}, received: {body}"
        )
    if not body.get("meta", {}).get("request_id"):
        raise RuntimeError(f"Missing request_id metadata: {body}")
    if "detail" not in body:
        raise RuntimeError(f"Missing compatibility detail: {body}")

    return body


def verify(base_url: str) -> None:
    base_url = base_url.rstrip("/")
    request_id = "phase4a-runtime-verification"

    with httpx.Client(base_url=base_url, timeout=20.0) as client:
        health = client.get(
            "/health",
            headers={"X-Request-ID": request_id},
        )
        health.raise_for_status()

        if health.json().get("status") != "healthy":
            raise RuntimeError(f"Unexpected health response: {health.text}")
        if health.headers.get("X-Request-ID") != request_id:
            raise RuntimeError(
                "The backend did not preserve the supplied request ID."
            )

        missing = client.get("/phase4a-route-that-does-not-exist")
        _assert_error_contract(
            missing,
            status_code=404,
            code="NOT_FOUND",
        )

        unauthorized = client.get("/api/auth/me")
        _assert_error_contract(
            unauthorized,
            status_code=401,
            code="AUTHENTICATION_REQUIRED",
        )

        invalid = client.post("/api/auth/login", json={})
        body = _assert_error_contract(
            invalid,
            status_code=422,
            code="VALIDATION_ERROR",
        )

        for item in body["error"]["details"]:
            if "input" in item:
                raise RuntimeError(
                    "Validation errors must not echo submitted input."
                )

    print("Phase 4A live API verification passed.")
    print("Health compatibility, request IDs, 404, 401, and 422 passed.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
    )
    args = parser.parse_args()
    verify(args.base_url)


if __name__ == "__main__":
    main()
