from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine
from app.dependencies.auth import get_current_user
from app.services.ownership_schema_service import inspect_ownership_schema

# Import model modules so SQLAlchemy registers every table before optional
# development-time table creation. Alembic will replace create_all in Phase 3.
from app.models import (  # noqa: F401
    agent_memory,
    agent_plan,
    agent_profile,
    agent_reflection,
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
    twin_brief,
    twin_context,
    twin_journal,
    twin_notifications,
    twin_orchestrator,
    twin_recommendation,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

for router, prefix, tags in ROUTERS:
    dependencies = [] if router is auth.router else [Depends(get_current_user)]
    app.include_router(
        router,
        prefix=prefix,
        tags=tags,
        dependencies=dependencies,
    )


@app.get("/")
def home():
    return {
        "message": "My Digital Twin backend is running",
        "environment": settings.environment,
        "version": settings.app_version,
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "environment": settings.environment,
    }


@app.get("/ready")
def readiness_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    ownership = inspect_ownership_schema(engine)

    if not ownership.ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "migration_required",
                "database": "connected",
                "ownership_schema_ready": False,
                "missing_tables": ownership.missing_tables,
                "missing_user_id_columns": ownership.missing_user_id_columns,
                "unowned_rows": ownership.unowned_rows,
            },
        )

    return {
        "status": "ready",
        "database": "connected",
        "ai_configured": bool(settings.openai_api_key),
        "auth_configured": settings.auth_configured,
        "ownership_schema_ready": True,
    }
