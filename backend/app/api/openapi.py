from __future__ import annotations

import copy
import re
from collections.abc import Iterable
from typing import Any

from fastapi import FastAPI
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.routing import APIRoute

from app.config import settings


HTTP_METHODS = {"get", "post", "put", "patch", "delete", "options", "head"}
INFRASTRUCTURE_PATHS = {"/", "/live", "/health", "/ready"}

OPENAPI_DESCRIPTION = """
My Digital Twin is a multi-agent personal intelligence platform covering career,
finance, health, learning, personal memory, and cross-twin orchestration.

### API lifecycle

- **Canonical contract:** `/api/v1/...`
- **Legacy compatibility:** `/api/...` remains available temporarily and is
  marked deprecated in the full schema.
- **Request tracing:** every response includes `X-Request-ID`.
- **Authentication:** protected endpoints accept either an HTTP bearer access
  token or the HttpOnly access-token cookie issued by the authentication API.
- **Errors:** failures use the standard `ApiErrorResponse` envelope while
  retaining temporary `detail` and `message` compatibility fields.
- **Pagination:** selected collection endpoints return a plain array unless
  `page` or `page_size` is supplied. Paginated requests return `items` and
  `pagination` metadata.

The canonical Swagger and ReDoc views intentionally exclude deprecated legacy
routes. The default `/docs` and `/redoc` views retain the complete compatibility
surface during the migration period.
""".strip()

TAG_DESCRIPTIONS: dict[str, str] = {
    "System": "Infrastructure probes and service metadata.",
    "Authentication": "Account registration, login, refresh, logout, and session status.",
    "Resume": "Resume upload and extraction workflows.",
    "Chat": "Career-oriented AI conversation endpoints.",
    "Job Match": "Role and job-description matching analysis.",
    "ATS Resume": "ATS-focused resume scoring and analysis.",
    "Recommendations": "Career recommendations generated from user context.",
    "Applications": "Job-application tracking, filtering, sorting, and lifecycle updates.",
    "Career Memory": "Persistent career preferences and context.",
    "Career Roadmap": "Career roadmap creation, updates, and AI generation.",
    "Jobs": "External job discovery and search.",
    "Interview": "Interview preparation and question generation.",
    "Cover Letter": "Tailored cover-letter generation.",
    "Career Intelligence": "Aggregated career analytics and intelligence.",
    "Resume Tailor": "Job-specific resume tailoring.",
    "Twin Recommendation": "Cross-twin recommendation summaries.",
    "Finance": "Transactions, savings goals, budgets, insights, and investment planning.",
    "Finance Chat": "Finance-agent conversation endpoints.",
    "Twin Orchestrator": "Cross-domain orchestration and coordinated agent reasoning.",
    "Health": "Health memory, habits, summaries, insights, and diet planning.",
    "Health Chat": "Health-agent conversation endpoints.",
    "Personal Memory": "User-owned long-term personal memory.",
    "Twin Brief": "Concise multi-domain personal briefings.",
    "Twin Notifications": "Cross-twin notifications and actionable alerts.",
    "Master Context": "Unified context assembled across all twins.",
    "Learning": "Learning goals, resources, levels, and status tracking.",
    "Learning Chat": "Learning-agent conversation and structured guidance.",
    "Learning Recommendations": "Personalized learning recommendations.",
    "Learning Progress": "Learning tasks, progress updates, and next-step generation.",
    "Resource Recommendations": "Suggested courses, books, and learning resources.",
    "Progress": "Unified progress metrics and downloadable scorecards.",
    "Agent Memory": "Inspectable memories created by platform agents.",
    "Agent Profiles": "Agent configuration and profile information.",
    "Agent Reflections": "Agent-generated reflections and retrospective analysis.",
    "Twin Journal": "Chronological cross-twin journal entries.",
    "Agent Plans": "Autonomous plans, tasks, and execution status.",
    "Predictive Insights": "Forward-looking insights generated from user-owned data.",
    "Twin Context": "Current contextual snapshot for the digital twin.",
    "Application Autofill": "Job-application autofill and custom-answer generation.",
}

