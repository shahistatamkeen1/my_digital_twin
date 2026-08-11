from __future__ import annotations

import argparse
import time
import uuid

import requests

from app.database import SessionLocal
from app.models.user import User


PASSWORD = "Phase6D-Test-Password-2026"


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
        f"phase6d-a-{suffix}@example.com",
        f"phase6d-b-{suffix}@example.com",
    ]

    try:
        ready = requests.get(f"{base_url}/ready", timeout=20)
        ready.raise_for_status()
        assert "20260806_0006" in ready.json().get("migration_heads", [])

        owner = _register(base_url, emails[0], "Phase 6D Runtime Owner")
        other = _register(base_url, emails[1], "Phase 6D Runtime Other")
        owner_headers = _headers(owner)
        other_headers = _headers(other)

        run = requests.post(
            f"{base_url}/api/v1/agent-runs/",
            headers=owner_headers,
            json={"goal": "Prepare a recruiter follow-up email"},
            timeout=20,
        )
        run.raise_for_status()
        run_payload = run.json()

        created = requests.post(
            f"{base_url}/api/v1/approvals/",
            headers=owner_headers,
            json={
                "agent_run_id": run_payload["id"],
                "agent_step_id": run_payload["steps"][0]["id"],
                "action_type": "send_email",
                "action_summary": "Send the prepared recruiter follow-up email",
                "proposed_payload": {
                    "recipient": "runtime-recipient@example.test",
                },
                "expires_in_minutes": 60,
            },
            timeout=20,
        )
        created.raise_for_status()
        approval_id = int(created.json()["id"])

        blocked = requests.get(
            f"{base_url}/api/v1/approvals/{approval_id}",
            headers=other_headers,
            timeout=20,
        )
        assert blocked.status_code == 404

        approved = requests.post(
            f"{base_url}/api/v1/approvals/{approval_id}/approve",
            headers=owner_headers,
            json={"decision_note": "Runtime verification approved."},
            timeout=20,
        )
        approved.raise_for_status()
        payload = approved.json()
        assert payload["status"] == "approved"
        assert [event["event_type"] for event in payload["events"]] == [
            "requested",
            "approved",
        ]

        listed = requests.get(
            f"{base_url}/api/v1/approvals/?page=1&page_size=10&status=approved",
            headers=owner_headers,
            timeout=20,
        )
        listed.raise_for_status()
        assert listed.json()["pagination"]["total_items"] == 1

        print("Phase 6D1 live approval verification passed.")
        print("Persistence, decisions, audit history, pagination, and isolation passed.")
    finally:
        _cleanup_users(emails)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    verify(args.base_url.rstrip("/"))


if __name__ == "__main__":
    main()
