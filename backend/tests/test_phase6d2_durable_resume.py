from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from tests.support import bearer, register_user


def _create_approval_gated_run(
    client: TestClient,
    headers: dict[str, str],
    *,
    rejection_policy: str = "skip_and_continue",
) -> dict:
    response = client.post(
        "/api/v1/agent-runs/",
        headers=headers,
        json={
            "goal": "Prepare and send a recruiter follow-up while planning interview study",
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
                        "rejection_policy": rejection_policy,
                        "expires_in_minutes": 60,
                    }
                }
            },
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.integration
def test_execution_pauses_and_resumes_after_approval(
    client: TestClient,
) -> None:
    user = register_user(
        client,
        email="phase6d2-approve@example.com",
        full_name="Phase 6D2 Approve",
    )
    headers = bearer(user["access_token"])
    run = _create_approval_gated_run(client, headers)

    paused = client.post(
        f"/api/v1/agent-runs/{run['id']}/execute",
        headers=headers,
        json={"provider": "deterministic"},
    )
    assert paused.status_code == 200, paused.text
    assert paused.json()["status"] == "awaiting_approval"
    assert any(
        item["status"] == "awaiting_approval"
        for item in paused.json()["steps"]
    )

    approvals = client.get(
        f"/api/v1/approvals/?agent_run_id={run['id']}",
        headers=headers,
    )
    assert approvals.status_code == 200
    items = approvals.json()
    if isinstance(items, dict):
        items = items["items"]
    assert len(items) == 1
    approval_id = items[0]["id"]

    # A fresh request proves the paused state is persisted independently of
    # the original execute call.
    persisted = client.get(
        f"/api/v1/agent-runs/{run['id']}",
        headers=headers,
    )
    assert persisted.json()["status"] == "awaiting_approval"

    premature = client.post(
        f"/api/v1/agent-runs/{run['id']}/resume",
        headers=headers,
    )
    assert premature.status_code == 409
    assert premature.json()["error"]["code"] == "APPROVAL_DECISION_REQUIRED"

    approved = client.post(
        f"/api/v1/approvals/{approval_id}/approve",
        headers=headers,
        json={"decision_note": "Approved for the test workflow."},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"

    resumed = client.post(
        f"/api/v1/agent-runs/{run['id']}/resume",
        headers=headers,
    )
    assert resumed.status_code == 200, resumed.text
    assert resumed.json()["status"] == "completed"

    duplicate = client.post(
        f"/api/v1/agent-runs/{run['id']}/resume",
        headers=headers,
    )
    assert duplicate.status_code == 409

    timeline = client.get(
        f"/api/v1/agent-runs/{run['id']}/timeline",
        headers=headers,
    )
    assert timeline.status_code == 200
    event_types = [item["event_type"] for item in timeline.json()]
    for expected in (
        "approval_requested",
        "workflow_paused",
        "approval_approved",
        "workflow_resumed",
        "workflow_completed",
    ):
        assert expected in event_types


@pytest.mark.integration
def test_rejection_can_skip_and_continue_or_stop(
    client: TestClient,
) -> None:
    user = register_user(
        client,
        email="phase6d2-reject@example.com",
        full_name="Phase 6D2 Reject",
    )
    headers = bearer(user["access_token"])

    skip_run = _create_approval_gated_run(client, headers)
    paused = client.post(
        f"/api/v1/agent-runs/{skip_run['id']}/execute",
        headers=headers,
        json={"provider": "deterministic"},
    )
    assert paused.json()["status"] == "awaiting_approval"
    approvals = client.get(
        f"/api/v1/approvals/?agent_run_id={skip_run['id']}",
        headers=headers,
    ).json()
    if isinstance(approvals, dict):
        approvals = approvals["items"]
    approval_id = approvals[0]["id"]
    client.post(
        f"/api/v1/approvals/{approval_id}/reject",
        headers=headers,
        json={"decision_note": "Do not send this email."},
    )
    resumed = client.post(
        f"/api/v1/agent-runs/{skip_run['id']}/resume",
        headers=headers,
    )
    assert resumed.status_code == 200, resumed.text
    assert resumed.json()["status"] == "completed"
    statuses = {item["agent_name"]: item["status"] for item in resumed.json()["steps"]}
    assert statuses["career"] == "skipped"
    assert statuses["learning"] == "completed"

    stop_run = _create_approval_gated_run(
        client,
        headers,
        rejection_policy="stop_workflow",
    )
    client.post(
        f"/api/v1/agent-runs/{stop_run['id']}/execute",
        headers=headers,
        json={"provider": "deterministic"},
    )
    approvals = client.get(
        f"/api/v1/approvals/?agent_run_id={stop_run['id']}",
        headers=headers,
    ).json()
    if isinstance(approvals, dict):
        approvals = approvals["items"]
    approval_id = approvals[0]["id"]
    client.post(
        f"/api/v1/approvals/{approval_id}/reject",
        headers=headers,
        json={"decision_note": "Stop this workflow."},
    )
    stopped = client.post(
        f"/api/v1/agent-runs/{stop_run['id']}/resume",
        headers=headers,
    )
    assert stopped.status_code == 200
    assert stopped.json()["status"] == "cancelled"


@pytest.mark.integration
def test_resume_preserves_user_isolation(
    client: TestClient,
) -> None:
    owner = register_user(
        client,
        email="phase6d2-owner@example.com",
        full_name="Phase 6D2 Owner",
    )
    other = register_user(
        client,
        email="phase6d2-other@example.com",
        full_name="Phase 6D2 Other",
    )
    owner_headers = bearer(owner["access_token"])
    other_headers = bearer(other["access_token"])

    run = _create_approval_gated_run(client, owner_headers)
    client.post(
        f"/api/v1/agent-runs/{run['id']}/execute",
        headers=owner_headers,
        json={"provider": "deterministic"},
    )

    blocked_resume = client.post(
        f"/api/v1/agent-runs/{run['id']}/resume",
        headers=other_headers,
    )
    assert blocked_resume.status_code == 404

    blocked_timeline = client.get(
        f"/api/v1/agent-runs/{run['id']}/timeline",
        headers=other_headers,
    )
    assert blocked_timeline.status_code == 404


def test_production_schema_verifier_registers_phase6d2_models() -> None:
    """Exercise the PostgreSQL CI mapper check in a clean Python process."""

    root = Path(__file__).resolve().parents[2]
    backend = root / "backend"
    environment = os.environ.copy()
    environment.update(
        {
            "ENVIRONMENT": "test",
            "DATABASE_URL": "sqlite:///./.test_artifacts/phase6d2-mapper.db",
            "AUTO_CREATE_TABLES": "false",
            "JWT_SECRET_KEY": (
                "phase6d2-mapper-secret-0123456789abcdef-0123456789abcdef"
            ),
            "OPENAI_API_KEY": "",
            "AUTH_COOKIE_SECURE": "false",
        }
    )

    result = subprocess.run(
        [
            sys.executable,
            "-c",
            (
                "from app.migrations.phase3c_verify_schema import "
                "_verify_relationships; "
                "_verify_relationships(); "
                "print('Phase 6D2 mapper registration passed.')"
            ),
        ],
        cwd=backend,
        env=environment,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )

    assert result.returncode == 0, result.stdout + result.stderr


def test_phase6d2_contract_files_and_version_are_current() -> None:
    root = Path(__file__).resolve().parents[2]
    assert (root / "VERSION").read_text(encoding="utf-8").strip() == "0.6.7"
    assert (
        root
        / "backend/alembic/versions/20260813_0007_add_durable_workflow_checkpoints.py"
    ).is_file()
    route_text = (
        root / "backend/app/routes/agent_runs.py"
    ).read_text(encoding="utf-8")
    assert '"/{run_id}/resume"' in route_text
    assert '"/{run_id}/timeline"' in route_text
    manifest = (
        root / "scripts/release/render_release_manifest.py"
    ).read_text(encoding="utf-8")
    assert '"alembic_head": "20260823_0008"' in manifest
