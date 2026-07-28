from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from app.api.openapi import iter_operations
from app.config import settings


@dataclass(frozen=True)
class RouteInventoryItem:
    scope: str
    method: str
    path: str
    operation_id: str
    summary: str
    tags: tuple[str, ...]
    authentication: str
    deprecated: bool
    successor: str | None

    def as_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["tags"] = list(self.tags)
        return result


def route_scope(path: str) -> str:
    prefix = settings.normalized_api_v1_prefix
    if path == prefix or path.startswith(f"{prefix}/"):
        return "canonical"
    if path == "/api" or path.startswith("/api/"):
        return "legacy"
    return "infrastructure"


def authentication_label(operation: dict[str, Any]) -> str:
    explicit = operation.get("x-authentication")
    if explicit:
        return str(explicit)
    security = operation.get("security")
    if not security:
        return "public"
    if isinstance(security, list) and any(item == {} for item in security):
        return "optional"
    return "required"


def build_route_inventory(schema: dict[str, Any]) -> list[RouteInventoryItem]:
    items: list[RouteInventoryItem] = []
    for path, method, operation in iter_operations(schema):
        items.append(
            RouteInventoryItem(
                scope=route_scope(path),
                method=method.upper(),
                path=path,
                operation_id=str(operation.get("operationId", "")),
                summary=str(operation.get("summary", "")),
                tags=tuple(str(tag) for tag in operation.get("tags", [])),
                authentication=authentication_label(operation),
                deprecated=bool(operation.get("deprecated", False)),
                successor=(
                    str(operation["x-successor-version"])
                    if operation.get("x-successor-version")
                    else None
                ),
            )
        )
    return sorted(items, key=lambda item: (item.scope, item.path, item.method))


def route_inventory_payload(schema: dict[str, Any]) -> dict[str, Any]:
    items = build_route_inventory(schema)
    counts = {
        scope: sum(item.scope == scope for item in items)
        for scope in ("canonical", "legacy", "infrastructure")
    }
    return {
        "api_version": settings.api_current_version,
        "canonical_prefix": settings.normalized_api_v1_prefix,
        "legacy_sunset": settings.legacy_api_sunset,
        "total_operations": len(items),
        "counts": counts,
        "routes": [item.as_dict() for item in items],
    }


def route_inventory_markdown(schema: dict[str, Any]) -> str:
    payload = route_inventory_payload(schema)
    lines = [
        "# API Route Inventory",
        "",
        f"- Application version: `{settings.app_version}`",
        f"- API version: `{settings.api_current_version}`",
        f"- Canonical prefix: `{settings.normalized_api_v1_prefix}`",
        f"- Legacy sunset: `{settings.legacy_api_sunset}`",
        f"- Total documented operations: **{payload['total_operations']}**",
        f"- Canonical operations: **{payload['counts']['canonical']}**",
        f"- Legacy operations: **{payload['counts']['legacy']}**",
        f"- Infrastructure operations: **{payload['counts']['infrastructure']}**",
        "",
        "| Scope | Method | Path | Authentication | Deprecated | Operation ID | Summary |",
        "|---|---:|---|---|---:|---|---|",
    ]
    for item in build_route_inventory(schema):
        summary = item.summary.replace("|", "\\|")
        lines.append(
            "| {scope} | `{method}` | `{path}` | {auth} | {deprecated} | "
            "`{operation_id}` | {summary} |".format(
                scope=item.scope,
                method=item.method,
                path=item.path,
                auth=item.authentication,
                deprecated="yes" if item.deprecated else "no",
                operation_id=item.operation_id,
                summary=summary,
            )
        )
    lines.append("")
    return "\n".join(lines)
