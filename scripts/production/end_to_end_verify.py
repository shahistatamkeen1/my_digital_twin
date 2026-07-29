from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Check:
    name: str
    path: str
    json_body: bool = True


def get(url: str, timeout: float) -> tuple[int, dict[str, str], Any]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "my-digital-twin-phase5e-verifier/1"},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read()
        payload: Any = body
        content_type = response.headers.get("Content-Type", "")
        if "json" in content_type:
            payload = json.loads(body.decode("utf-8"))
        return response.status, dict(response.headers.items()), payload


def verify(backend: str, frontend: str, expected_version: str, request_timeout: float) -> None:
    backend = backend.rstrip("/")
    frontend = frontend.rstrip("/")

    status, _, _ = get(f"{frontend}/", request_timeout)
    if not 200 <= status < 400:
        raise RuntimeError(f"Frontend returned HTTP {status}")

    checks = (
        Check("root", "/"),
        Check("liveness", "/live"),
        Check("health", "/health"),
        Check("readiness", "/ready"),
        Check("API version", "/api/v1/system/version"),
        Check("canonical OpenAPI", "/api/v1/openapi.json"),
    )
    results: dict[str, Any] = {}
    request_ids: list[str] = []

    for check in checks:
        status, headers, payload = get(f"{backend}{check.path}", request_timeout)
        if status != 200:
            raise RuntimeError(f"{check.name} returned HTTP {status}")
        results[check.name] = payload
        request_id = headers.get("X-Request-ID") or headers.get("x-request-id")
        if request_id:
            request_ids.append(request_id)

    root = results["root"]
    ready = results["readiness"]
    version = results["API version"]
    schema = results["canonical OpenAPI"]

    if root.get("version") != expected_version:
        raise RuntimeError(
            f"Backend version {root.get('version')!r} does not match {expected_version!r}"
        )
    if ready.get("status") != "ready":
        raise RuntimeError(f"Readiness status is {ready.get('status')!r}")
    if version.get("current_version") != "v1":
        raise RuntimeError("Canonical API version is not v1")

    paths = schema.get("paths", {})
    required_paths = {
        "/api/v1/auth/login",
        "/api/v1/applications/",
        "/api/v1/finance/",
        "/api/v1/health/habits",
        "/api/v1/learning/",
        "/api/v1/system/ready",
    }
    missing = sorted(required_paths - set(paths))
    if missing:
        raise RuntimeError(f"Canonical OpenAPI is missing paths: {', '.join(missing)}")
    legacy = [path for path in paths if path.startswith("/api/") and not path.startswith("/api/v1/")]
    if legacy:
        raise RuntimeError("Canonical OpenAPI unexpectedly includes deprecated legacy routes")
    if not request_ids:
        raise RuntimeError("No X-Request-ID response header was observed")

    print("Phase 5E end-to-end verification passed.")
    print(f"Frontend: {frontend}")
    print(f"Backend: {backend}")
    print(f"Version: {expected_version}")
    print(f"Canonical paths: {len(paths)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify the running production-like stack.")
    parser.add_argument("--backend-url", default="http://localhost:8000")
    parser.add_argument("--frontend-url", default="http://localhost:3000")
    parser.add_argument("--expected-version", required=True)
    parser.add_argument("--timeout-seconds", type=int, default=300)
    parser.add_argument("--request-timeout-seconds", type=float, default=10)
    args = parser.parse_args()

    deadline = time.monotonic() + max(1, args.timeout_seconds)
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            verify(
                args.backend_url,
                args.frontend_url,
                args.expected_version,
                args.request_timeout_seconds,
            )
            return 0
        except (RuntimeError, OSError, ValueError, urllib.error.URLError) as exc:
            last_error = exc
            time.sleep(5)

    raise SystemExit(f"Phase 5E end-to-end verification timed out: {last_error}")


if __name__ == "__main__":
    raise SystemExit(main())
