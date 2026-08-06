from __future__ import annotations

import argparse
import time
import uuid

import requests

from app.database import SessionLocal
from app.models.user import User


PASSWORD = "Phase6B-Test-Password-2026"


def _register(base_url: str, email: str, full_name: str) -> dict:
    response = requests.post(
        f"{base_url}/api/v1/auth/register",
        json={
            "email": email,
            "full_name": full_name,
            "password": PASSWORD,
        },
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def _headers(payload: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {payload['access_token']}"}


def _cleanup_users(emails: list[str]) -> None:
    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        db.execute(User.__table__.delete().where(User.__table__.c.email.in_(emails)))
        db.commit()
    finally:
        db.close()


def verify(base_url: str) -> None:
    suffix = f"{int(time.time())}-{uuid.uuid4().hex[:8]}"
    emails = [
        f"phase6b-a-{suffix}@example.com",
        f"phase6b-b-{suffix}@example.com",
    ]

    try:
        ready = requests.get(f"{base_url}/ready", timeout=20)
        ready.raise_for_status()
        assert "20260806_0006" in ready.json().get("migration_heads", [])

        user_a = _register(base_url, emails[0], "Phase 6B Runtime A")
        user_b = _register(base_url, emails[1], "Phase 6B Runtime B")
        headers_a = _headers(user_a)
        headers_b = _headers(user_b)

        created = requests.post(
            f"{base_url}/api/v1/agent-runs/",
            headers=headers_a,
            json={
                "goal": "Prepare for an AI Engineer role while saving for relocation",
                "include_weekly_plan": True,
                "context": {"verification": "phase6b"},
            },
            timeout=20,
        )
        created.raise_for_status()
        run_id = int(created.json()["id"])

        blocked = requests.post(
            f"{base_url}/api/v1/agent-runs/{run_id}/execute",
            headers=headers_b,
            json={"provider": "deterministic"},
            timeout=20,
        )
        assert blocked.status_code == 404

        executed = requests.post(
            f"{base_url}/api/v1/agent-runs/{run_id}/execute",
            headers=headers_a,
            json={
                "provider": "deterministic",
                "allow_partial": True,
                "allow_fallback": False,
            },
            timeout=60,
        )
        executed.raise_for_status()
        payload = executed.json()
        assert payload["status"] == "completed"
        assert payload["execution_provider"] == "deterministic"
        assert all(step["status"] == "completed" for step in payload["steps"])
        assert payload["result_payload"]["unified_plan"]["priorities"]

        planned = requests.post(
            f"{base_url}/api/v1/agent-runs/",
            headers=headers_a,
            json={"goal": "Create a better sleep routine"},
            timeout=20,
        )
        planned.raise_for_status()
        cancel_id = int(planned.json()["id"])

        cancelled = requests.post(
            f"{base_url}/api/v1/agent-runs/{cancel_id}/cancel",
            headers=headers_a,
            timeout=20,
        )
        cancelled.raise_for_status()
        assert cancelled.json()["run"]["status"] == "cancelled"

        print("Phase 6B live agent-execution verification passed.")
        print(
            "Execution, synthesis, cancellation, persistence, and isolation passed."
        )
    finally:
        _cleanup_users(emails)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    verify(args.base_url.rstrip("/"))


if __name__ == "__main__":
    main()
