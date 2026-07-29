from __future__ import annotations

import argparse
import json
import sys
from typing import Any

import requests


EXPECTED_MIGRATION_HEAD = "20260723_0003"


def _get_json(base_url: str, path: str) -> tuple[requests.Response, dict[str, Any]]:
    response = requests.get(
        f"{base_url.rstrip('/')}{path}",
        timeout=15,
        headers={"Accept": "application/json"},
    )
    try:
        payload = response.json()
    except ValueError as exc:
        raise AssertionError(f"{path} did not return JSON.") from exc
    if not isinstance(payload, dict):
        raise AssertionError(f"{path} did not return a JSON object.")
    return response, payload


def verify(base_url: str) -> None:
    live_response, live = _get_json(base_url, "/live")
    assert live_response.status_code == 200, live_response.text
    assert live.get("status") == "alive", live

    ready_response, ready = _get_json(base_url, "/ready")
    assert ready_response.status_code == 200, ready_response.text
    assert ready.get("status") == "ready", ready
    assert ready.get("database") == "connected", ready
    assert ready.get("database_dialect") == "postgresql", ready
    assert ready.get("auth_configured") is True, ready
    assert ready.get("migration_schema_ready") is True, ready
    assert ready.get("ownership_schema_ready") is True, ready
    assert ready.get("schema_optimization_ready") is True, ready
    assert EXPECTED_MIGRATION_HEAD in ready.get("migration_heads", []), ready

    status_response, status = _get_json(
        base_url,
        "/api/v1/system/status",
    )
    assert status_response.status_code == 200, status_response.text
    assert status.get("status") in {"operational", "healthy", "ready"}, status

    version_response, version = _get_json(
        base_url,
        "/api/v1/system/version",
    )
    assert version_response.status_code == 200, version_response.text
    assert version.get("current_version") == "v1", version

    print("Phase 5B container runtime verification passed.")
    print(
        json.dumps(
            {
                "database": ready.get("database_dialect"),
                "migration_heads": ready.get("migration_heads"),
                "api_version": version.get("current_version"),
            },
            indent=2,
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Verify the running Phase 5B container stack."
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
    )
    args = parser.parse_args()

    try:
        verify(args.base_url)
    except (AssertionError, requests.RequestException) as exc:
        print(f"Phase 5B runtime verification failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from None


if __name__ == "__main__":
    main()
