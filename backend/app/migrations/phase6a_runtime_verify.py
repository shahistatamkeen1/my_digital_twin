from __future__ import annotations

import argparse
import time
import uuid

import requests

from app.database import SessionLocal
from app.models.agent_run import AgentRun
from app.models.user import User


# Test-only credential that satisfies the application's registration policy:
# at least one uppercase letter, one lowercase letter, and one number.
PASSWORD = "Phase6A-Test-Password-2026"


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


def _mark_failed(run_id: int) -> None:
    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        db.execute(
            AgentRun.__table__.update()
            .where(AgentRun.__table__.c.id == run_id)
            .values(status="failed", error_message="Phase 6A verifier failure")
        )
        db.commit()
    finally:
        db.close()


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
        f"phase6a-a-{suffix}@example.com",
        f"phase6a-b-{suffix}@example.com",
    ]

    try:
        ready = requests.get(f"{base_url}/ready", timeout=20)
        ready.raise_for_status()
        assert "20260729_0004" in ready.json().get("migration_heads", [])

        user_a = _register(base_url, emails[0], "Phase 6A Runtime A")
        user_b = _register(base_url, emails[1], "Phase 6A Runtime B")
        headers_a = _headers(user_a)
        headers_b = _headers(user_b)

        registry = requests.get(
            f"{base_url}/api/v1/agents/",
            headers=headers_a,
            timeout=20,
        )
        registry.raise_for_status()
        assert [item["name"] for item in registry.json()] == [
            "career",
            "finance",
            "health",
            "learning",
        ]

        created = requests.post(
            f"{base_url}/api/v1/agent-runs/",
            headers=headers_a,
            json={
                "goal": "Prepare for an AI Engineer role while saving for relocation",
                "preferred_agents": [],
                "include_weekly_plan": True,
                "context": {"verification": "phase6a"},
            },
            timeout=20,
        )
        created.raise_for_status()
        run = created.json()
        run_id = int(run["id"])
        assert run["selected_agents"] == ["career", "finance", "learning"]
        assert len(run["steps"]) == 3

        blocked = requests.get(
            f"{base_url}/api/v1/agent-runs/{run_id}",
            headers=headers_b,
            timeout=20,
        )
        assert blocked.status_code == 404

        _mark_failed(run_id)
        retried = requests.post(
            f"{base_url}/api/v1/agent-runs/{run_id}/retry",
            headers=headers_a,
            timeout=20,
        )
        retried.raise_for_status()
        assert retried.json()["retry_of_run_id"] == run_id

        paged = requests.get(
            f"{base_url}/api/v1/agent-runs/?page=1&page_size=10",
            headers=headers_a,
            timeout=20,
        )
        paged.raise_for_status()
        assert paged.json()["pagination"]["total_items"] == 2

        print("Phase 6A live agent-orchestration verification passed.")
        print("Registry, routing, persistence, retry, pagination, and isolation passed.")
    finally:
        _cleanup_users(emails)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    verify(args.base_url.rstrip("/"))


if __name__ == "__main__":
    main()
