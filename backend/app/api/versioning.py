from __future__ import annotations

from dataclasses import dataclass

from starlette.responses import Response

from app.config import settings


@dataclass(frozen=True)
class ApiVersionResolution:
    """Resolved API version information for one request path."""

    version: str | None
    is_api_request: bool
    is_legacy: bool
    successor_path: str | None = None


def resolve_api_version(path: str) -> ApiVersionResolution:
    """Classify a request as current v1, legacy API, or non-API."""

    current_prefix = settings.normalized_api_v1_prefix

    if path == current_prefix or path.startswith(f"{current_prefix}/"):
        return ApiVersionResolution(
            version=settings.api_current_version,
            is_api_request=True,
            is_legacy=False,
        )

    if path == "/api" or path.startswith("/api/"):
        suffix = path[len("/api") :]
        return ApiVersionResolution(
            version="legacy",
            is_api_request=True,
            is_legacy=True,
            successor_path=f"{current_prefix}{suffix}",
        )

    return ApiVersionResolution(
        version=None,
        is_api_request=False,
        is_legacy=False,
    )


def apply_api_version_headers(response: Response, path: str) -> None:
    """Attach version and legacy-deprecation headers without changing bodies."""

    resolution = resolve_api_version(path)
    if not resolution.is_api_request or resolution.version is None:
        return

    response.headers[settings.api_version_header] = resolution.version

    if not resolution.is_legacy:
        return

    response.headers["Deprecation"] = "true"
    response.headers["Sunset"] = settings.legacy_api_sunset
    response.headers["Warning"] = (
        '299 - "Legacy API route is deprecated; use the /api/v1 successor."'
    )

    if resolution.successor_path:
        response.headers["Link"] = (
            f'<{resolution.successor_path}>; rel="successor-version"'
        )


def api_version_payload() -> dict[str, object]:
    """Public metadata describing the supported API contract."""

    return {
        "current_version": settings.api_current_version,
        "current_prefix": settings.normalized_api_v1_prefix,
        "legacy_routes_enabled": settings.enable_legacy_api_routes,
        "legacy_prefix": "/api",
        "legacy_sunset": settings.legacy_api_sunset,
        "version_header": settings.api_version_header,
    }
