from sqlalchemy.orm import Session

from app.models.health import HealthMemory, HealthHabit


def get_health_context(db: Session):
    memory = db.query(HealthMemory).order_by(HealthMemory.id.desc()).first()
    habits = db.query(HealthHabit).all()

    habit_count = len(habits)

    total_water = sum(h.water_cups for h in habits)
    total_sleep = sum(h.sleep_hours for h in habits)
    total_workout = sum(h.workout_minutes for h in habits)

    avg_water = round(total_water / habit_count, 1) if habit_count else 0
    avg_sleep = round(total_sleep / habit_count, 1) if habit_count else 0
    avg_workout = round(total_workout / habit_count, 1) if habit_count else 0

    return {
        "health_memory": {
            "health_goal": memory.health_goal if memory else "",
            "diet_preference": memory.diet_preference if memory else "",
            "fitness_level": memory.fitness_level if memory else "",
            "sleep_goal_hours": memory.sleep_goal_hours if memory else 8,
            "water_goal_cups": memory.water_goal_cups if memory else 8,
            "workout_goal_minutes": memory.workout_goal_minutes if memory else 30,
            "allergies": memory.allergies if memory else "",
            "notes": memory.notes if memory else "",
        },
        "habit_summary": {
            "habit_count": habit_count,
            "avg_water": avg_water,
            "avg_sleep": avg_sleep,
            "avg_workout": avg_workout,
        },
        "recent_habits": [
            {
                "date": habit.date,
                "water_cups": habit.water_cups,
                "sleep_hours": habit.sleep_hours,
                "workout_minutes": habit.workout_minutes,
                "mood": habit.mood,
                "notes": habit.notes,
            }
            for habit in habits[-10:]
        ],
    }