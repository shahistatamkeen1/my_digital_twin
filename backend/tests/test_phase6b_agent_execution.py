from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.agents.contracts import AgentName
from app.agents.executor import AgentInvocationResult
from app.services.ai_service import AIUsage
from tests.support import bearer, register_user


@pytest.mark.integration
def test_deterministic_execution_completes_and_synthesizes(
    client: TestClient,
) -> None:
    user = register_user(
        client,
        email="phase6b-complete@example.com",
        full_name="Phase 6B Complete",
    )
    headers = bearer(user["access_token"])

    created = client.post(
        "/api/v1/agent-runs/",
        headers=headers,
        json={
            "goal": "Prepare for an AI Engineer role while saving for relocation",
            "include_weekly_plan": True,
        },
    )
    assert created.status_code == 201, created.text
    run_id = created.json()["id"]

    executed = client.post(
        f"/api/v1/agent-runs/{run_id}/execute",
        headers=headers,
        json={
            "provider": "deterministic",
            "allow_partial": True,
            "allow_fallback": False,
        },
    )
    assert executed.status_code == 200, executed.text
    payload = executed.json()

    assert payload["status"] == "completed"
    assert payload["execution_provider"] == "deterministic"
    assert payload["duration_ms"] >= 0
    assert payload["total_tokens"] == 0
    assert payload["fallback_count"] == 0

    assert [item["status"] for item in payload["steps"]] == [
        "completed",
        "completed",
        "completed",
    ]
    assert all(item["provider"] == "deterministic" for item in payload["steps"])
    assert all(
        "context_manifest" in item["input_payload"]
        for item in payload["steps"]
    )

    plan = payload["result_payload"]["unified_plan"]
    assert set(plan["agent_contributions"]) == {
        "career",
        "finance",
        "learning",
    }
    assert plan["priorities"]
    assert plan["weekly_plan"]
    assert payload["result_payload"]["execution"]["failed_agents"] == []

    duplicate = client.post(
        f"/api/v1/agent-runs/{run_id}/execute",
        headers=headers,
        json={"provider": "deterministic"},
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "AGENT_RUN_NOT_EXECUTABLE"


@pytest.mark.integration
def test_execution_and_cancellation_preserve_user_isolation(
    client: TestClient,
) -> None:
    owner = register_user(
        client,
        email="phase6b-owner@example.com",
        full_name="Phase 6B Owner",
    )
    other = register_user(
        client,
        email="phase6b-other@example.com",
        full_name="Phase 6B Other",
    )
    owner_headers = bearer(owner["access_token"])
    other_headers = bearer(other["access_token"])

    created = client.post(
        "/api/v1/agent-runs/",
        headers=owner_headers,
        json={"goal": "Create a better sleep routine"},
    )
    run_id = created.json()["id"]

    blocked_execute = client.post(
        f"/api/v1/agent-runs/{run_id}/execute",
        headers=other_headers,
        json={"provider": "deterministic"},
    )
    assert blocked_execute.status_code == 404

    blocked_cancel = client.post(
        f"/api/v1/agent-runs/{run_id}/cancel",
        headers=other_headers,
    )
    assert blocked_cancel.status_code == 404

    cancelled = client.post(
        f"/api/v1/agent-runs/{run_id}/cancel",
        headers=owner_headers,
    )
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["run"]["status"] == "cancelled"
    assert cancelled.json()["run"]["steps"][0]["status"] == "cancelled"

    execute_cancelled = client.post(
        f"/api/v1/agent-runs/{run_id}/execute",
        headers=owner_headers,
        json={"provider": "deterministic"},
    )
    assert execute_cancelled.status_code == 409


@pytest.mark.integration
def test_partial_failure_is_persisted_and_synthesized(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user = register_user(
        client,
        email="phase6b-partial@example.com",
        full_name="Phase 6B Partial",
    )
    headers = bearer(user["access_token"])

    def fake_invoke(
        agent_name,
        goal,
        context,
        provider,
        *,
        fallback_used=False,
    ):
        if agent_name == AgentName.finance:
            raise RuntimeError("simulated finance failure")
        return AgentInvocationResult(
            payload={
                "summary": f"{agent_name.value} completed",
                "key_data_points": ["test"],
                "recommendations": [f"Use {agent_name.value} action"],
                "risks": [],
                "score": 80,
                "confidence": 90,
            },
            usage=AIUsage(model="test-model"),
            duration_ms=1,
            provider="test",
            model="test-model",
            fallback_used=fallback_used,
        )

    monkeypatch.setattr(
        "app.services.agent_execution_service.invoke_agent",
        fake_invoke,
    )

    created = client.post(
        "/api/v1/agent-runs/",
        headers=headers,
        json={
            "goal": "Prepare for a job relocation and learning plan",
            "preferred_agents": ["career", "finance", "learning"],
        },
    )
    run_id = created.json()["id"]

    executed = client.post(
        f"/api/v1/agent-runs/{run_id}/execute",
        headers=headers,
        json={
            "provider": "deterministic",
            "allow_partial": True,
            "allow_fallback": False,
            "force_sequential": True,
        },
    )
    assert executed.status_code == 200, executed.text
    payload = executed.json()

    assert payload["status"] == "partially_completed"
    statuses = {
        item["agent_name"]: item["status"] for item in payload["steps"]
    }
    assert statuses["finance"] == "failed"
    assert statuses["career"] == "completed"
    assert statuses["learning"] == "completed"
    assert payload["result_payload"]["execution"]["failed_agents"] == [
        "finance"
    ]


def test_phase6b_contract_files_and_version_are_current() -> None:
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    assert (root / "VERSION").read_text(encoding="utf-8").strip() == "0.6.3"
    assert (
        root
        / "backend/alembic/versions/20260729_0005_add_agent_execution_engine.py"
    ).is_file()
    assert (root / "docs/AGENT_EXECUTION.md").is_file()

    route_text = (
        root / "backend/app/routes/agent_runs.py"
    ).read_text(encoding="utf-8")
    assert '"/{run_id}/execute"' in route_text
    assert '"/{run_id}/cancel"' in route_text

    manifest = (
        root / "scripts/release/render_release_manifest.py"
    ).read_text(encoding="utf-8")
    assert '"alembic_head": "20260806_0006"' in manifest