ERROR_EXAMPLES: dict[str, dict[str, Any]] = {
    "validation_error": {
        "summary": "Validation error",
        "value": {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The submitted data is invalid.",
                "details": [
                    {
                        "field": "body.email",
                        "message": "value is not a valid email address",
                        "type": "value_error",
                    }
                ],
            },
            "meta": {"request_id": "550e8400-e29b-41d4-a716-446655440000"},
            "detail": "The submitted data is invalid.",
            "message": "The submitted data is invalid.",
        },
    },
    "authentication_required": {
        "summary": "Authentication required",
        "value": {
            "success": False,
            "error": {
                "code": "UNAUTHORIZED",
                "message": "Authentication is required.",
                "details": None,
            },
            "meta": {"request_id": "550e8400-e29b-41d4-a716-446655440000"},
            "detail": "Authentication is required.",
            "message": "Authentication is required.",
        },
    },
    "not_found": {
        "summary": "Resource not found",
        "value": {
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": "The requested resource was not found.",
                "details": None,
            },
            "meta": {"request_id": "550e8400-e29b-41d4-a716-446655440000"},
            "detail": "The requested resource was not found.",
            "message": "The requested resource was not found.",
        },
    },
    "service_unavailable": {
        "summary": "Dependency unavailable",
        "value": {
            "success": False,
            "error": {
                "code": "SERVICE_UNAVAILABLE",
                "message": "A required service is temporarily unavailable.",
                "details": None,
            },
            "meta": {"request_id": "550e8400-e29b-41d4-a716-446655440000"},
            "detail": "A required service is temporarily unavailable.",
            "message": "A required service is temporarily unavailable.",
        },
    },
}

REQUEST_EXAMPLES: dict[tuple[str, str], dict[str, Any]] = {
    ("/auth/register", "post"): {
        "summary": "Create an account",
        "value": {
            "full_name": "Jordan Lee",
            "email": "jordan.lee@example.com",
            "password": "ExamplePass1",
        },
    },
    ("/auth/login", "post"): {
        "summary": "Sign in",
        "value": {
            "email": "jordan.lee@example.com",
            "password": "ExamplePass1",
        },
    },
    ("/applications/", "post"): {
        "summary": "Track a job application",
        "value": {
            "company": "Example Labs",
            "role": "AI Engineer",
            "location": "Chicago, IL",
            "status": "Applied",
            "date_applied": "2026-07-28",
            "notes": "Submitted through the company careers page.",
        },
    },
    ("/finance/", "post"): {
        "summary": "Record a transaction",
        "value": {
            "type": "Expense",
            "title": "Groceries",
            "amount": 64.25,
            "category": "Food",
            "date": "2026-07-28",
        },
    },
    ("/health/habits", "post"): {
        "summary": "Record daily health habits",
        "value": {
            "date": "2026-07-28",
            "water_cups": 8,
            "sleep_hours": 7.5,
            "workout_minutes": 30,
            "mood": "Focused",
            "notes": "Morning walk and strength session.",
        },
    },
    ("/learning/", "post"): {
        "summary": "Create a learning item",
        "value": {
            "topic": "Production FastAPI",
            "category": "Backend Engineering",
            "current_level": "Intermediate",
            "target_level": "Advanced",
            "resource": "Official documentation",
            "resource_link": "https://example.com/resource",
            "status": "In Progress",
            "notes": "Focus on reliability and observability.",
        },
    },
}

PAGINATED_SUFFIXES = {
    "/applications/",
    "/finance/",
    "/health/habits",
    "/learning/",
    "/agent-memory/",
    "/twin-notifications/",
}


def _normalise_identifier(value: str) -> str:
    value = value.strip("/") or "root"
    value = re.sub(r"\{([^}]+)\}", r"by_\1", value)
    value = re.sub(r"[^A-Za-z0-9]+", "_", value)
    return re.sub(r"_+", "_", value).strip("_").lower() or "root"


