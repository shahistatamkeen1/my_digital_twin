def generate_growth_forecast(history):
    if not history or len(history) < 2:
        return {
            "status": "not_enough_data",
            "message": "More progress snapshots are needed to generate an accurate growth forecast.",
            "forecast": {
                "career_score": None,
                "finance_score": None,
                "health_score": None,
                "learning_score": None,
                "overall_score": None,
            },
            "recommendation": "Continue using your Digital Twin daily to build enough progress history."
        }

    first = history[0]
    latest = history[-1]

    def get_value(item, field):
        if isinstance(item, dict):
            return item.get(field, 0)
        return getattr(item, field, 0)

    def forecast_score(field):
        first_value = get_value(first, field)
        latest_value = get_value(latest, field)

        growth = latest_value - first_value
        predicted = latest_value + growth

        return max(0, min(100, round(predicted, 2)))

    return {
        "status": "success",
        "message": "Growth forecast generated based on your progress history.",
        "forecast": {
            "career_score": forecast_score("career_score"),
            "finance_score": forecast_score("finance_score"),
            "health_score": forecast_score("health_score"),
            "learning_score": forecast_score("learning_score"),
            "overall_score": forecast_score("overall_score"),
        },
        "recommendation": "Focus on the twin with the lowest projected score to improve your overall Digital Twin growth."
    }