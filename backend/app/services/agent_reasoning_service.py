from app.services.ai_service import ask_ai_json
from app.services.master_context_service import get_master_context

from app.services.career_agent import run_career_agent
from app.services.finance_agent import run_finance_agent
from app.services.health_agent import run_health_agent
from app.services.learning_agent import run_learning_agent
from app.services.memory_retrieval_service import retrieve_relevant_memories
from app.services.agent_memory_service import save_agent_memory
from app.services.profile_learning_service import update_all_agent_profiles

def resolve_agent_conflicts(
    question: str,
    personal_context: dict,
    focus_scores: dict,
    career_analysis,
    finance_analysis,
    health_analysis,
    learning_analysis,
):
    system_prompt = """
You are the Conflict Resolution Agent inside My Digital Twin.

Your job is to compare recommendations from multiple agents and resolve conflicts.

Return ONLY valid JSON in this exact format:

{
  "conflict_summary": "Short explanation of any conflicts or alignment.",
  "resolved_strategy": "Unified strategy after resolving conflicts.",
  "tradeoffs": [
    "Tradeoff 1",
    "Tradeoff 2"
  ],
  "final_priority": "The final priority area."
}

Rules:
- If there are no conflicts, say the agents are aligned.
- If Career wants speed but Health shows low energy, balance workload.
- If Learning recommends paid resources but Finance shows budget risk, prefer free resources.
- If Finance recommends saving but Career needs job search investment, choose low-cost career actions first.
- Do not provide medical, tax, legal, or guaranteed financial advice.
"""

    user_prompt = f"""
User Question:
{question}

Personal Context:
{personal_context}

Focus Scores:
{focus_scores}

Career Agent:
{career_analysis}

Finance Agent:
{finance_analysis}

Health Agent:
{health_analysis}

Learning Agent:
{learning_analysis}

Resolve conflicts and create one unified strategy.
"""

    result = ask_ai_json(system_prompt, user_prompt, temperature=0.2)

    return {
        "conflict_summary": result.get("conflict_summary", ""),
        "resolved_strategy": result.get("resolved_strategy", ""),
        "tradeoffs": result.get("tradeoffs", []),
        "final_priority": result.get("final_priority", ""),
    }


def generate_master_advisor_response(
    question: str,
    routing: dict,
    personal_context: dict,
    focus_scores: dict,
    career_analysis,
    finance_analysis,
    health_analysis,
    learning_analysis,
    conflict_resolution: dict,
    relevant_memories: list,
):
    system_prompt = """
You are the Master Digital Twin Executive Advisor.

You receive:
- Personal Memory
- Focus Scores
- Career Agent Analysis
- Finance Agent Analysis
- Health Agent Analysis
- Learning Agent Analysis
- Conflict Resolution Agent output
- Relevant Memories

Return ONLY valid JSON in this exact format:

{
  "advisor_response": {
    "executive_summary": "One clear summary of the best decision.",
    "mission_status": "Short status of the user's current mission.",
    "career_signal": "Specific career signal.",
    "finance_signal": "Specific finance signal.",
    "health_signal": "Specific health signal.",
    "learning_signal": "Specific learning signal.",
    "personal_memory_signal": "Relevant personal memory signal.",
    "conflict_resolution": "How conflicts were resolved.",
    "risk_level": "Low | Medium | High",
    "risks": ["Risk 1", "Risk 2"],
    "recommended_actions": ["Action 1", "Action 2", "Action 3"],
    "expected_roi": "Expected practical benefit if the user follows the plan.",
    "next_best_action": "The single best action the user should take today."
  }
}

Rules:
- Return only JSON.
- Do not use markdown.
- Do not use code blocks.
- Be specific and use actual data from agents.
- Do not give generic advice.
- Do not dump raw context.
- Do not contradict Highest ROI Focus.
- Next best action must be doable today.
"""

    user_prompt = f"""
User Question:
{question}

Twin Router Decision:
{routing}

Personal Memory:
{personal_context}

Focus Scores:
{focus_scores}

Career Agent Analysis:
{career_analysis}

Finance Agent Analysis:
{finance_analysis}

Health Agent Analysis:
{health_analysis}

Learning Agent Analysis:
{learning_analysis}

Conflict Resolution:
{conflict_resolution}

Relevant Memories:
{relevant_memories}

Create one structured advisor response.
"""

    result = ask_ai_json(system_prompt, user_prompt, temperature=0.25)

    return result.get("advisor_response", {})