def stable_operation_id(route: APIRoute) -> str:
    """Generate deterministic operation IDs from HTTP method and full path."""

    methods = sorted(
        method.lower()
        for method in (route.methods or set())
        if method.upper() not in {"HEAD", "OPTIONS"}
    )
    method = methods[0] if methods else "call"
    return f"{_normalise_identifier(route.path_format)}_{method}"


def build_openapi_tags() -> list[dict[str, Any]]:
    tags: list[dict[str, Any]] = [
        {
            "name": "System",
            "description": TAG_DESCRIPTIONS["System"],
        },
        {
            "name": "v1 / System",
            "description": "Canonical versioned service metadata and monitoring endpoints.",
        },
    ]

    for name, description in TAG_DESCRIPTIONS.items():
        if name == "System":
            continue
        tags.append(
            {
                "name": f"v1 / {name}",
                "description": description,
            }
        )
        tags.append(
            {
                "name": f"Legacy / {name}",
                "description": (
                    f"Deprecated compatibility surface for {description.lower()} "
                    f"Use the `/api/v1` successor before {settings.legacy_api_sunset}."
                ),
                "x-lifecycle": "deprecated",
            }
        )

    return tags


def _contact() -> dict[str, str] | None:
    result: dict[str, str] = {}
    if settings.openapi_contact_name:
        result["name"] = settings.openapi_contact_name
    if settings.openapi_contact_email:
        result["email"] = settings.openapi_contact_email
    return result or None


def _servers() -> list[dict[str, str]]:
    if settings.public_api_base_url:
        return [
            {
                "url": settings.public_api_base_url.rstrip("/"),
                "description": f"{settings.environment.title()} deployment",
            }
        ]
    return [{"url": "/", "description": "Current deployment"}]


def _successor_path(path: str) -> str | None:
    if path == "/api" or path.startswith("/api/"):
        if path == settings.normalized_api_v1_prefix or path.startswith(
            f"{settings.normalized_api_v1_prefix}/"
        ):
            return None
        return f"{settings.normalized_api_v1_prefix}{path[len('/api'):]}"
    return None


def _request_example_for(path: str, method: str) -> dict[str, Any] | None:
    for (suffix, expected_method), example in REQUEST_EXAMPLES.items():
        if method == expected_method and path.endswith(suffix):
            return example
    return None


def _ensure_response_headers(
    operation: dict[str, Any],
    *,
    api_path: bool,
    legacy_path: bool,
    paginated_path: bool,
) -> None:
    for response in operation.get("responses", {}).values():
        if not isinstance(response, dict):
            continue
        headers = response.setdefault("headers", {})
        headers.setdefault(
            settings.request_id_header,
            {
                "description": "Correlation identifier for support and log tracing.",
                "schema": {"type": "string"},
            },
        )
        if api_path:
            headers.setdefault(
                settings.api_version_header,
                {
                    "description": "Resolved API contract version.",
                    "schema": {"type": "string", "examples": [settings.api_current_version]},
                },
            )
        if legacy_path:
            headers.setdefault(
                "Deprecation",
                {
                    "description": "Indicates that the route is deprecated.",
                    "schema": {"type": "string", "examples": ["true"]},
                },
            )
            headers.setdefault(
                "Sunset",
                {
                    "description": "Planned retirement date for the legacy route.",
                    "schema": {"type": "string", "examples": [settings.legacy_api_sunset]},
                },
            )
            headers.setdefault(
                "Link",
                {
                    "description": "Canonical successor-version link.",
                    "schema": {"type": "string"},
                },
            )
        if paginated_path:
            for header_name, description in (
                ("X-Total-Count", "Total number of matching records."),
                ("X-Page", "Current page number."),
                ("X-Page-Size", "Number of records requested for the page."),
                ("X-Total-Pages", "Total number of result pages."),
                ("X-Pagination-Mode", "`page` or backward-compatible `legacy` mode."),
                ("X-Sort-By", "Resolved sort field."),
                ("X-Sort-Order", "Resolved sort direction."),
                ("Link", "RFC 8288 previous and next pagination links."),
            ):
                headers.setdefault(
                    header_name,
                    {
                        "description": description,
                        "schema": {"type": "string"},
                    },
                )


