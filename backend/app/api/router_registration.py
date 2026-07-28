from __future__ import annotations

from collections.abc import Sequence

from fastapi import APIRouter, Depends, FastAPI

from app.config import settings


def versioned_prefix(legacy_prefix: str) -> str:
    """Convert an existing /api prefix to its canonical /api/v1 prefix."""

    if legacy_prefix == "/api":
        return settings.normalized_api_v1_prefix
    if not legacy_prefix.startswith("/api/"):
        raise ValueError(f"Invalid legacy API prefix: {legacy_prefix}")
    return f"{settings.normalized_api_v1_prefix}{legacy_prefix[len('/api'):]}"


def include_versioned_router(
    app: FastAPI,
    router: APIRouter,
    *,
    legacy_prefix: str,
    tags: list[str],
    dependencies: Sequence[Depends] | None = None,
) -> None:
    """Register canonical v1 routes plus optional deprecated legacy aliases."""

    shared_dependencies = list(dependencies or [])

    app.include_router(
        router,
        prefix=versioned_prefix(legacy_prefix),
        tags=[f"v1 / {tag}" for tag in tags],
        dependencies=shared_dependencies,
    )

    if settings.enable_legacy_api_routes:
        app.include_router(
            router,
            prefix=legacy_prefix,
            tags=[f"Legacy / {tag}" for tag in tags],
            dependencies=shared_dependencies,
            deprecated=True,
        )
