from datetime import date

from app.models.twin_snapshot import TwinProgressSnapshot
from app.services.ai_service import ask_ai

def save_daily_snapshot(db, scores):
    today = date.today()

    existing_snapshot = (
        db.query(TwinProgressSnapshot)
        .filter(TwinProgressSnapshot.created_at >= today)
        .first()
    )

    if existing_snapshot:
        existing_snapshot.career_score = scores["career_score"]
        existing_snapshot.finance_score = scores["finance_score"]
        existing_snapshot.health_score = scores["health_score"]
        existing_snapshot.learning_score = scores["learning_score"]
        existing_snapshot.overall_score = scores["overall_score"]

        db.commit()
        db.refresh(existing_snapshot)
        return existing_snapshot

    snapshot = TwinProgressSnapshot(
        career_score=scores["career_score"],
        finance_score=scores["finance_score"],
        health_score=scores["health_score"],
        learning_score=scores["learning_score"],
        overall_score=scores["overall_score"],
    )

    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return snapshot


def get_progress_history(db):
    snapshots = (
        db.query(TwinProgressSnapshot)
        .order_by(TwinProgressSnapshot.created_at.asc())
        .all()
    )

    return [
        {
            "date": snapshot.created_at.strftime("%Y-%m-%d"),
            "career_score": snapshot.career_score,
            "finance_score": snapshot.finance_score,
            "health_score": snapshot.health_score,
            "learning_score": snapshot.learning_score,
            "overall_score": snapshot.overall_score,
        }
        for snapshot in snapshots
    ]
    
def get_progress_insights(history):
    if not history:
        return {
            "best_twin": None,
            "worst_twin": None,
            "most_improved": None,
            "overall_change": 0,
            "executive_review": "No progress history available yet.",
        }

    latest = history[-1]
    first = history[0]

    scores = {
        "Career": latest["career_score"],
        "Finance": latest["finance_score"],
        "Health": latest["health_score"],
        "Learning": latest["learning_score"],
    }

    changes = {
        "Career": latest["career_score"] - first["career_score"],
        "Finance": latest["finance_score"] - first["finance_score"],
        "Health": latest["health_score"] - first["health_score"],
        "Learning": latest["learning_score"] - first["learning_score"],
    }

    best_twin = max(scores, key=scores.get)
    worst_twin = min(scores, key=scores.get)
    most_improved = max(changes, key=changes.get)
    overall_change = latest["overall_score"] - first["overall_score"]

    executive_review = (
        f"Your strongest area right now is {best_twin} with a score of {scores[best_twin]}%. "
        f"The area needing the most attention is {worst_twin} at {scores[worst_twin]}%. "
        f"Since your first snapshot, your overall Digital Twin score changed by {overall_change}%. "
        f"Your biggest improvement came from {most_improved}."
    )

    return {
        "best_twin": {
            "name": best_twin,
            "score": scores[best_twin],
        },
        "worst_twin": {
            "name": worst_twin,
            "score": scores[worst_twin],
        },
        "most_improved": {
            "name": most_improved,
            "change": changes[most_improved],
        },
        "overall_change": overall_change,
        "executive_review": executive_review,
    }


def get_weekly_growth_report(history):
    if len(history) < 2:
        return "More daily snapshots are needed to generate a weekly growth report."

    recent = history[-7:] if len(history) >= 7 else history
    first = recent[0]
    latest = recent[-1]

    return {
        "career_change": latest["career_score"] - first["career_score"],
        "finance_change": latest["finance_score"] - first["finance_score"],
        "health_change": latest["health_score"] - first["health_score"],
        "learning_change": latest["learning_score"] - first["learning_score"],
        "overall_change": latest["overall_score"] - first["overall_score"],
    }
    
def generate_ai_progress_review(history, insights, weekly_report):
    if not history:
        return "No progress history is available yet."

    prompt = f"""
You are the AI Executive Review engine for a personal digital twin platform.

Analyze this user's Digital Twin progress.

Progress history:
{history}

Insights:
{insights}

Weekly report:
{weekly_report}

Write a short, human, helpful executive review in 5-7 sentences.

Include:
- strongest twin
- weakest twin
- biggest improvement
- overall trend
- one clear next action

Keep the tone encouraging, practical, and professional.
"""

    return ask_ai(prompt)

def get_monthly_scorecard(history):
    if not history:
        return {
            "available": False,
            "message": "No progress history available yet.",
        }

    recent = history[-30:] if len(history) >= 30 else history
    first = recent[0]
    latest = recent[-1]

    return {
        "available": True,
        "period": f"{first['date']} to {latest['date']}",
        "starting_overall": first["overall_score"],
        "current_overall": latest["overall_score"],
        "overall_change": latest["overall_score"] - first["overall_score"],
        "career_change": latest["career_score"] - first["career_score"],
        "finance_change": latest["finance_score"] - first["finance_score"],
        "health_change": latest["health_score"] - first["health_score"],
        "learning_change": latest["learning_score"] - first["learning_score"],
        "latest_scores": latest,
    }