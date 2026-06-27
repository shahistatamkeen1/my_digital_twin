from sqlalchemy.orm import Session

from app.models.personal_memory import PersonalMemory


def get_personal_memory_context(db: Session):
    memory = db.query(PersonalMemory).order_by(PersonalMemory.id.desc()).first()

    if not memory:
        return {
            "name": "",
            "location": "",
            "timezone": "",
            "current_status": "",
            "long_term_goals": "",
            "daily_schedule": "",
            "communication_style": "",
            "life_priorities": "",
            "notes": "",
        }

    return {
        "name": memory.name or "",
        "location": memory.location or "",
        "timezone": memory.timezone or "",
        "current_status": memory.current_status or "",
        "long_term_goals": memory.long_term_goals or "",
        "daily_schedule": memory.daily_schedule or "",
        "communication_style": memory.communication_style or "",
        "life_priorities": memory.life_priorities or "",
        "notes": memory.notes or "",
    }