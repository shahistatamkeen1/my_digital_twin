from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.agents.contracts import AgentName, ExecutionMode
from app.agents.registry import list_agent_definitions
from app.agents.router import route_agent_goal
from app.database import SessionLocal
from app.models.agent_run import AgentRun, AgentStep
from tests.support import bearer, register_user


def test_agent_registry_has_typed_core_twins() -> None:
    definitions = list_agent_definitions()
    assert [item.name for item in definitions] == [
        AgentName.career,
        AgentName.finance,
        AgentName.health,
        AgentName.learning,
    ]
    assert all(item.supported_tasks for item in definitions)
    assert all(item.required_context for item in definitions)


def test_deterministic_router_selects_cross_domain_agents() -> None:
    decision = route_agent_goal(
        "Prepare for an AI Engineer role while saving for relocation"
    )
    assert decision.selected_agents == [
        AgentName.career,
        AgentName.finance,
        AgentName.learning,
    ]
    assert decision.execution_mode == ExecutionMode.parallel_then_synthesize
    assert decision.matched_keywords[AgentName.career]
    assert decision.matched_keywords[AgentName.finance]
    assert decision.matched_keywords[AgentName.learning]


def test_deterministic_router_honours_preferred_agents_and_safe_fallback() -> None:
    health = route_agent_goal(
        "Create a better sleep routine",
        [AgentName.learning],
    )
    assert health.selected_agents == [AgentName.health, AgentName.learning]

    fallback = route_agent_goal("Organize my next six months")
    assert fallback.selected_agents == list(AgentName)
    assert fallback.execution_mode == ExecutionMode.parallel_then_synthesize


@pytest.mark.integration
def test_agent_run_lifecycle_and_user_isolation(client: TestClient) -> None:
    user_a = register_user(
        client,
        email="phase6a-a@example.com",
        full_name="Phase 6A User A",
    )
    user_b = register_user(
        client,
        email="phase6a-b@example.com",
        full_name="Phase 6A User B",
    )
    headers_a = bearer(user_a["access_token"])
    headers_b = bearer(user_b["access_token"])

    registry = client.get("/api/v1/agents/", headers=headers_a)
    assert registry.status_code == 200, registry.text
    assert [item["name"] for item in registry.json()] == [
        "career",
        "finance",
        "health",
        "learning",
    ]

    created = client.post(
        "/api/v1/agent-runs/",
        headers=headers_a,
        json={
            "goal": "Prepare for an AI Engineer role while saving for relocation",
            "preferred_agents": [],
            "include_weekly_plan": True,
            "context": {"target_horizon_months": 6},
        },
    )
    assert created.status_code == 201, created.text
    run = created.json()
    run_id = run["id"]
    assert run["status"] == "planned"
    assert run["execution_mode"] == "parallel_then_synthesize"
    assert run["selected_agents"] == ["career", "finance", "learning"]
    assert [step["agent_name"] for step in run["steps"]] == [
        "career",
        "finance",
        "learning",
    ]
    assert all(step["status"] == "planned" for step in run["steps"])

    owner_list = client.get("/api/v1/agent-runs/", headers=headers_a)
    assert owner_list.status_code == 200
    assert len(owner_list.json()) == 1
    assert owner_list.headers["X-Pagination-Mode"] == "legacy"

    paged = client.get(
        "/api/v1/agent-runs/?page=1&page_size=10",
        headers=headers_a,
    )
    assert paged.status_code == 200
    assert paged.json()["pagination"]["total_items"] == 1
    assert paged.json()["items"][0]["id"] == run_id

    assert client.get("/api/v1/agent-runs/", headers=headers_b).json() == []
    blocked = client.get(f"/api/v1/agent-runs/{run_id}", headers=headers_b)
    assert blocked.status_code == 404
    assert blocked.json()["error"]["code"] == "AGENT_RUN_NOT_FOUND"

    not_retryable = client.post(
        f"/api/v1/agent-runs/{run_id}/retry",
        headers=headers_a,
    )
    assert not_retryable.status_code == 409
    assert not_retryable.json()["error"]["code"] == "AGENT_RUN_NOT_RETRYABLE"

    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        db.execute(
            AgentRun.__table__.update()
            .where(AgentRun.__table__.c.id == run_id)
            .values(status="failed", error_message="Test failure")
        )
        db.commit()
    finally:
        db.close()

    retried = client.post(
        f"/api/v1/agent-runs/{run_id}/retry",
        headers=headers_a,
    )
    assert retried.status_code == 201, retried.text
    retry = retried.json()
    retry_id = retry["id"]
    assert retry["retry_of_run_id"] == run_id
    assert retry["status"] == "planned"
    assert len(retry["steps"]) == 3

    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        db.execute(
            AgentRun.__table__.update()
            .where(AgentRun.__table__.c.id == retry_id)
            .values(status="running")
        )
        db.commit()
    finally:
        db.close()

    active_delete = client.delete(
        f"/api/v1/agent-runs/{retry_id}",
        headers=headers_a,
    )
    assert active_delete.status_code == 409
    assert active_delete.json()["error"]["code"] == "AGENT_RUN_ACTIVE"

    deleted = client.delete(
        f"/api/v1/agent-runs/{run_id}",
        headers=headers_a,
    )
    assert deleted.status_code == 200
    assert deleted.json()["deleted_run_id"] == run_id

    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        owner_id = user_a["user"]["id"]
        runs = db.query(AgentRun).all()
        steps = db.query(AgentStep).all()
        assert len(runs) == 1
        assert runs[0].id == retry_id
        assert runs[0].user_id == owner_id
        assert runs[0].retry_of_run_id is None
        assert len(steps) == 3
        assert all(step.user_id == owner_id for step in steps)
    finally:
        db.close()


def test_phase6a_contract_files_and_version_are_current() -> None:
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    assert (root / "VERSION").read_text(encoding="utf-8").strip() == "0.6.0"
    assert (
        root
        / "backend/alembic/versions/20260729_0004_add_agent_orchestration_foundation.py"
    ).is_file()
    assert (root / "docs/AGENT_ORCHESTRATION.md").is_file()

    main_text = (root / "backend/main.py").read_text(encoding="utf-8")
    assert '"/api/agents"' in main_text
    assert '"/api/agent-runs"' in main_text

    manifest_renderer = (
        root / "scripts/release/render_release_manifest.py"
    ).read_text(encoding="utf-8")
    assert '"alembic_head": "20260729_0004"' in manifest_renderer
