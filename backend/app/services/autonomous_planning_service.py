import json
from sqlalchemy.orm import Session

from app.models.agent_profile import AgentProfile
from app.models.agent_plan import AgentPlan


def safe_json(value, default):
    try:
        if not value:
            return default
        return json.loads(value)
    except Exception:
        return default


def _build_personalized_tasks(agent_name, goal, preferences, risks):
    roles = preferences.get("preferred_roles", [])
    technologies = preferences.get("preferred_technologies", [])
    primary_goals = preferences.get("primary_goals", [])

    tech_focus = ", ".join(technologies[:3]) if technologies else "your current skills"
    role_focus = roles[0] if roles else "your target role"

    if "Career" in agent_name:
        return [
            f"Day 1: Update resume for {role_focus} roles using your strongest projects.",
            f"Day 2: Apply to 5 targeted {role_focus} roles.",
            f"Day 3: Practice interview questions related to {tech_focus}.",
            "Day 4: Improve one GitHub README with screenshots, architecture, and live demo links.",
            "Day 5: Send 3 networking messages to recruiters, alumni, or hiring managers.",
            "Day 6: Review one cloud or AI concept connected to your target role.",
            "Day 7: Review applications, update tracker, and identify next week’s focus.",
        ]

    if "Finance" in agent_name:
        return [
            "Day 1: Update income sources and expected monthly income.",
            "Day 2: Log fixed expenses such as rent, bills, transport, and subscriptions.",
            "Day 3: Add variable expenses from the past 7 days.",
            "Day 4: Create or update one savings goal.",
            "Day 5: Identify one unnecessary expense to reduce.",
            "Day 6: Set a weekly spending limit.",
            "Day 7: Review financial risks and adjust next week’s budget.",
        ]

    if "Health" in agent_name:
        return [
            "Day 1: Log sleep hours, water intake, and current energy level.",
            "Day 2: Complete a 20-minute walk or light workout.",
            "Day 3: Track meals and hydration.",
            "Day 4: Set a consistent sleep target.",
            "Day 5: Complete another light workout or stretching session.",
            "Day 6: Review mood, energy, and sleep quality.",
            "Day 7: Reflect on health consistency and choose one habit to improve.",
        ]

    if "Learning" in agent_name:
        return [
            f"Day 1: Pick one focused learning goal related to {goal}.",
            f"Day 2: Complete one tutorial or lesson on {tech_focus}.",
            "Day 3: Apply the concept to a small project task.",
            "Day 4: Review weak areas and write short notes.",
            "Day 5: Complete one practice exercise.",
            "Day 6: Update GitHub or portfolio with learning progress.",
            "Day 7: Reflect and choose the next learning step.",
        ]

    return [
        "Day 1: Review your current goals.",
        "Day 2: Identify top risks.",
        "Day 3: Complete one meaningful priority.",
        "Day 4: Track progress.",
        "Day 5: Review blockers.",
        "Day 6: Adjust strategy.",
        "Day 7: Reflect and plan next week.",
    ]


def create_plan_for_agent(db: Session, agent_name: str):
    profile = (
        db.query(AgentProfile)
        .filter(AgentProfile.agent_name == agent_name)
        .first()
    )

    if not profile:
        return None

    existing_plan = (
        db.query(AgentPlan)
        .filter(
            AgentPlan.agent_name == agent_name,
            AgentPlan.status == "active",
        )
        .first()
    )

    if existing_plan:
        return existing_plan

    preferences = safe_json(profile.learned_preferences, {})
    recurring_goals = safe_json(profile.recurring_goals, [])
    recurring_risks = safe_json(profile.recurring_risks, [])

    primary_goals = preferences.get("primary_goals", recurring_goals)
    goal = primary_goals[0] if primary_goals else "Improve overall progress"

    if "Career" in agent_name:
        title = "Personalized Career Acceleration Plan"
        success_metric = "Submit targeted applications, improve portfolio evidence, and complete interview practice."
    elif "Finance" in agent_name:
        title = "Personalized Financial Stability Plan"
        success_metric = "Update income, expenses, savings goal, and weekly budget."
    elif "Health" in agent_name:
        title = "Personalized Wellness Consistency Plan"
        success_metric = "Track sleep, hydration, and movement for at least 5 days."
    elif "Learning" in agent_name:
        title = "Personalized Skill Growth Plan"
        success_metric = "Complete one learning module and apply it to a project."
    else:
        title = "Personalized Digital Twin Plan"
        success_metric = "Complete at least 5 meaningful actions this week."

    tasks = _build_personalized_tasks(
        agent_name=agent_name,
        goal=goal,
        preferences=preferences,
        risks=recurring_risks,
    )

    plan = AgentPlan(
        agent_name=agent_name,
        plan_type="7-day",
        title=title,
        goal=goal,
        tasks=json.dumps(tasks),
        completed_tasks=json.dumps([]),
        risks=json.dumps(recurring_risks[:5]),
        success_metric=success_metric,
        status="active",
        completion_percent=0,
    )

    db.add(plan)
    db.commit()
    db.refresh(plan)

    return plan


def create_all_agent_plans(db: Session):
    agent_names = [
        "Career Agent",
        "Finance Agent",
        "Health Agent",
        "Learning Agent",
    ]

    plans = []

    for agent_name in agent_names:
        plan = create_plan_for_agent(db, agent_name)
        if plan:
            plans.append(plan)

    return plans