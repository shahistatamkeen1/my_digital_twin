
from __future__ import annotations

import copy
import logging
import os
import platform
import shutil
import sys
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from time import monotonic, perf_counter
from typing import Any

from sqlalchemy import Engine, text

from app.config import settings
from app.services.migration_status_service import inspect_migration_status
from app.services.ownership_schema_service import inspect_ownership_schema
from app.services.schema_optimization_service import inspect_schema_optimization

try:  # psutil is installed by Phase 4D, but monitoring must fail safely.
    import psutil
except ImportError:  # pragma: no cover - defensive fallback.
    psutil = None


logger = logging.getLogger("my_digital_twin.monitoring")
BACKEND_ROOT = Path(__file__).resolve().parents[2]
_FALLBACK_STARTED_AT = datetime.now(timezone.utc)
_CACHE_LOCK = threading.RLock()
_CACHE: dict[tuple[int, bool], tuple[float, dict[str, Any]]] = {}


@dataclass(frozen=True)
class MonitoringSnapshot:
    ready: bool
    payload: dict[str, Any]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _round(value: float, digits: int = 2) -> float:
    return round(float(value), digits)


def _safe_exception_name(exc: Exception) -> str:
    """Return only the exception class, never a URL or credential-bearing text."""

    return type(exc).__name__


def _process_started_at() -> datetime:
    if psutil is None:
        return _FALLBACK_STARTED_AT

    try:
        return datetime.fromtimestamp(
            psutil.Process(os.getpid()).create_time(),
            tz=timezone.utc,
        )
    except Exception:
        return _FALLBACK_STARTED_AT


def _uptime_seconds(now: datetime) -> int:
    return max(0, int((now - _process_started_at()).total_seconds()))


def _database_check(engine: Engine) -> dict[str, Any]:
    started = perf_counter()

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1")).scalar_one()
        return {
            "status": "healthy",
            "latency_ms": _round((perf_counter() - started) * 1000),
            "dialect": engine.dialect.name,
            "driver": engine.url.drivername,
        }
    except Exception as exc:
        logger.warning(
            "Database health check failed",
            extra={
                "event": "monitoring_database_failure",
                "exception_type": _safe_exception_name(exc),
            },
        )
        return {
            "status": "unhealthy",
            "latency_ms": _round((perf_counter() - started) * 1000),
            "dialect": engine.dialect.name,
            "driver": engine.url.drivername,
            "error_type": _safe_exception_name(exc),
        }


def _migration_check(engine: Engine) -> dict[str, Any]:
    try:
        result = inspect_migration_status(engine)
        return {
            "status": "healthy" if result.ready else "unhealthy",
            "current_heads": list(result.current_heads),
            "expected_heads": list(result.expected_heads),
            "alembic_config_found": result.alembic_config_found,
        }
    except Exception as exc:
        logger.warning(
            "Migration health check failed",
            extra={
                "event": "monitoring_migration_failure",
                "exception_type": _safe_exception_name(exc),
            },
        )
        return {
            "status": "unhealthy",
            "current_heads": [],
            "expected_heads": [],
            "alembic_config_found": False,
            "error_type": _safe_exception_name(exc),
        }


def _ownership_check(engine: Engine, *, detailed: bool) -> dict[str, Any]:
    try:
        result = inspect_ownership_schema(engine)
        payload: dict[str, Any] = {
            "status": "healthy" if result.ready else "unhealthy",
            "missing_table_count": len(result.missing_tables),
            "missing_user_id_column_count": len(result.missing_user_id_columns),
            "unowned_table_count": len(result.unowned_rows),
            "unowned_row_count": sum(result.unowned_rows.values()),
        }
        if detailed:
            payload.update(
                {
                    "missing_tables": list(result.missing_tables),
                    "missing_user_id_columns": list(
                        result.missing_user_id_columns
                    ),
                    "unowned_rows": dict(result.unowned_rows),
                }
            )
        return payload
    except Exception as exc:
        logger.warning(
            "Ownership schema health check failed",
            extra={
                "event": "monitoring_ownership_failure",
                "exception_type": _safe_exception_name(exc),
            },
        )
        return {
            "status": "unhealthy",
            "error_type": _safe_exception_name(exc),
        }