def _ensure_error_examples(operation: dict[str, Any]) -> None:
    status_examples = {
        "401": {"authentication_required": ERROR_EXAMPLES["authentication_required"]},
        "404": {"not_found": ERROR_EXAMPLES["not_found"]},
        "422": {"validation_error": ERROR_EXAMPLES["validation_error"]},
        "503": {"service_unavailable": ERROR_EXAMPLES["service_unavailable"]},
    }
    for status_code, examples in status_examples.items():
        response = operation.get("responses", {}).get(status_code)
        if not isinstance(response, dict):
            continue
        content = response.setdefault("content", {}).setdefault(
            "application/json",
            {},
        )
        content.setdefault(
            "schema",
            {"$ref": "#/components/schemas/ApiErrorResponse"},
        )
        content.setdefault("examples", examples)


def _ensure_request_example(
    operation: dict[str, Any],
    *,
    path: str,
    method: str,
) -> None:
    example = _request_example_for(path, method)
    if example is None:
        return
    request_body = operation.get("requestBody")
    if not isinstance(request_body, dict):
        return
    media = request_body.get("content", {}).get("application/json")
    if isinstance(media, dict):
        media.setdefault("examples", {"example": example})


def _enrich_security(
    operation: dict[str, Any],
    *,
    path: str,
) -> None:
    security = operation.get("security", [])
    has_bearer = any(
        isinstance(requirement, dict) and "HTTPBearer" in requirement
        for requirement in security
    )

    if has_bearer:
        operation["security"] = [
            {"HTTPBearer": []},
            {"AccessCookieAuth": []},
        ]
        operation["x-authentication"] = "access-token"

    if path.endswith("/auth/refresh"):
        operation["security"] = [{"RefreshCookieAuth": []}]
        operation["x-authentication"] = "refresh-cookie"
    elif path.endswith("/auth/status"):
        operation["security"] = [
            {},
            {"HTTPBearer": []},
            {"AccessCookieAuth": []},
        ]
        operation["x-authentication"] = "optional-access-token"


def _enrich_schema(schema: dict[str, Any]) -> dict[str, Any]:
    components = schema.setdefault("components", {})
    schemes = components.setdefault("securitySchemes", {})
    schemes.setdefault(
        "AccessCookieAuth",
        {
            "type": "apiKey",
            "in": "cookie",
            "name": settings.access_cookie_name,
            "description": "HttpOnly access-token cookie issued by login or registration.",
        },
    )
    schemes.setdefault(
        "RefreshCookieAuth",
        {
            "type": "apiKey",
            "in": "cookie",
            "name": settings.refresh_cookie_name,
            "description": "HttpOnly refresh-token cookie used only by the refresh endpoint.",
        },
    )

    schema["x-api-contract"] = {
        "canonical_version": settings.api_current_version,
        "canonical_prefix": settings.normalized_api_v1_prefix,
        "legacy_enabled": settings.enable_legacy_api_routes,
        "legacy_sunset": settings.legacy_api_sunset,
        "error_model": "ApiErrorResponse",
    }

    for path, path_item in schema.get("paths", {}).items():
        if not isinstance(path_item, dict):
            continue
        canonical = path == settings.normalized_api_v1_prefix or path.startswith(
            f"{settings.normalized_api_v1_prefix}/"
        )
        legacy_successor = _successor_path(path)
        legacy = legacy_successor is not None
        api_path = canonical or legacy
        paginated = any(path.endswith(suffix) for suffix in PAGINATED_SUFFIXES)

        for method, operation in path_item.items():
            if method.lower() not in HTTP_METHODS or not isinstance(operation, dict):
                continue

            tags = operation.get("tags") or ["System"]
            tag = str(tags[0])
            summary = operation.get("summary") or operation.get("operationId") or "API operation"
            operation["summary"] = summary

            if not operation.get("description"):
                if legacy and legacy_successor:
                    operation["description"] = (
                        f"Deprecated compatibility endpoint for **{summary}**. "
                        f"Migrate to `{legacy_successor}` before "
                        f"{settings.legacy_api_sunset}."
                    )
                elif canonical:
                    operation["description"] = (
                        f"Canonical {settings.api_current_version} endpoint for {tag}. "
                        f"{summary}."
                    )
                else:
                    operation["description"] = f"Infrastructure endpoint. {summary}."

            operation["x-api-version"] = (
                settings.api_current_version if canonical else "legacy" if legacy else "infrastructure"
            )
            operation["x-error-contract"] = "ApiErrorResponse"

            if legacy and legacy_successor:
                operation["deprecated"] = True
                operation["x-successor-version"] = legacy_successor
                operation["x-sunset"] = settings.legacy_api_sunset

            _enrich_security(operation, path=path)
            _ensure_request_example(operation, path=path, method=method.lower())
            _ensure_response_headers(
                operation,
                api_path=api_path,
                legacy_path=legacy,
                paginated_path=paginated and method.lower() == "get",
            )
            _ensure_error_examples(operation)

    return schema


