from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.contracts import ApiErrorResponse
from app.api.exception_handlers import register_exception_handlers
from app.api.middleware import request_context_middleware
from app.api.openapi import configure_openapi, stable_operation_id
from app.api.router_registration import include_versioned_router
from app.config import settings
from app.database import engine
from app.dependencies.auth import get_current_user
from app.logging_config import configure_logging

# Import every model module so SQLAlchemy metadata is complete for Alembic.
from app.models import (  # noqa: F401
    agent_memory,
    agent_plan,
    agent_profile,
    agent_reflection,
    agent_run,
    application,
    finance,
    health,
    learning,
    learning_progress,
    memory,
    personal_memory,
    roadmap,
    twin_snapshot,
    user,
)
from app.routes import (
    agent_memory as agent_memory_routes,
    agent_plans,
    agent_profiles,
    agent_reflections,
    agent_registry,
    agent_runs,
    applications,
    ats_resume,
    auth,
    autofill,
    career_intelligence,
    chat,
    cover_letter,
    finance as finance_routes,
    finance_chat,
    health as health_routes,
    health_chat,
    interview,
    job_match,
    jobs,
    learning as learning_routes,
    learning_chat,
    learning_progress as learning_progress_routes,
    learning_recommendations,
    master_context,
    memory as memory_routes,
    personal_memory as personal_memory_routes,
    predictive_insights,
    progress,
    recommendations,
    resource_recommendations,
    resume,
    resume_tailor,
    roadmap as roadmap_routes,
    system as system_routes,
    twin_brief,
    twin_context,
    twin_journal,
    twin_notifications,
    twin_orchestrator,
    twin_recommendation,
)


configure_logging()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if settings.api_docs_enabled else None,
    redoc_url="/redoc" if settings.api_docs_enabled else None,
    openapi_url="/openapi.json" if settings.api_docs_enabled else None,
    generate_unique_id_function=stable_operation_id,
    responses={
        400: {"model": ApiErrorResponse, "description": "Bad request"},
        401: {"model": ApiErrorResponse, "description": "Authentication required"},
        403: {"model": ApiErrorResponse, "description": "Forbidden"},
        404: {"model": ApiErrorResponse, "description": "Not found"},
        409: {"model": ApiErrorResponse, "description": "Conflict"},
        422: {"model": ApiErrorResponse, "description": "Validation error"},
        500: {"model": ApiErrorResponse, "description": "Internal server error"},
        503: {"model": ApiErrorResponse, "description": "Service unavailable"},
    },
)

app.middleware("http")(request_context_middleware)
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        settings.request_id_header,
        settings.api_version_header,
        "Deprecation",
        "Sunset",
        "Warning",
        "Link",
        "X-Total-Count",
        "X-Page",
        "X-Page-Size",
        "X-Total-Pages",
        "X-Pagination-Mode",
        "X-Sort-By",
        "X-Sort-Order",
    ],
)


ROUTERS = (
    (auth.router, "/api/auth", ["Authentication"]),
    (resume.router, "/api/resume", ["Resume"]),
    (chat.router, "/api/chat", ["Chat"]),
    (job_match.router, "/api/job-match", ["Job Match"]),
    (ats_resume.router, "/api/ats-resume", ["ATS Resume"]),
    (recommendations.router, "/api/recommendations", ["Recommendations"]),
    (applications.router, "/api/applications", ["Applications"]),
    (memory_routes.router, "/api/memory", ["Career Memory"]),
    (roadmap_routes.router, "/api/roadmap", ["Career Roadmap"]),
    (jobs.router, "/api/jobs", ["Jobs"]),
    (interview.router, "/api/interview", ["Interview"]),
    (cover_letter.router, "/api/cover-letter", ["Cover Letter"]),
    (
        career_intelligence.router,
        "/api/career-intelligence",
        ["Career Intelligence"],
    ),
    (resume_tailor.router, "/api/resume-tailor", ["Resume Tailor"]),
    (
        twin_recommendation.router,
        "/api/twin-recommendation",
        ["Twin Recommendation"],
    ),
    (finance_routes.router, "/api/finance", ["Finance"]),
    (finance_chat.router, "/api/finance-chat", ["Finance Chat"]),
    (
        twin_orchestrator.router,
        "/api/twin-orchestrator",
        ["Twin Orchestrator"],
    ),
    (health_routes.router, "/api/health", ["Health"]),
    (health_chat.router, "/api/health-chat", ["Health Chat"]),
    (
        personal_memory_routes.router,
        "/api/personal-memory",
        ["Personal Memory"],
    ),
    (twin_brief.router, "/api/twin-brief", ["Twin Brief"]),
    (
        twin_notifications.router,
        "/api/twin-notifications",
        ["Twin Notifications"],
    ),
    (master_context.router, "/api/master-context", ["Master Context"]),
    (learning_routes.router, "/api/learning", ["Learning"]),
    (learning_chat.router, "/api/learning-chat", ["Learning Chat"]),
    (
        learning_recommendations.router,
        "/api/learning-recommendations",
        ["Learning Recommendations"],
    ),
    (
        learning_progress_routes.router,
        "/api/learning-progress",
        ["Learning Progress"],
    ),
    (
        resource_recommendations.router,
        "/api/resource-recommendations",
        ["Resource Recommendations"],
    ),
    (progress.router, "/api/progress", ["Progress"]),
    (agent_memory_routes.router, "/api/agent-memory", ["Agent Memory"]),
    (agent_profiles.router, "/api/agent-profiles", ["Agent Profiles"]),
    (agent_registry.router, "/api/agents", ["Agent Registry"]),
    (agent_runs.router, "/api/agent-runs", ["Agent Runs"]),
    (
        agent_reflections.router,
        "/api/agent-reflections",
        ["Agent Reflections"],
    ),
    (twin_journal.router, "/api/twin-journal", ["Twin Journal"]),
    (agent_plans.router, "/api/agent-plans", ["Agent Plans"]),
    (
        predictive_insights.router,
        "/api/predictive-insights",
        ["Predictive Insights"],
    ),
    (twin_context.router, "/api/twin-context", ["Twin Context"]),
    (autofill.router, "/api/autofill", ["Application Autofill"]),
)

for router, legacy_prefix, tags in ROUTERS:
    dependencies = [] if router is auth.router else [Depends(get_current_user)]
    include_versioned_router(
        app,
        router,
        legacy_prefix=legacy_prefix,
        tags=tags,
        dependencies=dependencies,
    )


# Infrastructure-compatible root probes and canonical v1 system endpoints.
# These routes are intentionally registered outside the authenticated domain
# router loop. Only the detailed diagnostics endpoint requires authentication.
app.include_router(system_routes.infrastructure_router)
app.include_router(
    system_routes.api_router,
    prefix=f"{settings.normalized_api_v1_prefix}/system",
)

# Install the enriched full OpenAPI contract and canonical v1-only docs after
# every application route has been registered.
configure_openapi(app)
