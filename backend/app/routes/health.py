from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.health import HealthMemory, HealthHabit
from app.services.health_context_service import get_health_context
from app.services.ai_service import generate_health_insight
from app.services.career_context_service import get_career_context
from app.services.finance_context_service import get_finance_context
from app.services.health_context_service import get_health_context
from app.services.ai_service import generate_health_diet_plan

router = APIRouter()


class HealthMemoryCreate(BaseModel):
    health_goal: str = ""
    diet_preference: str = ""
    fitness_level: str = ""
    sleep_goal_hours: float = 8
    water_goal_cups: int = 8
    workout_goal_minutes: int = 30
    allergies: str = ""
    notes: str = ""

class HealthHabitCreate(BaseModel):
    date: str = ""
    water_cups: int = 0
    sleep_hours: float = 0
    workout_minutes: int = 0
    mood: str = ""
    notes: str = ""

class DietPlanRequest(BaseModel):
    location: str = ""
    budget_level: str = "Moderate"
    schedule_notes: str = ""

@router.get("/memory")
def get_health_memory(db: Session = Depends(get_db)):
    memory = db.query(HealthMemory).order_by(HealthMemory.id.desc()).first()

    if not memory:
        return {
            "health_goal": "",
            "diet_preference": "",
            "fitness_level": "",
            "sleep_goal_hours": 8,
            "water_goal_cups": 8,
            "workout_goal_minutes": 30,
            "allergies": "",
            "notes": "",
        }

    return memory


@router.post("/memory")
def save_health_memory(memory: HealthMemoryCreate, db: Session = Depends(get_db)):
    existing_memory = db.query(HealthMemory).order_by(HealthMemory.id.desc()).first()

    if existing_memory:
        existing_memory.health_goal = memory.health_goal
        existing_memory.diet_preference = memory.diet_preference
        existing_memory.fitness_level = memory.fitness_level
        existing_memory.sleep_goal_hours = memory.sleep_goal_hours
        existing_memory.water_goal_cups = memory.water_goal_cups
        existing_memory.workout_goal_minutes = memory.workout_goal_minutes
        existing_memory.allergies = memory.allergies
        existing_memory.notes = memory.notes

        db.commit()
        db.refresh(existing_memory)
        return existing_memory

    new_memory = HealthMemory(
        health_goal=memory.health_goal,
        diet_preference=memory.diet_preference,
        fitness_level=memory.fitness_level,
        sleep_goal_hours=memory.sleep_goal_hours,
        water_goal_cups=memory.water_goal_cups,
        workout_goal_minutes=memory.workout_goal_minutes,
        allergies=memory.allergies,
        notes=memory.notes,
    )

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return new_memory

@router.get("/habits")
def get_health_habits(db: Session = Depends(get_db)):
    return db.query(HealthHabit).order_by(HealthHabit.id.desc()).all()


@router.post("/habits")
def create_health_habit(habit: HealthHabitCreate, db: Session = Depends(get_db)):
    new_habit = HealthHabit(
        date=habit.date,
        water_cups=habit.water_cups,
        sleep_hours=habit.sleep_hours,
        workout_minutes=habit.workout_minutes,
        mood=habit.mood,
        notes=habit.notes,
    )

    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)

    return new_habit


@router.delete("/habits/{habit_id}")
def delete_health_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(HealthHabit).filter(HealthHabit.id == habit_id).first()

    if not habit:
        return {"error": "Health habit not found"}

    db.delete(habit)
    db.commit()

    return {"message": "Health habit deleted"}

@router.get("/summary")
def health_summary(db: Session = Depends(get_db)):
    habits = db.query(HealthHabit).all()
    memory = db.query(HealthMemory).order_by(HealthMemory.id.desc()).first()

    total_water = sum(h.water_cups for h in habits)
    total_sleep = sum(h.sleep_hours for h in habits)
    total_workout = sum(h.workout_minutes for h in habits)

    habit_count = len(habits)

    avg_water = round(total_water / habit_count, 1) if habit_count > 0 else 0
    avg_sleep = round(total_sleep / habit_count, 1) if habit_count > 0 else 0
    avg_workout = round(total_workout / habit_count, 1) if habit_count > 0 else 0

    water_goal = memory.water_goal_cups if memory else 8
    sleep_goal = memory.sleep_goal_hours if memory else 8
    workout_goal = memory.workout_goal_minutes if memory else 30

    water_score = min(round((avg_water / water_goal) * 100), 100) if water_goal > 0 else 0
    sleep_score = min(round((avg_sleep / sleep_goal) * 100), 100) if sleep_goal > 0 else 0
    workout_score = min(round((avg_workout / workout_goal) * 100), 100) if workout_goal > 0 else 0

    wellness_score = round((water_score + sleep_score + workout_score) / 3)

    return {
        "avg_water": avg_water,
        "avg_sleep": avg_sleep,
        "avg_workout": avg_workout,
        "wellness_score": wellness_score,
        "habit_count": habit_count,
        "water_goal": water_goal,
        "sleep_goal": sleep_goal,
        "workout_goal": workout_goal,
    }
    
@router.get("/insight")
def health_insight(db: Session = Depends(get_db)):
    context = get_health_context(db)

    insight = generate_health_insight(context)

    return {
        "insight": insight
    }
    
@router.post("/diet-plan")
def health_diet_plan(req: DietPlanRequest, db: Session = Depends(get_db)):
    career_context = get_career_context(db)
    finance_context = get_finance_context(db)
    health_context = get_health_context(db)

    context = {
        "career_context": career_context,
        "finance_context": finance_context,
        "health_context": health_context,
    }

    result = generate_health_diet_plan(
        context=context,
        location=req.location,
        budget_level=req.budget_level,
        schedule_notes=req.schedule_notes,
    )

    if not isinstance(result, dict):
        return {
            "diet_title": "Personalized Diet Plan",
            "summary": "The AI response was not in the expected format. Please try again.",
            "daily_schedule": [],
            "meal_plan": [],
            "grocery_items": [],
            "local_searches": [],
            "budget_tip": "",
            "health_note": "",
        }

    raw_searches = result.get("local_searches", [])
    fixed_searches = []

    if isinstance(raw_searches, list):
        for item in raw_searches:
            if isinstance(item, str):
                query = item
                label = item
            elif isinstance(item, dict):
                query = str(item.get("query", ""))
                label = str(item.get("label", query))
            else:
                continue

            if query:
                fixed_searches.append(
                    {
                        "label": label,
                        "query": query,
                        "maps_url": (
    "https://www.google.com/maps/search/"
    + query.replace(" ", "+")
    + "+near+"
    + req.location.replace(" ", "+")
),
                    }
                )

    elif isinstance(raw_searches, str):
        fixed_searches.append(
            {
                "label": raw_searches,
                "query": raw_searches,
                "maps_url": (
                    "https://www.google.com/maps/search/"
                    + raw_searches.replace(" ", "+")
                    + "+"
                    + req.location.replace(" ", "+")
                ),
            }
        )

    result["local_searches"] = fixed_searches

    result.setdefault("diet_title", "Personalized Diet Plan")
    result.setdefault("summary", "")
    result.setdefault("daily_schedule", [])
    result.setdefault("meal_plan", [])
    result.setdefault("grocery_items", [])
    result.setdefault("budget_tip", "")
    result.setdefault("health_note", "")

    return result