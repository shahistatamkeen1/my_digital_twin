import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agent_plan import AgentPlan
from app.models.agent_memory import AgentMemory
from app.services.autonomous_planning_service import create_all_agent_plans

router = APIRouter()


def safe_json(value, default):
    try:
        if not value:
            return default
        return json.loads(value)
    except Exception:
        return default


def serialize_plan(plan: AgentPlan):
    return {
        "id": plan.id,
        "agent_name": plan.agent_name,
        "plan_type": plan.plan_type,
        "title": plan.title,
        "goal": plan.goal,
        "tasks": safe_json(plan.tasks, []),
        "completed_tasks": safe_json(plan.completed_tasks, []),
        "risks": safe_json(plan.risks, []),
        "success_metric": plan.success_metric,
        "status": plan.status,
        "completion_percent": plan.completion_percent,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
    }


@router.post("/generate")
def generate_plans(db: Session = Depends(get_db)):
    plans = create_all_agent_plans(db)

    return {
        "message": "Autonomous plans generated successfully.",
        "count": len(plans),
    }


@router.get("/")
def get_plans(db: Session = Depends(get_db)):
    plans = (
        db.query(AgentPlan)
        .order_by(AgentPlan.created_at.desc())
        .all()
    )

    return [serialize_plan(plan) for plan in plans]


@router.post("/{plan_id}/toggle-task/{task_index}")
def toggle_task_completion(
    plan_id: int,
    task_index: int,
    db: Session = Depends(get_db),
):
    plan = db.query(AgentPlan).filter(AgentPlan.id == plan_id).first()

    if not plan:
        return {"error": "Plan not found"}

    tasks = safe_json(plan.tasks, [])
    completed_tasks = safe_json(plan.completed_tasks, [])

    if task_index < 0 or task_index >= len(tasks):
        return {"error": "Invalid task index"}

    if task_index in completed_tasks:
        completed_tasks.remove(task_index)
    else:
        completed_tasks.append(task_index)

    completion_percent = int((len(completed_tasks) / len(tasks)) * 100) if tasks else 0

    plan.completed_tasks = json.dumps(completed_tasks)
    plan.completion_percent = completion_percent

    if completion_percent == 100:
        plan.status = "completed"
    else:
        plan.status = "active"

    db.commit()
    db.refresh(plan)

    memory_summary = (
        f"{plan.agent_name} plan progress updated to "
        f"{completion_percent}% for goal: {plan.goal}."
    )

    memory = AgentMemory(
        agent_name=plan.agent_name,
        insight_type="Plan Progress",
        summary=memory_summary,
        recommendation=json.dumps([
            "Continue completing planned tasks and review progress regularly."
        ]),
        risks=json.dumps(plan.risks),
        confidence=completion_percent,
        source_question="Autonomous plan task completion update",
    )

    db.add(memory)
    db.commit()

    return serialize_plan(plan)


@router.get("/executive-weekly")
def get_executive_weekly_plan(db: Session = Depends(get_db)):
    plans = (
        db.query(AgentPlan)
        .filter(AgentPlan.status == "active")
        .all()
    )

    all_tasks = []

    for plan in plans:
        tasks = safe_json(plan.tasks, [])
        completed = safe_json(plan.completed_tasks, [])

        for index, task in enumerate(tasks):
            if index not in completed:
                all_tasks.append(
                    {
                        "agent_name": plan.agent_name,
                        "plan_id": plan.id,
                        "task_index": index,
                        "task": task,
                        "goal": plan.goal,
                    }
                )

    career_tasks = []
    finance_tasks = []
    health_tasks = []
    learning_tasks = []

    for task in all_tasks:
        if "Career" in task["agent_name"]:
            career_tasks.append(task)

        elif "Finance" in task["agent_name"]:
            finance_tasks.append(task)

        elif "Health" in task["agent_name"]:
            health_tasks.append(task)

        elif "Learning" in task["agent_name"]:
            learning_tasks.append(task)

    priority_tasks = []

    if career_tasks:
        priority_tasks.extend(career_tasks[:2])

    if learning_tasks:
        priority_tasks.extend(learning_tasks[:2])

    if health_tasks:
        priority_tasks.extend(health_tasks[:2])

    if finance_tasks:
        priority_tasks.extend(finance_tasks[:1])

    return {
        "title": "Unified Weekly Executive Plan",
        "summary": "A cross-agent weekly plan combining Career, Finance, Health, and Learning priorities.",
        "tasks": priority_tasks,
        "active_plan_count": len(plans),
    }