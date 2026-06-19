from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import resume, chat, job_match, ats_resume, recommendations, applications, memory, roadmap, jobs, interview, cover_letter
from app.models import application, memory as memory_model, roadmap as roadmap_model

from app.routes import interview

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
@app.get("/")
def home():
    return {"message": "My Digital Twin backend is running"}