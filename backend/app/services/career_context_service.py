from sqlalchemy.orm import Session

from app.models.memory import CareerMemory
from app.models.application import Application
from app.models.roadmap import CareerRoadmap


def get_career_context(db: Session):
    memory = db.query(CareerMemory).order_by(CareerMemory.id.desc()).first()
    applications = db.query(Application).all()
    roadmap = db.query(CareerRoadmap).all()

    total_applications = len(applications)
    saved = len([a for a in applications if a.status == "Saved"])
    applied = len([a for a in applications if a.status == "Applied"])
    interviews = len([a for a in applications if a.status == "Interview"])
    offers = len([a for a in applications if a.status == "Offer"])
    rejected = len([a for a in applications if a.status == "Rejected"])

    total_roadmap = len(roadmap)
    completed_roadmap = len([r for r in roadmap if r.completed])

    roadmap_progress = 0
    if total_roadmap > 0:
        roadmap_progress = round((completed_roadmap / total_roadmap) * 100)

    recent_applications = [
        {
            "company": app.company,
            "role": app.role,
            "location": app.location,
            "status": app.status,
            "date_applied": app.date_applied,
            "notes": app.notes,
        }
        for app in applications[-5:]
    ]

    return {
        "memory": {
            "career_goal": memory.career_goal if memory else "",
            "target_role": memory.target_role if memory else "",
            "current_skills": memory.current_skills if memory else "",
            "skills_to_learn": memory.skills_to_learn if memory else "",
            "notes": memory.notes if memory else "",
        },
        "application_summary": {
            "total_applications": total_applications,
            "saved": saved,
            "applied": applied,
            "interviews": interviews,
            "offers": offers,
            "rejected": rejected,
        },
        "roadmap_summary": {
            "total_items": total_roadmap,
            "completed_items": completed_roadmap,
            "progress": roadmap_progress,
        },
        "recent_applications": recent_applications,
    }