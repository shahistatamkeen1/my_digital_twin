from app.models.learning import LearningMemory


def get_learning_context(db):
    items = db.query(LearningMemory).all()

    total_goals = len(items)

    completed = len(
        [item for item in items if item.status == "Completed"]
    )

    in_progress = len(
        [item for item in items if item.status == "In Progress"]
    )

    certifications = len(
        [
            item
            for item in items
            if "certification" in item.category.lower()
        ]
    )

    return {
        "learning_summary": {
            "total_goals": total_goals,
            "completed_goals": completed,
            "in_progress_goals": in_progress,
            "certification_goals": certifications,
        },
        "learning_items": [
            {
                "topic": item.topic,
                "category": item.category,
                "current_level": item.current_level,
                "target_level": item.target_level,
                "status": item.status,
            }
            for item in items
        ],
    }