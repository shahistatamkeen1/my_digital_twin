from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.models.agent_approval import AgentApproval, AgentApprovalEvent
from app.models.common import utc_now
from tests.support import bearer, register_user


def _create_run(client: TestClient, headers: dict[str, str], goal: str) -> dict:
    response = client.post(
        "/api/v1/agent-runs/",
        headers=headers,
        json={"goal": goal},
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.integration
def test_approval_lifecycle_audit_and_user_isolation(
    client: TestClient,
) -> None:
    owner = register_user(
        client,
        email="phase6d-owner@example.com",
        full_name="Phase 6D Owner",
    )
    other = register_user(
        client,
        email="phase6d-other@example.com",
        full_name="Phase 6D Other",
    )
    owner_headers = bearer(owner["access_token"])
    other_headers = bearer(other["access_token"])

    run = _create_run(
        client,
        owner_headers,
        "Prepare an application follow-up and interview plan",
    )
    run_id = run["id"]
    step_id = run["steps"][0]["id"]

    created = client.post(
        "/api/v1/approvals/",
        headers=owner_headers,
        json={
            "agent_run_id": run_id,
            "agent_step_id": step_id,
            "action_type": "send_email",
            "action_summary": "Send the prepared recruiter follow-up email",
            "proposed_payload": {
                "recipient": "recruiter@example.test",
                "subject": "Application follow-up",
            },
            "expires_in_minutes": 60,
        },
    )
    assert created.status_code == 201, created.text
    approval = created.json()
    approval_id = approval["id"]
    assert approval["status"] == "pending"
    assert approval["agent_run_id"] == run_id
    assert approval["agent_step_id"] == step_id
    assert approval["events"][0]["event_type"] == "requested"
    assert approval["events"][0]["new_status"] == "pending"

    duplicate = client.post(
        "/api/v1/approvals/",
        headers=owner_headers,
        json={
            "agent_run_id": run_id,
            "agent_step_id": step_id,
            "action_type": "send_email",
            "action_summary": "Send the same prepared follow-up email",
        },
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "APPROVAL_ALREADY_PENDING"

    assert client.get("/api/v1/approvals/", headers=other_headers).json() == []
    blocked_read = client.get(
        f"/api/v1/approvals/{approval_id}",
        headers=other_headers,
    )
    assert blocked_read.status_code == 404
    assert blocked_read.json()["error"]["code"] == "AGENT_APPROVAL_NOT_FOUND"

    blocked_decision = client.post(
        f"/api/v1/approvals/{approval_id}/approve",
        headers=other_headers,
        json={"decision_note": "Should not be allowed"},
    )
    assert blocked_decision.status_code == 404

    legacy_list = client.get("/api/v1/approvals/", headers=owner_headers)
    assert legacy_list.status_code == 200
    assert len(legacy_list.json()) == 1
    assert legacy_list.headers["X-Pagination-Mode"] == "legacy"

    paged = client.get(
        "/api/v1/approvals/?page=1&page_size=10&status=pending&search=recruiter",
        headers=owner_headers,
    )
    assert paged.status_code == 200
    assert paged.json()["pagination"]["total_items"] == 1

    approved = client.post(
        f"/api/v1/approvals/{approval_id}/approve",
        headers=owner_headers,
        json={
            "decision_note": "Approved after reviewing the recipient.",
            "decision_payload": {
                "recipient": "reviewed-recipient@example.test",
                "subject": "Application follow-up",
            },
        },
    )
    assert approved.status_code == 200, approved.text
    approved_payload = approved.json()
    assert approved_payload["status"] == "approved"
    assert approved_payload["proposed_payload"]["recipient"] == (
        "recruiter@example.test"
    )
    assert approved_payload["decision_payload"]["recipient"] == (
        "reviewed-recipient@example.test"
    )
    assert [event["event_type"] for event in approved_payload["events"]] == [
        "requested",
        "approved",
    ]

    second_decision = client.post(
        f"/api/v1/approvals/{approval_id}/reject",
        headers=owner_headers,
        json={"decision_note": "Too late"},
    )
    assert second_decision.status_code == 409
    assert second_decision.json()["error"]["code"] == "APPROVAL_NOT_PENDING"

    reject_run = _create_run(
        client,
        owner_headers,
        "Prepare a calendar plan for technical interview practice",
    )
    rejected_created = client.post(
        "/api/v1/approvals/",
        headers=owner_headers,
        json={
            "agent_run_id": reject_run["id"],
            "action_type": "create_calendar_event",
            "action_summary": "Create five interview practice calendar events",
        },
    )
    rejected_id = rejected_created.json()["id"]
    rejected = client.post(
        f"/api/v1/approvals/{rejected_id}/reject",
        headers=owner_headers,
        json={"decision_note": "Use a different schedule."},
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"

    cancel_run = _create_run(
        client,
        owner_headers,
        "Review and remove an obsolete test record",
    )
    cancelled_created = client.post(
        "/api/v1/approvals/",
        headers=owner_headers,
        json={
            "agent_run_id": cancel_run["id"],
            "action_type": "delete_data",
            "action_summary": "Delete the obsolete test record",
        },
    )
    cancelled_id = cancelled_created.json()["id"]
    cancelled = client.post(
        f"/api/v1/approvals/{cancelled_id}/cancel",
        headers=owner_headers,
        json={"decision_note": "Action is no longer required."},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["approval"]["status"] == "cancelled"

    expire_run = _create_run(
        client,
        owner_headers,
        "Prepare one external verification action",
    )
    expired_created = client.post(
        "/api/v1/approvals/",
        headers=owner_headers,
        json={
            "agent_run_id": expire_run["id"],
            "action_type": "external_action",
            "action_summary": "Perform the external verification action",
            "expires_in_minutes": 5,
        },
    )
    expired_id = expired_created.json()["id"]

    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        db.execute(
            AgentApproval.__table__.update()
            .where(AgentApproval.__table__.c.id == expired_id)
            .values(expires_at=utc_now() - timedelta(minutes=1))
        )
        db.commit()
    finally:
        db.close()

    expired = client.get(
        f"/api/v1/approvals/{expired_id}",
        headers=owner_headers,
    )
    assert expired.status_code == 200
    assert expired.json()["status"] == "expired"
    assert expired.json()["events"][-1]["event_type"] == "expired"

    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        owner_id = owner["user"]["id"]
        approvals = db.query(AgentApproval).all()
        events = db.query(AgentApprovalEvent).all()
        assert len(approvals) == 4
        assert all(item.user_id == owner_id for item in approvals)
        assert all(item.user_id == owner_id for item in events)
        assert len(events) == 8
    finally:
        db.close()


@pytest.mark.integration
def test_approval_rejects_mismatched_step_and_terminal_run(
    client: TestClient,
) -> None:
    user = register_user(
        client,
        email="phase6d-validation@example.com",
        full_name="Phase 6D Validation",
    )
    headers = bearer(user["access_token"])

    run_a = _create_run(client, headers, "Prepare a career email")
    run_b = _create_run(client, headers, "Prepare a learning schedule")

    mismatch = client.post(
        "/api/v1/approvals/",
        headers=headers,
        json={
            "agent_run_id": run_a["id"],
            "agent_step_id": run_b["steps"][0]["id"],
            "action_type": "send_email",
            "action_summary": "Send the prepared career email",
        },
    )
    assert mismatch.status_code == 404
    assert mismatch.json()["error"]["code"] == "AGENT_STEP_NOT_FOUND"

    from app.models.agent_run import AgentRun

    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        db.execute(
            AgentRun.__table__.update()
            .where(AgentRun.__table__.c.id == run_a["id"])
            .values(status="completed")
        )
        db.commit()
    finally:
        db.close()

    terminal = client.post(
        "/api/v1/approvals/",
        headers=headers,
        json={
            "agent_run_id": run_a["id"],
            "action_type": "external_action",
            "action_summary": "Perform a terminal-run action",
        },
    )
    assert terminal.status_code == 409
    assert terminal.json()["error"]["code"] == "APPROVAL_RUN_TERMINAL"


def test_phase6d1_contract_files_and_version_are_current() -> None:
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    assert (root / "VERSION").read_text(encoding="utf-8").strip() == "0.6.3"
    assert (
        root
        / "backend/alembic/versions/20260806_0006_add_agent_approval_foundation.py"
    ).is_file()
    assert (root / "docs/AGENT_APPROVALS.md").is_file()

    main_text = (root / "backend/main.py").read_text(encoding="utf-8")
    assert '"/api/approvals"' in main_text

    route_text = (
        root / "backend/app/routes/agent_approvals.py"
    ).read_text(encoding="utf-8")
    for token in (
        '"/{approval_id}/approve"',
        '"/{approval_id}/reject"',
        '"/{approval_id}/cancel"',
    ):
        assert token in route_text

    manifest = (
        root / "scripts/release/render_release_manifest.py"
    ).read_text(encoding="utf-8")
    assert '"alembic_head": "20260806_0006"' in manifest
