from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.models.application import Application
from app.models.finance import FinanceTransaction
from app.models.health import HealthHabit
from app.models.learning import LearningMemory
from tests.support import bearer, register_user


@pytest.mark.integration
def test_core_twin_records_are_private_to_their_owner(client: TestClient) -> None:
    user_a = register_user(
        client,
        email="user-a@example.com",
        full_name="User A",
    )
    user_b = register_user(
        client,
        email="user-b@example.com",
        full_name="User B",
    )

    headers_a = bearer(user_a["access_token"])
    headers_b = bearer(user_b["access_token"])

    application = client.post(
        "/api/v1/applications/",
        headers=headers_a,
        json={
            "company": "Private Bank",
            "role": "AI Engineer",
            "location": "Chicago",
            "status": "Applied",
            "date_applied": "2026-07-28",
            "notes": "User A only",
        },
    )
    assert application.status_code == 200, application.text
    application_id = application.json()["id"]

    finance = client.post(
        "/api/v1/finance/",
        headers=headers_a,
        json={
            "type": "Expense",
            "title": "Private expense",
            "amount": 25,
            "category": "Testing",
            "date": "2026-07-28",
        },
    )
    assert finance.status_code == 200, finance.text

    health = client.post(
        "/api/v1/health/habits",
        headers=headers_a,
        json={
            "date": "2026-07-28",
            "water_cups": 8,
            "sleep_hours": 7.5,
            "workout_minutes": 30,
            "mood": "Focused",
            "notes": "Private habit",
        },
    )
    assert health.status_code == 200, health.text

    learning = client.post(
        "/api/v1/learning/",
        headers=headers_a,
        json={
            "topic": "PostgreSQL testing",
            "category": "Engineering",
            "current_level": "Intermediate",
            "target_level": "Advanced",
            "status": "In Progress",
            "notes": "Private learning goal",
        },
    )
    assert learning.status_code == 200, learning.text

    assert len(client.get("/api/v1/applications/", headers=headers_a).json()) == 1
    assert len(client.get("/api/v1/finance/", headers=headers_a).json()) == 1
    assert len(client.get("/api/v1/health/habits", headers=headers_a).json()) == 1
    assert len(client.get("/api/v1/learning/", headers=headers_a).json()) == 1

    assert client.get("/api/v1/applications/", headers=headers_b).json() == []
    assert client.get("/api/v1/finance/", headers=headers_b).json() == []
    assert client.get("/api/v1/health/habits", headers=headers_b).json() == []
    assert client.get("/api/v1/learning/", headers=headers_b).json() == []

    blocked_update = client.put(
        f"/api/v1/applications/{application_id}",
        headers=headers_b,
        json={"status": "Rejected"},
    )
    assert blocked_update.status_code == 200
    assert blocked_update.json()["error"] == "Application not found"

    owner_view = client.get("/api/v1/applications/", headers=headers_a).json()
    assert owner_view[0]["status"] == "Applied"

    db = SessionLocal()
    db.info["skip_user_scope"] = True
    try:
        owner_id = user_a["user"]["id"]
        assert db.query(Application).one().user_id == owner_id
        assert db.query(FinanceTransaction).one().user_id == owner_id
        assert db.query(HealthHabit).one().user_id == owner_id
        assert db.query(LearningMemory).one().user_id == owner_id
    finally:
        db.close()
