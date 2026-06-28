def calculate_career_score(career_context):
    if not career_context:
        return 0

    score = 0
    memory = career_context.get("memory", {})
    application_summary = career_context.get("application_summary", {})
    roadmap_summary = career_context.get("roadmap_summary", {})

    if memory.get("career_goal"):
        score += 15
    if memory.get("target_role"):
        score += 15
    if memory.get("current_skills"):
        score += 10
    if memory.get("skills_to_learn"):
        score += 10

    score += min(application_summary.get("total_applications", 0) * 5, 20)
    score += min(application_summary.get("applied", 0) * 5, 15)
    score += min(application_summary.get("interviews", 0) * 10, 15)
    score += min(round(roadmap_summary.get("progress", 0) * 0.1), 10)

    return min(score, 100)


def calculate_finance_score(finance_context):
    if not finance_context:
        return 0

    score = 0
    memory = finance_context.get("finance_memory", {})
    summary = finance_context.get("tracked_summary", {})
    goals = finance_context.get("savings_goals", [])

    planned_income = memory.get("planned_monthly_income", 0)
    target_savings = memory.get("target_monthly_savings", 0)
    financial_goal = memory.get("financial_goal", "")
    budget_preference = memory.get("budget_preference", "")
    tracked_income = summary.get("tracked_income", 0)
    tracked_expenses = summary.get("tracked_expenses", 0)
    tracked_savings = summary.get("tracked_savings", 0)

    if planned_income > 0:
        score += 20
    if target_savings > 0:
        score += 15
    if financial_goal:
        score += 15
    if budget_preference:
        score += 10
    if tracked_income > 0:
        score += 15
        savings_rate = (tracked_savings / tracked_income) * 100

        if savings_rate >= 30:
            score += 20
        elif savings_rate >= 15:
            score += 15
        elif savings_rate >= 5:
            score += 10

    if tracked_expenses > 0:
        score += 5
    if len(goals) > 0:
        score += 10

    return min(score, 100)


def calculate_health_score(health_context):
    if not health_context:
        return 0

    score = 0
    memory = health_context.get("health_memory", {})
    habit_summary = health_context.get("habit_summary", {})

    if memory.get("health_goal"):
        score += 15
    if memory.get("diet_preference"):
        score += 10
    if memory.get("fitness_level"):
        score += 10

    habit_count = habit_summary.get("habit_count", 0)
    avg_sleep = habit_summary.get("avg_sleep", 0)
    avg_water = habit_summary.get("avg_water", 0)
    avg_workout = habit_summary.get("avg_workout", 0)

    sleep_goal = memory.get("sleep_goal_hours", 8)
    water_goal = memory.get("water_goal_cups", 8)
    workout_goal = memory.get("workout_goal_minutes", 30)

    if habit_count > 0:
        score += 15
    if sleep_goal > 0:
        score += min(round((avg_sleep / sleep_goal) * 20), 20)
    if water_goal > 0:
        score += min(round((avg_water / water_goal) * 15), 15)
    if workout_goal > 0:
        score += min(round((avg_workout / workout_goal) * 20), 20)

    return min(score, 100)


def get_highest_roi_focus(career_score, finance_score, health_score):
    scores = {
        "Career": career_score,
        "Finance": finance_score,
        "Health": health_score,
    }

    lowest_area = min(scores, key=scores.get)

    if lowest_area == "Career":
        return "Career growth has the biggest opportunity right now. Focus on skill building, applications, and interview readiness."

    if lowest_area == "Finance":
        return "Financial stability has the biggest opportunity right now. Focus on tracking expenses, savings goals, and budget discipline."

    return "Health sustainability has the biggest opportunity right now. Focus on sleep, hydration, workouts, and daily wellness habits."