def run_agent_reasoning(question: str, routing: dict, db):
    master_context = get_master_context(db)
    relevant_memories = retrieve_relevant_memories(db, question)

    personal_context = master_context["personal_memory"]
    focus_scores = master_context["focus_scores"]

    career_context = (
        master_context["career_context"]
        if routing.get("use_career")
        else None
    )

    finance_context = (
        master_context["finance_context"]
        if routing.get("use_finance")
        else None
    )

    health_context = (
        master_context["health_context"]
        if routing.get("use_health")
        else None
    )

    learning_context = (
        master_context["learning_context"]
        if routing.get("use_learning")
        else None
    )

    if (
        not routing.get("use_career")
        and not routing.get("use_finance")
        and not routing.get("use_health")
        and not routing.get("use_learning")
    ):
        career_context = master_context["career_context"]
        finance_context = master_context["finance_context"]
        health_context = master_context["health_context"]
        learning_context = master_context["learning_context"]

        routing["use_career"] = True
        routing["use_finance"] = True
        routing["use_health"] = True
        routing["use_learning"] = True
        routing["reason"] = "No specific twin was selected, so all twins were used."
        

    career_analysis = (
        run_career_agent(question, career_context)
        if career_context
        else None
    )

    finance_analysis = (
        run_finance_agent(question, finance_context)
        if finance_context
        else None
    )

    health_analysis = (
        run_health_agent(question, health_context)
        if health_context
        else None
    )

    learning_analysis = (
        run_learning_agent(question, learning_context)
        if learning_context
        else None
    )

    conflict_resolution = resolve_agent_conflicts(
        question=question,
        personal_context=personal_context,
        focus_scores=focus_scores,
        career_analysis=career_analysis,
        finance_analysis=finance_analysis,
        health_analysis=health_analysis,
        learning_analysis=learning_analysis,
    )

    advisor_response = generate_master_advisor_response(
        question=question,
        routing=routing,
        personal_context=personal_context,
        focus_scores=focus_scores,
        career_analysis=career_analysis,
        finance_analysis=finance_analysis,
        health_analysis=health_analysis,
        learning_analysis=learning_analysis,
        conflict_resolution=conflict_resolution,
        relevant_memories=relevant_memories,
    )
    
    if career_analysis:
        save_agent_memory(
            db=db,
            agent_name="Career Agent",
            insight_type="career_analysis",
            summary=career_analysis.get("summary", ""),
            recommendation=career_analysis.get("recommendations", []),
            risks=career_analysis.get("risks", []),
            confidence=career_analysis.get("confidence", 0),
            source_question=question,
        )

    if finance_analysis:
        save_agent_memory(
            db=db,
            agent_name="Finance Agent",
            insight_type="finance_analysis",
            summary=finance_analysis.get("summary", ""),
            recommendation=finance_analysis.get("recommendations", []),
            risks=finance_analysis.get("risks", []),
            confidence=finance_analysis.get("confidence", 0),
            source_question=question,
        )

    if health_analysis:
        save_agent_memory(
            db=db,
            agent_name="Health Agent",
            insight_type="health_analysis",
            summary=health_analysis.get("summary", ""),
            recommendation=health_analysis.get("recommendations", []),
            risks=health_analysis.get("risks", []),
            confidence=health_analysis.get("confidence", 0),
            source_question=question,
        )

    if learning_analysis:
        save_agent_memory(
            db=db,
            agent_name="Learning Agent",
            insight_type="learning_analysis",
            summary=learning_analysis.get("summary", ""),
            recommendation=learning_analysis.get("recommendations", []),
            risks=learning_analysis.get("risks", []),
            confidence=learning_analysis.get("confidence", 0),
            source_question=question,
        )
        
    try:
        update_all_agent_profiles(db)
    except Exception as e:
        print(f"Profile learning update failed: {e}")

    return {
        "advisor_response": advisor_response,
        "agent_analysis": {
            "career": career_analysis,
            "finance": finance_analysis,
            "health": health_analysis,
            "learning": learning_analysis,
        },
        "conflict_resolution": conflict_resolution,
        "routing": routing,
        "focus_scores": focus_scores,
        "master_context_generated_at": master_context["generated_at"],
        "relevant_memories": relevant_memories,
    }