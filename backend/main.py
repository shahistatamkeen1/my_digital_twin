from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import resume, chat, job_match, ats_resume, recommendations, applications, memory, roadmap, jobs, interview, cover_letter, career_intelligence, autofill
from app.models import application, memory as memory_model, roadmap as roadmap_model
from app.routes import career_intelligence
from app.routes import interview
from app.routes import resume_tailor
from app.routes import twin_context
from app.routes import twin_recommendation
from app.models import finance as finance_model
from app.routes import finance
from app.routes import finance_chat
from app.routes import twin_orchestrator
from app.models import health as health_model
from app.routes import health
from app.routes import health_chat
from app.models import personal_memory as personal_memory_model
from app.routes import personal_memory
from app.routes import twin_brief

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "chrome-extension://*"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(job_match.router, prefix="/api/job-match", tags=["Job Match"])
app.include_router(ats_resume.router, prefix="/api/ats-resume", tags=["ATS Resume"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(memory.router, prefix="/api/memory", tags=["Career Memory"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["Career Roadmap"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(cover_letter.router, prefix="/api/cover-letter", tags=["Cover Letter"])
app.include_router(
    career_intelligence.router,
    prefix="/api/career-intelligence",
    tags=["Career Intelligence"]
)
app.include_router(
    resume_tailor.router,
    prefix="/api/resume-tailor",
    tags=["Resume Tailor"]
)
app.include_router(
    twin_recommendation.router,
    prefix="/api/twin-recommendation",
    tags=["Twin Recommendation"]
)
app.include_router(
    finance.router,
    prefix="/api/finance",
    tags=["Finance"]
)
app.include_router(
    finance_chat.router,
    prefix="/api/finance-chat",
    tags=["Finance Chat"]
)
app.include_router(
    twin_orchestrator.router,
    prefix="/api/twin-orchestrator",
    tags=["Twin Orchestrator"]
)
app.include_router(
    health.router,
    prefix="/api/health",
    tags=["Health"]
)
app.include_router(
    health_chat.router,
    prefix="/api/health-chat",
    tags=["Health Chat"]
)
app.include_router(
    personal_memory.router,
    prefix="/api/personal-memory",
    tags=["Personal Memory"]
)
app.include_router(
    twin_brief.router,
    prefix="/api/twin-brief",
    tags=["Twin Brief"]
)
app.include_router(twin_context.router, prefix="/api/twin-context", tags=["Twin Context"])
app.include_router(autofill.router, prefix="/api/autofill", tags=["Application Autofill"])
@app.get("/")
def home():
    return {"message": "My Digital Twin backend is running"}