def _optimization_check(engine: Engine, *, detailed: bool) -> dict[str, Any]:
    try:
        result = inspect_schema_optimization(engine)
        payload: dict[str, Any] = {
            "status": "healthy" if result.ready else "unhealthy",
            "missing_index_count": len(result.missing_indexes),
            "missing_check_constraint_count": len(
                result.missing_check_constraints
            ),
            "nullable_column_count": len(result.nullable_columns),
            "timestamp_issue_count": len(result.timestamp_issues),
            "missing_server_default_count": len(
                result.missing_server_defaults
            ),
        }
        if detailed:
            payload.update(
                {
                    "missing_indexes": list(result.missing_indexes),
                    "missing_check_constraints": list(
                        result.missing_check_constraints
                    ),
                    "nullable_columns": list(result.nullable_columns),
                    "timestamp_issues": list(result.timestamp_issues),
                    "missing_server_defaults": list(
                        result.missing_server_defaults
                    ),
                }
            )
        return payload
    except Exception as exc:
        logger.warning(
            "Schema optimization health check failed",
            extra={
                "event": "monitoring_optimization_failure",
                "exception_type": _safe_exception_name(exc),
            },
        )
        return {
            "status": "unhealthy",
            "error_type": _safe_exception_name(exc),
        }


def _disk_check() -> dict[str, Any]:
    try:
        usage = shutil.disk_usage(BACKEND_ROOT)
        percent = (usage.used / usage.total * 100) if usage.total else 0.0
        if percent >= settings.monitoring_disk_critical_percent:
            status = "critical"
        elif percent >= settings.monitoring_disk_warning_percent:
            status = "warning"
        else:
            status = "healthy"

        gb = 1024 ** 3
        return {
            "status": status,
            "usage_percent": _round(percent),
            "free_gb": _round(usage.free / gb),
            "total_gb": _round(usage.total / gb),
            "warning_percent": settings.monitoring_disk_warning_percent,
            "critical_percent": settings.monitoring_disk_critical_percent,
        }
    except Exception as exc:
        return {
            "status": "unknown",
            "error_type": _safe_exception_name(exc),
        }


def _memory_check() -> dict[str, Any]:
    if psutil is None or not settings.monitoring_include_process_metrics:
        return {"status": "unavailable"}

    try:
        process = psutil.Process(os.getpid())
        system_memory = psutil.virtual_memory()
        rss_mb = process.memory_info().rss / (1024 ** 2)
        status = (
            "warning"
            if system_memory.percent
            >= settings.monitoring_memory_warning_percent
            else "healthy"
        )
        return {
            "status": status,
            "system_usage_percent": _round(system_memory.percent),
            "process_rss_mb": _round(rss_mb),
            "warning_percent": settings.monitoring_memory_warning_percent,
        }
    except Exception as exc:
        return {
            "status": "unknown",
            "error_type": _safe_exception_name(exc),
        }


def _pool_diagnostics(engine: Engine) -> dict[str, Any]:
    pool = engine.pool
    result: dict[str, Any] = {"class": type(pool).__name__}

    for name in ("size", "checkedin", "checkedout", "overflow"):
        method = getattr(pool, name, None)
        if not callable(method):
            continue
        try:
            result[name] = method()
        except Exception:
            continue

    return result


def _process_diagnostics(now: datetime) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "pid": os.getpid(),
        "started_at": _process_started_at().isoformat(),
        "uptime_seconds": _uptime_seconds(now),
    }

    if psutil is not None and settings.monitoring_include_process_metrics:
        try:
            process = psutil.Process(os.getpid())
            payload.update(
                {
                    "thread_count": process.num_threads(),
                    "open_file_count": len(process.open_files()),
                }
            )
        except Exception:
            pass

    return payload


def _runtime_diagnostics() -> dict[str, Any]:
    return {
        "python_version": platform.python_version(),
        "implementation": platform.python_implementation(),
        "operating_system": platform.system(),
        "architecture": platform.machine(),
        "executable_name": Path(sys.executable).name,
    }


def _is_required_check_healthy(
    checks: dict[str, dict[str, Any]],
) -> bool:
    required_names = (
        "database",
        "migrations",
        "ownership_schema",
        "schema_optimization",
    )
    if any(checks[name].get("status") != "healthy" for name in required_names):
        return False

    if settings.readiness_require_auth and (
        checks["authentication"].get("status") != "configured"
    ):
        return False

    if settings.readiness_require_ai and (
        checks["ai"].get("status") != "configured"
    ):
        return False

    if checks["disk"].get("status") == "critical":
        return False

    return True


