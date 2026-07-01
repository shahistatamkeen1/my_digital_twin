from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.learning import LearningMemory
from app.models.learning_progress import LearningProgress
from app.services.ai_service import ask_ai_json, ask_ai

router = APIRouter()


class ProgressCreate(BaseModel):
    topic: str
    task: str


class ProgressUpdate(BaseModel):
    completed: Optional[bool] = None


@router.get("/")
def get_progress(db: Session = Depends(get_db)):
    tasks = db.query(LearningProgress).order_by(LearningProgress.id.desc()).all()

    total = len(tasks)
    completed = len([task for task in tasks if task.completed])

    progress_percentage = round((completed / total) * 100) if total > 0 else 0

    return {
        "tasks": tasks,
        "summary": {
            "total_tasks": total,
            "completed_tasks": completed,
            "remaining_tasks": total - completed,
            "progress_percentage": progress_percentage,
        },
    }


@router.post("/")
def create_progress_task(item: ProgressCreate, db: Session = Depends(get_db)):
    task = LearningProgress(topic=item.topic, task=item.task)

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


@router.put("/{task_id}")
def update_progress_task(
    task_id: int,
    item: ProgressUpdate,
    db: Session = Depends(get_db),
):
    task = db.query(LearningProgress).filter(
        LearningProgress.id == task_id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if item.completed is not None:
        task.completed = item.completed

    db.commit()
    db.refresh(task)

    return task


@router.delete("/{task_id}")
def delete_progress_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(LearningProgress).filter(
        LearningProgress.id == task_id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}


@router.post("/generate")
def generate_learning_tasks(db: Session = Depends(get_db)):
    learning_items = db.query(LearningMemory).order_by(LearningMemory.id.desc()).all()

    learning_context = [
        {
            "topic": item.topic,
            "category": item.category,
            "current_level": item.current_level,
            "target_level": item.target_level,
            "resource": item.resource,
            "notes": item.notes,
            "status": item.status,
        }
        for item in learning_items
    ]

    system_prompt = """
You are the Learning Progress Planner inside My Digital Twin.

Create practical learning tasks based on the user's saved learning goals.

Return ONLY valid JSON.

The JSON must be:
{
  "tasks": [
    {
      "topic": "topic name",
      "task": "short practical task"
    }
  ]
}

Rules:
- Create 5 to 8 tasks total.
- Tasks must be specific and realistic.
- Do not create long tasks.
- Do not include markdown.
- Focus on what the user should complete next.
"""

    user_prompt = f"""
Saved Learning Goals:
{learning_context}

Generate learning progress tasks.
"""

    result = ask_ai_json(system_prompt, user_prompt, temperature=0.3)

    tasks = result.get("tasks", [])

    created_tasks = []

    for item in tasks:
        topic = item.get("topic")
        task_text = item.get("task")

        if not topic or not task_text:
            continue

        task = LearningProgress(topic=topic, task=task_text)
        db.add(task)
        created_tasks.append(task)

    db.commit()

    for task in created_tasks:
        db.refresh(task)

    return {
        "message": "Learning tasks generated successfully",
        "tasks": created_tasks,
    }


@router.get("/next-task")
def get_next_learning_task(db: Session = Depends(get_db)):
    learning_items = db.query(LearningMemory).order_by(LearningMemory.id.desc()).all()
    progress_tasks = db.query(LearningProgress).order_by(LearningProgress.id.desc()).all()

    learning_context = [
        {
            "topic": item.topic,
            "category": item.category,
            "current_level": item.current_level,
            "target_level": item.target_level,
            "resource": item.resource,
            "notes": item.notes,
            "status": item.status,
        }
        for item in learning_items
    ]

    task_context = [
        {
            "topic": task.topic,
            "task": task.task,
            "completed": task.completed,
        }
        for task in progress_tasks
    ]

    system_prompt = """
You are the Learning Twin inside My Digital Twin.

Tell the user the single best learning task they should do next.

Rules:
- Be short and practical.
- Use a friendly tone.
- Explain why this task matters.
- Give one clear action for today.
"""

    user_prompt = f"""
Learning Goals:
{learning_context}

Progress Tasks:
{task_context}

What is the user's next best learning task?
"""

    reply = ask_ai(system_prompt, user_prompt, temperature=0.3)

    return {"next_task": reply}