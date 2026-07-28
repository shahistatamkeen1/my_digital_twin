from __future__ import annotations

import argparse
import time
from typing import Any

import httpx


def _require(response: httpx.Response, expected: int | tuple[int, ...]) -> Any:
    expected_codes = (expected,) if isinstance(expected, int) else expected
    if response.status_code not in expected_codes:
        raise RuntimeError(
            f"{response.request.method} {response.request.url} returned "
            f"{response.status_code}: {response.text}"
        )
    return response.json()


def verify(base_url: str) -> None:
    base_url = base_url.rstrip("/")
    unique = str(time.time_ns())
    created: dict[str, list[int]] = {
        "applications": [],
        "finance": [],
        "health": [],
        "learning": [],
    }

    with httpx.Client(
        base_url=base_url,
        timeout=30.0,
        follow_redirects=True,
    ) as client:
        registration = _require(
            client.post(
                "/api/v1/auth/register",
                json={
                    "full_name": "Phase Four C",
                    "email": f"phase4c-{unique}@example.com",
                    "password": "PhaseFourC1",
                },
            ),
            201,
        )
        token = registration["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        try:
            company_prefix = f"Phase4C-{unique}"
            for index, status in enumerate(
                ("Saved", "Applied", "Applied", "Interview"),
                start=1,
            ):
                item = _require(
                    client.post(
                        "/api/v1/applications/",
                        headers=headers,
                        json={
                            "company": f"{company_prefix}-{index}",
                            "role": f"Engineer {5 - index}",
                            "location": "Chicago",
                            "status": status,
                            "date_applied": f"2026-07-{20 + index:02d}",
                            "notes": f"pagination test {index}",
                        },
                    ),
                    200,
                )
                created["applications"].append(item["id"])

            applications = client.get(
                "/api/v1/applications/",
                headers=headers,
                params={
                    "page": 1,
                    "page_size": 2,
                    "search": company_prefix,
                    "status": "Applied",
                    "sort_by": "role",
                    "sort_order": "asc",
                },
            )
            body = _require(applications, 200)
            if len(body.get("items", [])) != 2:
                raise RuntimeError(f"Unexpected application page: {body}")
            if body["pagination"]["total_items"] != 2:
                raise RuntimeError("Application filtering total is incorrect.")
            if applications.headers.get("X-Total-Count") != "2":
                raise RuntimeError("Application total-count header is missing.")
            if applications.headers.get("X-Pagination-Mode") != "page":
                raise RuntimeError("Application pagination mode is incorrect.")
            roles = [item["role"] for item in body["items"]]
            if roles != sorted(roles):
                raise RuntimeError("Application sorting is incorrect.")

            legacy = client.get(
                "/api/applications/",
                headers=headers,
                params={"search": company_prefix},
            )
            legacy_body = _require(legacy, 200)
            if not isinstance(legacy_body, list) or len(legacy_body) != 4:
                raise RuntimeError("Legacy application array compatibility failed.")
            if legacy.headers.get("Deprecation") != "true":
                raise RuntimeError("Legacy application route is not deprecated.")
            if legacy.headers.get("X-Pagination-Mode") != "legacy":
                raise RuntimeError("Legacy pagination header is missing.")

            invalid_page = client.get(
                "/api/v1/applications/",
                headers=headers,
                params={"page": 0, "page_size": 2},
            )
            invalid_body = _require(invalid_page, 422)
            if invalid_body.get("error", {}).get("code") != "VALIDATION_ERROR":
                raise RuntimeError("Invalid page did not use the validation contract.")

            for index, category in enumerate(("Food", "Food", "Transport"), start=1):
                item = _require(
                    client.post(
                        "/api/v1/finance/",
                        headers=headers,
                        json={
                            "type": "Expense",
                            "title": f"{company_prefix} expense {index}",
                            "amount": index * 25,
                            "category": category,
                            "date": f"2026-07-{20 + index:02d}",
                        },
                    ),
                    200,
                )
                created["finance"].append(item["id"])

            finance = client.get(
                "/api/v1/finance/",
                headers=headers,
                params={
                    "page": 1,
                    "page_size": 1,
                    "search": company_prefix,
                    "category": "Food",
                    "amount_min": 20,
                    "sort_by": "amount",
                    "sort_order": "desc",
                },
            )
            finance_body = _require(finance, 200)
            if finance_body["pagination"]["total_items"] != 2:
                raise RuntimeError("Finance filtering total is incorrect.")
            if finance_body["items"][0]["amount"] != 50:
                raise RuntimeError("Finance amount sorting is incorrect.")

            for index, mood in enumerate(("Focused", "Focused", "Tired"), start=1):
                item = _require(
                    client.post(
                        "/api/v1/health/habits",
                        headers=headers,
                        json={
                            "date": f"2026-07-{20 + index:02d}",
                            "water_cups": 5 + index,
                            "sleep_hours": 6 + index / 2,
                            "workout_minutes": index * 10,
                            "mood": mood,
                            "notes": f"{company_prefix} health {index}",
                        },
                    ),
                    200,
                )
                created["health"].append(item["id"])

            health = client.get(
                "/api/v1/health/habits",
                headers=headers,
                params={
                    "page": 1,
                    "page_size": 2,
                    "search": company_prefix,
                    "mood": "Focused",
                    "sort_by": "date",
                    "sort_order": "asc",
                },
            )
            health_body = _require(health, 200)
            if health_body["pagination"]["total_items"] != 2:
                raise RuntimeError("Health filtering total is incorrect.")

            for index, status in enumerate(
                ("In Progress", "In Progress", "Completed"),
                start=1,
            ):
                item = _require(
                    client.post(
                        "/api/v1/learning/",
                        headers=headers,
                        json={
                            "topic": f"{company_prefix} Topic {index}",
                            "category": "Cloud" if index < 3 else "AI",
                            "current_level": "Beginner",
                            "target_level": "Advanced",
                            "resource": "Internal test",
                            "resource_link": "",
                            "status": status,
                            "notes": f"{company_prefix} learning {index}",
                        },
                    ),
                    200,
                )
                created["learning"].append(item["id"])

            learning = client.get(
                "/api/v1/learning/",
                headers=headers,
                params={
                    "page": 1,
                    "page_size": 1,
                    "search": company_prefix,
                    "category": "Cloud",
                    "status": "In Progress",
                    "sort_by": "topic",
                    "sort_order": "desc",
                },
            )
            learning_body = _require(learning, 200)
            if learning_body["pagination"]["total_items"] != 2:
                raise RuntimeError("Learning filtering total is incorrect.")
            if len(learning_body["items"]) != 1:
                raise RuntimeError("Learning page size is incorrect.")

        finally:
            for item_id in created["applications"]:
                client.delete(
                    f"/api/v1/applications/{item_id}",
                    headers=headers,
                )
            for item_id in created["finance"]:
                client.delete(
                    f"/api/v1/finance/{item_id}",
                    headers=headers,
                )
            for item_id in created["health"]:
                client.delete(
                    f"/api/v1/health/habits/{item_id}",
                    headers=headers,
                )
            for item_id in created["learning"]:
                client.delete(
                    f"/api/v1/learning/{item_id}",
                    headers=headers,
                )

    print("Phase 4C live collection-query verification passed.")
    print(
        "Applications, Finance, Health, Learning, legacy arrays, "
        "pagination headers, filters, search, sorting, and validation passed."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()
    verify(args.base_url)


if __name__ == "__main__":
    main()
