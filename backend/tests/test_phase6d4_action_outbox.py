from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.models.agent_action_outbox import (
    AgentActionOutbox,
    AgentActionOutboxEvent,
)
from tests.support import bearer, register_user


def _create_approval(
    client: TestClient,
    headers: dict[str, str],
    *,
    goal: str = "Prepare an approved external action",
    action_type: str = "send_email",
) -> dict:
    run_response = client.post(
        "/api/v1/agent-runs/",
        headers=headers,
        json={"goal": goal},
    )
    assert run_response.status_code == 201, run_response.text
    run = run_response.json()

    approval_response = client.post(
        "/api/v1/approvals/",
        headers=headers,
        json={
            "agent_run_id": run["id"],
            "agent_step_id": run["steps"][0]["id"],
            "action_type": action_type,
            "action_summary": "Send the approved test follow-up email",
            "proposed_payload": {
                "recipient": "original@example.test",
                "subject": "Test follow-up",
            },
        },
    )
    assert approval_response.status_code == 201, approval_response.text
    return approval_response.json()


@pytest.mark.integration
def test_approved_action_is_atomically_queued_and_idempotently_dispatched(
    client: TestClient,
) -> None:
    owner = register_user(
        client,
        email="phase6d4-owner@example.com",
        full_name="Phase 6D4 Owner",
    )
    other = register_user(
        client,
        email="phase6d4-other@example.com",
        full_name="Phase 6D4 Other",
    )
    owner_headers = bearer(owner["access_token"])
    other_headers = bearer(other["access_token"])

    approval = _create_approval(client, owner_headers)
    approved_response = client.post(
        f"/api/v1/approvals/{approval['id']}/approve",
        headers=owner_headers,
        json={
            "decision_note": "Recipient reviewed.",
            "decision_payload": {
                "recipient": "reviewed@example.test",
                "subject": "Test follow-up",
            },
        },
    )
    assert approved_response.status_code == 200, approved_response.text

    listed = client.get(
        "/api/v1/action-outbox/?page=1&page_size=10&status=queued",
        headers=owner_headers,
    )
    assert listed.status_code == 200, listed.text
    assert listed.json()["pagination"]["total_items"] == 1
    entry = listed.json()["items"][0]
    assert entry["approval_id"] == approval["id"]
    assert entry["execution_payload"]["recipient"] == "reviewed@example.test"
    assert entry["execution_mode"] == "dry_run"
    assert entry["attempt_count"] == 0

    assert client.get(
        "/api/v1/action-outbox/",
        headers=other_headers,
    ).json() == []
    blocked = client.get(
        f"/api/v1/action-outbox/{entry['id']}",
        headers=other_headers,
    )
    assert blocked.status_code == 404

    duplicate_enqueue = client.post(
        f"/api/v1/action-outbox/approvals/{approval['id']}/enqueue",
        headers=owner_headers,
    )
    assert duplicate_enqueue.status_code == 201
    assert duplicate_enqueue.json()["id"] == entry["id"]

    dispatched = client.post(
        f"/api/v1/action-outbox/{entry['id']}/dispatch",
        headers=owner_headers,
    )
    assert dispatched.status_code == 200, dispatched.text
    completed = dispatched.json()
    assert completed["status"] == "succeeded"
    assert completed["attempt_count"] == 1
    assert completed["result_payload"]["delivery_status"] == "simulated"
    assert completed["result_payload"]["execution_mode"] == "dry_run"
    event_types = [event["event_type"] for event in completed["events"]]
    assert event_types == ["queued", "dispatch_started", "dispatch_succeeded"]

    repeated = client.post(
        f"/api/v1/action-outbox/{entry['id']}/dispatch",
        headers=owner_headers,
    )
    assert repeated.status_code == 200
    assert repeated.json()["attempt_count"] == 1
    assert len(repeated.json()["events"]) == 3

    cannot_cancel = client.post(
        f"/api/v1/action-outbox/{entry['id']}/cancel",
        headers=owner_headers,
        json={"reason": "Too late"},
    )
    assert cannot_cancel.status_code == 409
    assert cannot_cancel.json()["error"]["code"] == (
        "ACTION_OUTBOX_NOT_CANCELLABLE"
    )


