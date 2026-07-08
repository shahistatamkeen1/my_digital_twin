def get_achievements(latest):
    achievements = []

    if not latest:
        return achievements

    if latest.get("overall_score", 0) > 0:
        achievements.append({
            "title": "First Snapshot Created",
            "icon": "🏁"
        })

    if latest.get("learning_score", 0) >= 25:
        achievements.append({
            "title": "Learning Twin Activated",
            "icon": "📚"
        })

    if latest.get("overall_score", 0) >= 25:
        achievements.append({
            "title": "Digital Twin Rising",
            "icon": "🌟"
        })

    return achievements