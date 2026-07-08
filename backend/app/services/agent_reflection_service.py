import json
from sqlalchemy.orm import Session

from app.models.agent_profile import AgentProfile
from app.models.agent_reflection import AgentReflection


def safe_json(value, default):
    try:
        if not value:
            return default
        return json.loads(value)
    except Exception:
        return default


def generate_agent_reflection(db: Session, agent_name: str):
    profile = (
        db.query(AgentProfile)
        .filter(AgentProfile.agent_name == agent_name)
        .first()
    )

    if not profile:
        return None

    learned_preferences = safe_json(profile.learned_preferences, {})
    behavior_patterns = safe_json(profile.behavior_patterns, {})
    recurring_goals = safe_json(profile.recurring_goals, [])
    recurring_risks = safe_json(profile.recurring_risks, [])

    preferred_roles = learned_preferences.get("preferred_roles", [])
    preferred_technologies = learned_preferences.get(
        "preferred_technologies", []
    )
    primary_goals = learned_preferences.get("primary_goals", [])

    wins = []

    if primary_goals:
        wins.append(
            f"Identified {len(primary_goals)} active goal areas."
        )

    if preferred_roles:
        wins.append(
            f"Detected role focus: {', '.join(preferred_roles[:3])}."
        )

    if preferred_technologies:
        wins.append(
            f"Detected technology focus: {', '.join(preferred_technologies[:4])}."
        )

    if profile.confidence_score >= 70:
        wins.append(
            "Agent confidence is improving based on accumulated memory."
        )

    concerns = recurring_risks[:3]

    if not concerns:
        concerns.append(
            "Not enough recurring risk data has been collected yet."
        )

    if behavior_patterns.get("agent_activity_level") == "Early":
        concerns.append(
            "This agent still needs more interactions to build a stronger profile."
        )

    recommendation = "Continue using this agent regularly so it can improve its long-term understanding."

    if "Career" in agent_name:
        recommendation = (
            "Focus on interview preparation, resume optimization, and targeted AI Engineer applications."
        )

    elif "Finance" in agent_name:
        recommendation = (
            "Keep updating income, expenses, savings goals, and budget data to improve financial guidance."
        )

    elif "Health" in agent_name:
        recommendation = (
            "Track sleep, water, workouts, and diet consistently to improve wellness recommendations."
        )

    elif "Learning" in agent_name:
        recommendation = (
            "Continue logging learning goals, project progress, and certification plans."
        )

    summary = (
        f"{agent_name} reviewed its learned profile and found "
        f"{len(wins)} positive signals, {len(concerns)} concerns, "
        f"and a confidence score of {profile.confidence_score}%."
    )
    
    latest_reflection = (
    db.query(AgentReflection)
    .filter(AgentReflection.agent_name == agent_name)
    .order_by(AgentReflection.created_at.desc())
    .first()
    )

    if latest_reflection:
        return latest_reflection

    reflection = AgentReflection(
        agent_name=agent_name,
        reflection_type="daily",
        wins=json.dumps(wins),
        concerns=json.dumps(concerns),
        recommendation=recommendation,
        summary=summary,
        confidence_score=profile.confidence_score,
    )

    db.add(reflection)
    db.commit()
    db.refresh(reflection)

    return reflection



def generate_all_agent_reflections(db: Session):
    agent_names = [
        "Career Agent",
        "Finance Agent",
        "Health Agent",
        "Learning Agent",
    ]

    reflections = []

    for agent_name in agent_names:
        reflection = generate_agent_reflection(db, agent_name)
        if reflection:
            reflections.append(reflection)

    return reflections