def _compute_snapshot(
    engine: Engine,
    *,
    include_diagnostics: bool,
) -> dict[str, Any]:
    started = perf_counter()
    now = _utc_now()

    database = _database_check(engine)
    migrations = (
        _migration_check(engine)
        if database["status"] == "healthy"
        else {
            "status": "unhealthy",
            "current_heads": [],
            "expected_heads": [],
            "alembic_config_found": False,
            "skipped": "database_unavailable",
        }
    )
    ownership = (
        _ownership_check(engine, detailed=include_diagnostics)
        if database["status"] == "healthy"
        else {"status": "unhealthy", "skipped": "database_unavailable"}
    )
    optimization = (
        _optimization_check(engine, detailed=include_diagnostics)
        if database["status"] == "healthy"
        else {"status": "unhealthy", "skipped": "database_unavailable"}
    )

    checks: dict[str, dict[str, Any]] = {
        "database": database,
        "migrations": migrations,
        "ownership_schema": ownership,
        "schema_optimization": optimization,
        "authentication": {
            "status": "configured" if settings.auth_configured else "not_configured",
            "required": settings.readiness_require_auth,
        },
        "ai": {
            "status": "configured" if settings.openai_api_key else "not_configured",
            "required": settings.readiness_require_ai,
            "provider_connectivity_tested": False,
        },
        "disk": _disk_check(),
        "memory": _memory_check(),
    }

    ready = _is_required_check_healthy(checks)
    current_heads = migrations.get("current_heads", [])
    payload: dict[str, Any] = {
        "status": "ready" if ready else "not_ready",
        "overall_status": "operational" if ready else "degraded",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": now.isoformat(),
        "uptime_seconds": _uptime_seconds(now),
        "check_duration_ms": _round((perf_counter() - started) * 1000),
        "checks": checks,
        # Backward-compatible fields retained from Phase 3/4B.
        "database": (
            "connected" if database["status"] == "healthy" else "unavailable"
        ),
        "ai_configured": bool(settings.openai_api_key),
        "auth_configured": settings.auth_configured,
        "migration_schema_ready": migrations.get("status") == "healthy",
        "ownership_schema_ready": ownership.get("status") == "healthy",
        "schema_optimization_ready": optimization.get("status") == "healthy",
        "database_dialect": engine.dialect.name,
        "database_driver": engine.url.drivername,
        "migration_heads": list(current_heads),
    }

    if include_diagnostics:
        payload["diagnostics"] = {
            "process": _process_diagnostics(now),
            "runtime": _runtime_diagnostics(),
            "database_pool": _pool_diagnostics(engine),
            "monitoring_policy": {
                "cache_ttl_seconds": settings.monitoring_cache_ttl_seconds,
                "readiness_requires_auth": settings.readiness_require_auth,
                "readiness_requires_ai": settings.readiness_require_ai,
                "process_metrics_enabled": (
                    settings.monitoring_include_process_metrics
                ),
            },
        }

    return payload


def clear_monitoring_cache() -> None:
    with _CACHE_LOCK:
        _CACHE.clear()


def collect_monitoring_snapshot(
    engine: Engine,
    *,
    include_diagnostics: bool = False,
    force_refresh: bool = False,
) -> MonitoringSnapshot:
    """Collect safe health data, caching expensive schema checks briefly."""

    ttl = settings.monitoring_cache_ttl_seconds
    key = (id(engine), include_diagnostics)
    now = monotonic()

    if ttl > 0 and not force_refresh:
        with _CACHE_LOCK:
            cached = _CACHE.get(key)
            if cached is not None and cached[0] > now:
                payload = copy.deepcopy(cached[1])
                payload["cache"] = {
                    "status": "hit",
                    "ttl_seconds": ttl,
                }
                return MonitoringSnapshot(
                    ready=payload.get("status") == "ready",
                    payload=payload,
                )

    payload = _compute_snapshot(
        engine,
        include_diagnostics=include_diagnostics,
    )
    payload["cache"] = {
        "status": "miss",
        "ttl_seconds": ttl,
    }

    if ttl > 0:
        with _CACHE_LOCK:
            _CACHE[key] = (monotonic() + ttl, copy.deepcopy(payload))

    return MonitoringSnapshot(
        ready=payload["status"] == "ready",
        payload=payload,
    )


def liveness_payload() -> dict[str, Any]:
    now = _utc_now()
    return {
        "status": "alive",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": now.isoformat(),
        "uptime_seconds": _uptime_seconds(now),
    }


def health_payload() -> dict[str, Any]:
    now = _utc_now()
    return {
        "status": "healthy",
        "service": settings.app_name,
        "environment": settings.environment,
        "version": settings.app_version,
        "timestamp": now.isoformat(),
        "uptime_seconds": _uptime_seconds(now),
    }


def public_status_payload(snapshot: MonitoringSnapshot) -> dict[str, Any]:
    payload = snapshot.payload
    checks = payload["checks"]

    return {
        "status": payload["overall_status"],
        "ready": snapshot.ready,
        "service": payload["service"],
        "version": payload["version"],
        "environment": payload["environment"],
        "timestamp": payload["timestamp"],
        "uptime_seconds": payload["uptime_seconds"],
        "check_duration_ms": payload["check_duration_ms"],
        "checks": {
            name: {"status": check.get("status", "unknown")}
            for name, check in checks.items()
        },
    }