def build_full_openapi_schema(app: FastAPI) -> dict[str, Any]:
    schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        summary="Production API contract for the My Digital Twin platform.",
        description=OPENAPI_DESCRIPTION,
        routes=app.routes,
        tags=build_openapi_tags(),
        servers=_servers(),
        contact=_contact(),
        license_info={"name": settings.openapi_license_name},
        separate_input_output_schemas=True,
    )
    return _enrich_schema(schema)


def canonical_openapi_schema(full_schema: dict[str, Any]) -> dict[str, Any]:
    """Return a canonical schema containing v1 and infrastructure probes only."""

    schema = copy.deepcopy(full_schema)
    prefix = settings.normalized_api_v1_prefix
    schema["paths"] = {
        path: path_item
        for path, path_item in schema.get("paths", {}).items()
        if path in INFRASTRUCTURE_PATHS
        or path == prefix
        or path.startswith(f"{prefix}/")
    }
    schema["tags"] = [
        item
        for item in schema.get("tags", [])
        if not str(item.get("name", "")).startswith("Legacy / ")
    ]
    schema["info"]["title"] = f"{schema['info']['title']} — {settings.api_current_version}"
    schema["x-contract-scope"] = "canonical"
    return schema


def configure_openapi(app: FastAPI) -> None:
    """Install cached full and canonical schemas plus versioned docs routes."""

    def custom_openapi() -> dict[str, Any]:
        if app.openapi_schema is None:
            app.openapi_schema = build_full_openapi_schema(app)
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]

    @app.get(
        settings.api_openapi_path,
        include_in_schema=False,
        name="canonical_openapi_schema",
    )
    def canonical_schema_endpoint() -> dict[str, Any]:
        return canonical_openapi_schema(app.openapi())

    if not settings.api_docs_enabled:
        return

    @app.get(
        settings.api_docs_path,
        include_in_schema=False,
        name="canonical_swagger_ui",
    )
    def canonical_swagger_ui():
        return get_swagger_ui_html(
            openapi_url=settings.api_openapi_path,
            title=f"{settings.app_name} — {settings.api_current_version} Swagger UI",
            swagger_ui_parameters={
                "displayRequestDuration": True,
                "filter": True,
                "persistAuthorization": True,
                "tryItOutEnabled": True,
            },
        )

    @app.get(
        settings.api_redoc_path,
        include_in_schema=False,
        name="canonical_redoc",
    )
    def canonical_redoc_ui():
        return get_redoc_html(
            openapi_url=settings.api_openapi_path,
            title=f"{settings.app_name} — {settings.api_current_version} ReDoc",
        )


def iter_operations(schema: dict[str, Any]) -> Iterable[tuple[str, str, dict[str, Any]]]:
    for path, path_item in schema.get("paths", {}).items():
        if not isinstance(path_item, dict):
            continue
        for method, operation in path_item.items():
            if method.lower() in HTTP_METHODS and isinstance(operation, dict):
                yield path, method.lower(), operation
