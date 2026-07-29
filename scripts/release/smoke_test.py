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
    url: str
    expect_json: bool = False


def request(check: Check, timeout: float) -> Any:
    req = urllib.request.Request(
        check.url,
        headers={"User-Agent": "my-digital-twin-release-smoke-test/1"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"{check.name} returned HTTP {response.status}")
        body = response.read()
        if not check.expect_json:
            return body
        return json.loads(body.decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke-test a deployed release.")
    parser.add_argument("--backend-url", required=True)
    parser.add_argument("--frontend-url", required=True)
    parser.add_argument("--expected-version", required=True)
    parser.add_argument("--timeout-seconds", type=int, default=300)
    parser.add_argument("--request-timeout-seconds", type=float, default=10)
    args = parser.parse_args()

    backend = args.backend_url.rstrip("/")
    frontend = args.frontend_url.rstrip("/")
    checks = (
        Check("frontend", f"{frontend}/"),
        Check("backend root", f"{backend}/", expect_json=True),
        Check("liveness", f"{backend}/live", expect_json=True),
        Check("readiness", f"{backend}/ready", expect_json=True),
        Check("API version", f"{backend}/api/v1/system/version", expect_json=True),
    )

    deadline = time.monotonic() + max(1, args.timeout_seconds)
    last_error: Exception | None = None

    while time.monotonic() < deadline:
        try:
            results = {check.name: request(check, args.request_timeout_seconds) for check in checks}
            root = results["backend root"]
            ready = results["readiness"]
            api_version = results["API version"]

            if root.get("version") != args.expected_version:
                raise RuntimeError(
                    f"Backend version {root.get('version')!r} does not match "
                    f"{args.expected_version!r}"
                )
            if ready.get("status") != "ready":
                raise RuntimeError(f"Readiness status is {ready.get('status')!r}")
            if api_version.get("current_version") != "v1":
                raise RuntimeError("Canonical API version is not v1")

            print("Phase 5D deployment smoke test passed.")
            print(f"Backend version: {root.get('version')}")
            print(f"Frontend: {frontend}")
            print(f"Backend: {backend}")
            return 0
        except (OSError, ValueError, RuntimeError, urllib.error.URLError) as exc:
            last_error = exc
            time.sleep(5)

    raise SystemExit(f"Smoke test timed out: {last_error}")


if __name__ == "__main__":
    raise SystemExit(main())
