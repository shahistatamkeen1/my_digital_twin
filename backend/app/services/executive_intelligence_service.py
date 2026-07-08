from app.services.agent_reasoning_service import run_agent_reasoning


def generate_executive_intelligence(db):
    reasoning = run_agent_reasoning(
        question="""
Generate executive-level Digital Twin intelligence.

Identify:
- overall summary
- mission status
- highest priority
- risks
- recommended actions
- next best action
- expected ROI

Use Career, Finance, Health, Learning, and Personal Memory together.
""",
        routing={
            "use_career": True,
            "use_finance": True,
            "use_health": True,
            "use_learning": True,
            "reason": "Executive intelligence generation across all twins.",
        },
        db=db,
    )

    return reasoning