@pytest.mark.integration
def test_failed_action_can_retry_and_queued_action_can_cancel(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user = register_user(
        client,
        email="phase6d4-retry@example.com",
        full_name="Phase 6D4 Retry",
    )
    headers = bearer(user["access_token"])

    approval = _create_approval(client, headers)
    client.post(
        f"/api/v1/approvals/{approval['id']}/approve",
        headers=headers,
        json={},
    )
    entries = client.get(
        "/api/v1/action-outbox/",
        headers=headers,
    ).json()
    entry = entries[0]

    from app.services import agent_action_outbox_service as service

    original_dispatch = service._dispatch_dry_run

    def fail_dispatch(_entry):
        raise RuntimeError("Synthetic adapter failure")

    monkeypatch.setattr(service, "_dispatch_dry_run", fail_dispatch)
    failed = client.post(
        f"/api/v1/action-outbox/{entry['id']}/dispatch",
        headers=headers,
    )
    assert failed.status_code == 200
    assert failed.json()["status"] == "failed"
    assert "Synthetic adapter failure" in failed.json()["last_error"]

    retried = client.post(
        f"/api/v1/action-outbox/{entry['id']}/retry",
        headers=headers,
    )
    assert retried.status_code == 200
    assert retried.json()["status"] == "queued"

    monkeypatch.setattr(service, "_dispatch_dry_run", original_dispatch)
    succeeded = client.post(
        f"/api/v1/action-outbox/{entry['id']}/dispatch",
        headers=headers,
    )
    assert succeeded.status_code == 200
    assert succeeded.json()["status"] == "succeeded"
    assert succeeded.json()["attempt_count"] == 2
    assert [event["event_type"] for event in succeeded.json()["events"]] == [
        "queued",
        "dispatch_started",
        "dispatch_failed",
        "retry_scheduled",
        "dispatch_started",
        "dispatch_succeeded",
    ]

    cancellable_approval = _create_approval(
        client,
        headers,
        goal="Prepare a second controlled action",
        action_type="external_action",
    )
    client.post(
        f"/api/v1/approvals/{cancellable_approval['id']}/approve",
        headers=headers,
        json={},
    )
    entries = client.get(
        "/api/v1/action-outbox/?status=queued",
        headers=headers,
    ).json()
    assert len(entries) == 1
    cancelled = client.post(
        f"/api/v1/action-outbox/{entries[0]['id']}/cancel",
        headers=headers,
        json={"reason": "User changed direction."},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert cancelled.json()["events"][-1]["event_type"] == "cancelled"


@pytest.mark.integration
def test_rejected_actions_are_not_queued_and_batch_dispatch_is_bounded(
    client: TestClient,
) -> None:
    user = register_user(
        client,
        email="phase6d4-batch@example.com",
        full_name="Phase 6D4 Batch",
    )
    headers = bearer(user["access_token"])

    rejected = _create_approval(client, headers, goal="Reject this action")
    client.post(
        f"/api/v1/approvals/{rejected['id']}/reject",
        headers=headers,
        json={"decision_note": "Not approved."},
    )
    assert client.get(
        "/api/v1/action-outbox/",
        headers=headers,
    ).json() == []

    for index in range(2):
        approval = _create_approval(
            client,
            headers,
            goal=f"Prepare batch action {index}",
        )
        client.post(
            f"/api/v1/approvals/{approval['id']}/approve",
            headers=headers,
            json={},
        )

    first_batch = client.post(
        "/api/v1/action-outbox/dispatch-ready",
        headers=headers,
        json={"limit": 1},
    )
    assert first_batch.status_code == 200, first_batch.text
    assert first_batch.json()["processed"] == 1
    assert first_batch.json()["succeeded"] == 1

    second_batch = client.post(
        "/api/v1/action-outbox/dispatch-ready",
        headers=headers,
        json={"limit": 10},
    )
    assert second_batch.status_code == 200
    assert second_batch.json()["processed"] == 1

    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        entries = db.query(AgentActionOutbox).all()
        events = db.query(AgentActionOutboxEvent).all()
        assert len(entries) == 2
        assert len(events) == 6
        assert all(item.user_id == user["user"]["id"] for item in entries)
        assert all(item.user_id == user["user"]["id"] for item in events)
    finally:
        db.close()


def test_phase6d4_contract_files_and_version_are_current() -> None:
    root = Path(__file__).resolve().parents[2]
    assert (root / "VERSION").read_text(encoding="utf-8").strip() == "0.6.7"
    assert (
        root
        / "backend/alembic/versions/20260823_0008_add_agent_action_outbox.py"
    ).is_file()
    assert (root / "docs/ACTION_OUTBOX.md").is_file()
    assert (root / "frontend/app/action-outbox/page.tsx").is_file()

    main_text = (root / "backend/main.py").read_text(encoding="utf-8")
    assert '"/api/action-outbox"' in main_text

    route_text = (
        root / "backend/app/routes/agent_action_outbox.py"
    ).read_text(encoding="utf-8")
    for token in (
        '"/{outbox_id}/dispatch"',
        '"/{outbox_id}/retry"',
        '"/{outbox_id}/cancel"',
        '"/dispatch-ready"',
    ):
        assert token in route_text

    manifest = (
        root / "scripts/release/render_release_manifest.py"
    ).read_text(encoding="utf-8")
    assert '"alembic_head": "20260823_0008"' in manifest
