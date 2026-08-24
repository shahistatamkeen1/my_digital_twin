from __future__ import annotations

import argparse
import time
import uuid

import requests

from app.database import SessionLocal
from app.models.user import User


PASSWORD = "Phase6D4-Test-Password-2026"


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
    email = f"phase6d4-{suffix}@example.com"
    try:
        ready = requests.get(f"{base_url}/ready", timeout=20)
        ready.raise_for_status()
        assert "20260823_0008" in ready.json().get("migration_heads", [])

        registered = requests.post(
            f"{base_url}/api/v1/auth/register",
            json={
                "email": email,
                "full_name": "Phase 6D4 Runtime",
                "password": PASSWORD,
            },
            timeout=20,
        )
        registered.raise_for_status()
        headers = {
            "Authorization": f"Bearer {registered.json()['access_token']}"
        }

        run = requests.post(
            f"{base_url}/api/v1/agent-runs/",
            headers=headers,
            json={"goal": "Prepare a controlled runtime verification action"},
            timeout=20,
        )
        run.raise_for_status()

        approval = requests.post(
            f"{base_url}/api/v1/approvals/",
            headers=headers,
            json={
                "agent_run_id": run.json()["id"],
                "action_type": "external_action",
                "action_summary": "Perform the runtime verification action",
                "proposed_payload": {"verification": True},
            },
            timeout=20,
        )
        approval.raise_for_status()

        approved = requests.post(
            f"{base_url}/api/v1/approvals/{approval.json()['id']}/approve",
            headers=headers,
            json={"decision_note": "Runtime verification approval."},
            timeout=20,
        )
        approved.raise_for_status()

        outbox = requests.get(
            f"{base_url}/api/v1/action-outbox/",
            headers=headers,
            timeout=20,
        )
        outbox.raise_for_status()
        body = outbox.json()
        items = body["items"] if isinstance(body, dict) else body
        assert len(items) == 1
        assert items[0]["status"] == "queued"

        dispatched = requests.post(
            f"{base_url}/api/v1/action-outbox/{items[0]['id']}/dispatch",
            headers=headers,
            timeout=20,
        )
        dispatched.raise_for_status()
        assert dispatched.json()["status"] == "succeeded"
        assert dispatched.json()["result_payload"]["delivery_status"] == "simulated"

        repeated = requests.post(
            f"{base_url}/api/v1/action-outbox/{items[0]['id']}/dispatch",
            headers=headers,
            timeout=20,
        )
        repeated.raise_for_status()
        assert repeated.json()["attempt_count"] == 1

        print("Phase 6D4 live Action Outbox verification passed.")
        print("Approval enqueue, ownership, dry-run dispatch, receipt, and idempotency passed.")
    finally:
        _cleanup(email)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    verify(args.base_url.rstrip("/"))


if __name__ == "__main__":
    main()
