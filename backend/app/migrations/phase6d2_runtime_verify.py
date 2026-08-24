from __future__ import annotations

import argparse
import time
import uuid

import requests

from app.database import SessionLocal
from app.models.user import User


PASSWORD = "Phase6D2-Test-Password-2026"


def _register(base_url: str, email: str) -> dict:
    response = requests.post(
        f"{base_url}/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Phase 6D2 Runtime",
            "password": PASSWORD,
        },
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def _headers(payload: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {payload['access_token']}"}


def _cleanup(email: str) -> None:
    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        db.execute(User.__table__.delete().where(User.__table__.c.email == email))
        db.commit()
    finally:
        db.close()


def verify(base_url: str) -> None:
    suffix = f"{int(time.time())}-{uuid.uuid4().hex[:8]}"
    email = f"phase6d2-{suffix}@example.com"
    try:
        ready = requests.get(f"{base_url}/ready", timeout=20)
        ready.raise_for_status()
        assert "20260823_0008" in ready.json().get("migration_heads", [])

        user = _register(base_url, email)
        headers = _headers(user)

        created = requests.post(
            f"{base_url}/api/v1/agent-runs/",
            headers=headers,
            json={
                "goal": "Prepare a recruiter follow-up and an interview learning plan",
                "preferred_agents": ["career", "learning"],
                "context": {
                    "approval_actions": {
                        "career": {
                            "action_type": "send_email",
                            "action_summary": "Send the prepared recruiter follow-up email",
                            "proposed_payload": {
                                "recipient": "recruiter@example.com",
                                "subject": "Application follow-up",
                            },
                            "rejection_policy": "skip_and_continue",
                            "expires_in_minutes": 60,
                        }
                    }
                },
            },
            timeout=20,
        )
        created.raise_for_status()
        run_id = created.json()["id"]

        paused = requests.post(
            f"{base_url}/api/v1/agent-runs/{run_id}/execute",
            headers=headers,
            json={"provider": "deterministic"},
            timeout=20,
        )
        paused.raise_for_status()
        assert paused.json()["status"] == "awaiting_approval"

        approvals = requests.get(
            f"{base_url}/api/v1/approvals/?agent_run_id={run_id}",
            headers=headers,
            timeout=20,
        )
        approvals.raise_for_status()
        body = approvals.json()
        items = body["items"] if isinstance(body, dict) else body
        assert len(items) == 1
        approval_id = items[0]["id"]

        approved = requests.post(
            f"{base_url}/api/v1/approvals/{approval_id}/approve",
            headers=headers,
            json={"decision_note": "Runtime verification approval."},
            timeout=20,
        )
        approved.raise_for_status()

        resumed = requests.post(
            f"{base_url}/api/v1/agent-runs/{run_id}/resume",
            headers=headers,
            timeout=30,
        )
        resumed.raise_for_status()
        assert resumed.json()["status"] == "completed"

        timeline = requests.get(
            f"{base_url}/api/v1/agent-runs/{run_id}/timeline",
            headers=headers,
            timeout=20,
        )
        timeline.raise_for_status()
        events = {item["event_type"] for item in timeline.json()}
        assert {
            "approval_requested",
            "workflow_paused",
            "approval_approved",
            "workflow_resumed",
            "workflow_completed",
        }.issubset(events)

        duplicate = requests.post(
            f"{base_url}/api/v1/agent-runs/{run_id}/resume",
            headers=headers,
            timeout=20,
        )
        assert duplicate.status_code == 409

        print("Phase 6D2 live durable-resume verification passed.")
        print("Pause, approval, checkpoint persistence, resume, timeline, and idempotency passed.")
    finally:
        _cleanup(email)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    verify(args.base_url.rstrip("/"))


if __name__ == "__main__":
    main()
