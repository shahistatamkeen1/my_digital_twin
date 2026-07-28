from __future__ import annotations

import argparse

import httpx


def verify(base_url: str) -> None:
    base_url = base_url.rstrip("/")

    with httpx.Client(base_url=base_url, timeout=30.0) as client:
        version = client.get("/api/v1/system/version")
        version.raise_for_status()
        version_body = version.json()

        if version_body.get("current_version") != "v1":
            raise RuntimeError(f"Unexpected version response: {version.text}")
        if version.headers.get("X-API-Version") != "v1":
            raise RuntimeError("v1 response is missing X-API-Version: v1")
        if "Deprecation" in version.headers:
            raise RuntimeError("The canonical v1 route was marked deprecated.")

        v1_status = client.get("/api/v1/auth/status")
        v1_status.raise_for_status()
        if v1_status.headers.get("X-API-Version") != "v1":
            raise RuntimeError("Versioned auth route lacks the v1 header.")

        legacy_status = client.get("/api/auth/status")
        legacy_status.raise_for_status()
        if legacy_status.headers.get("X-API-Version") != "legacy":
            raise RuntimeError("Legacy auth route lacks the legacy header.")
        if legacy_status.headers.get("Deprecation") != "true":
            raise RuntimeError("Legacy route lacks the Deprecation header.")
        if "/api/v1/auth/status" not in legacy_status.headers.get("Link", ""):
            raise RuntimeError("Legacy route lacks its successor Link header.")
        if not legacy_status.headers.get("Sunset"):
            raise RuntimeError("Legacy route lacks the Sunset header.")

        if v1_status.json() != legacy_status.json():
            raise RuntimeError("v1 and legacy success responses are incompatible.")

        v1_invalid = client.post("/api/v1/auth/login", json={})
        legacy_invalid = client.post("/api/auth/login", json={})
        if v1_invalid.status_code != 422 or legacy_invalid.status_code != 422:
            raise RuntimeError("Validation endpoints did not return HTTP 422.")
        if v1_invalid.json().get("error", {}).get("code") != "VALIDATION_ERROR":
            raise RuntimeError("v1 validation contract changed unexpectedly.")
        if legacy_invalid.json().get("error", {}).get("code") != "VALIDATION_ERROR":
            raise RuntimeError("Legacy validation contract changed unexpectedly.")

        health = client.get("/api/v1/system/health")
        health.raise_for_status()
        if health.json().get("status") != "healthy":
            raise RuntimeError(f"Unexpected v1 health response: {health.text}")

        ready = client.get("/api/v1/system/ready")
        ready.raise_for_status()
        if ready.json().get("status") != "ready":
            raise RuntimeError(f"Unexpected v1 ready response: {ready.text}")

    print("Phase 4B live API versioning verification passed.")
    print("v1 routes, legacy compatibility, deprecation headers, and system endpoints passed.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()
    verify(args.base_url)


if __name__ == "__main__":
    main()
