from app.services.personal_memory_service import get_personal_memory_context
from app.services.career_context_service import get_career_context
from app.services.finance_context_service import get_finance_context
from app.services.health_context_service import get_health_context
from app.services.learning_context_service import get_learning_context


def retrieve_relevant_memories(db, query: str, limit: int = 8):
    query_lower = query.lower()

    memories = []

    personal = get_personal_memory_context(db)
    career = get_career_context(db)
    finance = get_finance_context(db)
    health = get_health_context(db)
    learning = get_learning_context(db)

    def add_memory(source, title, content, keywords):
        text = f"{title} {content}".lower()
        score = 0

        for keyword in keywords:
            if keyword.lower() in query_lower:
                score += 2
            if keyword.lower() in text:
                score += 1

        if score > 0:
            memories.append(
                {
                    "source": source,
                    "title": title,
                    "content": content,
                    "relevance_score": score,
                }
            )

    add_memory(
        "personal",
        "Long-Term Goals",
        personal.get("long_term_goals", ""),
        ["goal", "future", "priority", "life", "strategy"],
    )

    add_memory(
        "personal",
        "Daily Schedule",
        personal.get("daily_schedule", ""),
        ["schedule", "daily", "routine", "time", "plan"],
    )

    add_memory(
        "career",
        "Career Goal",
        career.get("memory", {}).get("career_goal", ""),
        ["career", "job", "role", "engineer", "resume", "interview"],
    )

    add_memory(
        "career",
        "Target Role",
        career.get("memory", {}).get("target_role", ""),
        ["career", "target", "role", "job", "ai engineer"],
    )

    add_memory(
        "career",
        "Skills To Learn",
        career.get("memory", {}).get("skills_to_learn", ""),
        ["skills", "learn", "career", "job-ready", "engineer"],
    )

    add_memory(
        "finance",
        "Financial Goal",
        finance.get("finance_memory", {}).get("financial_goal", ""),
        ["finance", "money", "budget", "saving", "afford"],
    )

    add_memory(
        "finance",
        "Budget Preference",
        finance.get("finance_memory", {}).get("budget_preference", ""),
        ["budget", "cost", "course", "certification", "afford"],
    )

    add_memory(
        "health",
        "Health Goal",
        health.get("health_memory", {}).get("health_goal", ""),
        ["health", "energy", "sleep", "routine", "wellness"],
    )

    add_memory(
        "learning",
        "Learning Goals",
        str(learning.get("learning_items", [])),
        ["learning", "study", "certification", "course", "roadmap", "skill"],
    )

    memories.sort(
        key=lambda item: item["relevance_score"],
        reverse=True,
    )

    return memories[:limit]