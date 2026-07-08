import json
from collections import Counter
from sqlalchemy.orm import Session

from app.models.agent_memory import AgentMemory
from app.models.agent_profile import AgentProfile


ROLE_KEYWORDS = [
    "AI Engineer",
    "Machine Learning Engineer",
    "ML Engineer",
    "Software Engineer",
    "Data Analyst",
    "Data Scientist",
    "Cloud Engineer",
    "AI Solutions Engineer",
]

TECH_KEYWORDS = [
    "Python",
    "FastAPI",
    "React",
    "Next.js",
    "SQL",
    "PostgreSQL",
    "Azure",
    "AWS",
    "GCP",
    "Docker",
    "Kubernetes",
    "LLM",
    "RAG",
    "MLOps",
    "OpenAI",
    "LangGraph",
    "Power Apps",
    "Power Automate",
]

GOAL_KEYWORDS = {
    "AI Engineer Job Search": [
        "AI Engineer",
        "AI Solutions Engineer",
        "machine learning role",
        "ML Engineer",
        "job application",
        "interview",
    ],
    "Resume Optimization": [
        "resume",
        "ATS",
        "tailor",
        "cover letter",
    ],
    "Interview Preparation": [
        "interview",
        "mock interview",
        "phone call",
        "technical questions",
    ],
    "Cloud Certification": [
        "AWS certification",
        "Azure certification",
        "cloud certification",
        "certification",
    ],
    "Budget Stability": [
        "budget",
        "savings",
        "expense",
        "income",
    ],
    "Health Consistency": [
        "sleep",
        "workout",
        "diet",
        "water",
        "wellness",
    ],
    "Skill Growth": [
        "learning",
        "course",
        "project",
        "certification",
        "practice",
    ],
}


def _safe_json_loads(value, default):
    try:
        if not value:
            return default
        return json.loads(value)
    except Exception:
        return default


def _count_matches(text: str, keywords):
    lower_text = text.lower()
    found = []

    for keyword in keywords:
        if keyword.lower() in lower_text:
            found.append(keyword)

    return Counter(found)


def _detect_goals(text: str):
    lower_text = text.lower()
    goals = []

    for goal, triggers in GOAL_KEYWORDS.items():
        for trigger in triggers:
            if trigger.lower() in lower_text:
                goals.append(goal)
                break

    return goals


def _decision_style(agent_name: str, goals, technologies):
    if "Career" in agent_name:
        if "AI Engineer Job Search" in goals:
            return "Career-growth focused"
        return "Opportunity-focused"

    if "Finance" in agent_name:
        return "Budget-conscious"

    if "Health" in agent_name:
        return "Wellness-oriented"

    if "Learning" in agent_name:
        if technologies:
            return "Project-based skill builder"
        return "Skill-building focused"

    return "Balanced"


def _confidence_score(memories, recurring_goals, preferred_roles, preferred_technologies):
    if not memories:
        return 0

    avg_memory_confidence = int(
        sum(memory.confidence or 0 for memory in memories) / len(memories)
    )

    memory_bonus = min(len(memories) * 4, 25)
    goal_bonus = min(len(recurring_goals) * 5, 15)
    role_bonus = min(len(preferred_roles) * 4, 10)
    tech_bonus = min(len(preferred_technologies) * 2, 15)

    final_score = (
        avg_memory_confidence
        + memory_bonus
        + goal_bonus
        + role_bonus
        + tech_bonus
    )

    return min(final_score, 95)


def update_agent_profile(db: Session, agent_name: str):
    memories = (
        db.query(AgentMemory)
        .filter(AgentMemory.agent_name == agent_name)
        .order_by(AgentMemory.created_at.desc())
        .limit(50)
        .all()
    )

    if not memories:
        return None

    profile = (
        db.query(AgentProfile)
        .filter(AgentProfile.agent_name == agent_name)
        .first()
    )

    if not profile:
        profile = AgentProfile(agent_name=agent_name)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    combined_text = " ".join(
        [memory.summary or "" for memory in memories]
        + [memory.source_question or "" for memory in memories]
    )

    role_counts = _count_matches(combined_text, ROLE_KEYWORDS)
    tech_counts = _count_matches(combined_text, TECH_KEYWORDS)
    goal_counts = Counter(_detect_goals(combined_text))

    preferred_roles = [item for item, _ in role_counts.most_common(5)]
    preferred_technologies = [item for item, _ in tech_counts.most_common(8)]
    primary_goals = [item for item, _ in goal_counts.most_common(5)]

    recurring_risks = []

    for memory in memories:
        risks = _safe_json_loads(memory.risks, [])

        if isinstance(risks, list):
            recurring_risks.extend(risks)

    top_risks = [
        risk for risk, _ in Counter(recurring_risks).most_common(5)
    ]

    learned_preferences = {
        "preferred_roles": preferred_roles,
        "preferred_technologies": preferred_technologies,
        "primary_goals": primary_goals,
        "frequent_topics": {
            "roles": role_counts.most_common(5),
            "technologies": tech_counts.most_common(8),
            "goals": goal_counts.most_common(5),
        },
    }

    behavior_patterns = {
        "memory_count": len(memories),
        "agent_activity_level": (
            "High" if len(memories) >= 20
            else "Medium" if len(memories) >= 8
            else "Early"
        ),
        "learned_pattern": (
            f"This agent has learned {len(primary_goals)} main goals, "
            f"{len(preferred_roles)} role preferences, and "
            f"{len(preferred_technologies)} technology preferences."
        ),
        "confidence_evolution": {
            "base_confidence": int(
                sum(memory.confidence or 0 for memory in memories) / len(memories)
            ),
            "memory_bonus": min(len(memories) * 4, 25),
            "goal_bonus": min(len(primary_goals) * 5, 15),
            "technology_bonus": min(len(preferred_technologies) * 2, 15),
        },
    }

    decision_style = _decision_style(
        agent_name,
        primary_goals,
        preferred_technologies,
    )

    confidence_score = _confidence_score(
        memories,
        primary_goals,
        preferred_roles,
        preferred_technologies,
    )

    profile.learned_preferences = json.dumps(learned_preferences)
    profile.behavior_patterns = json.dumps(behavior_patterns)
    profile.recurring_goals = json.dumps(primary_goals)
    profile.recurring_risks = json.dumps(top_risks)
    profile.decision_style = decision_style
    profile.confidence_score = confidence_score

    db.commit()
    db.refresh(profile)

    return profile


def update_all_agent_profiles(db: Session):
    agent_names = [
        "Career Agent",
        "Finance Agent",
        "Health Agent",
        "Learning Agent",
    ]

    profiles = []

    for agent_name in agent_names:
        profile = update_agent_profile(db, agent_name)
        if profile:
            profiles.append(profile)

    return profiles