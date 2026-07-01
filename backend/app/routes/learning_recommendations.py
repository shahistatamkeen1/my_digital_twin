from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.learning import LearningMemory
from app.services.ai_service import ask_ai

router = APIRouter()


@router.get("/")
def get_learning_recommendations(db: Session = Depends(get_db)):
    learning_items = db.query(LearningMemory).order_by(LearningMemory.id.desc()).all()

    learning_context = [
        {
            "topic": item.topic,
            "category": item.category,
            "current_level": item.current_level,
            "target_level": item.target_level,
            "resource": item.resource,
            "resource_link": item.resource_link,
            "status": item.status,
            "notes": item.notes,
        }
        for item in learning_items
    ]

    system_prompt = """
You are the Learning Twin inside My Digital Twin.

Generate a helpful, personalized, human-friendly response based on the user's saved learning goals.
For every recommended resource, include the official website URL when possible.

For every recommended resource, use this format:

[Resource Name](official URL)
Why it helps:
Cost:

- When recommending resources, format each resource clearly.
- Use markdown links like [AWS Skill Builder](https://skillbuilder.aws/).
- Put a blank line between each resource.
- Use short headings.
- Use bullet points for why it helps and cost.
- Separate major sections with horizontal lines using ---.

- Resource links MUST be written using markdown link format.
- Correct format: [Resource Name](https://example.com)
- Do not write links as plain text.
- Do not write "Resource Name - URL".
- Every resource name with a URL must be clickable markdown.

Guidelines:
- Do not use a fixed template.
- Do not use markdown tables.
- Do not overuse bold formatting.
- Write in a natural, supportive tone.
- Make the response easy to scan.
- Use short headings only when helpful.
- Use simple bullet points where useful.
- Prioritize free and affordable resources.
- Explain why each recommendation matters.
- Keep the advice practical and realistic.
- Adapt the response to the user's current level, target level, topic, and notes.
- End with one clear next action the user can take today.
- Do not write resources in one long paragraph.
- Make the response easy to read visually.
"""

    user_prompt = f"""
Current Learning Goals:
{learning_context}

Create a personalized learning recommendation report with this structure:

1. Learning Goal Summary
2. What To Learn First
3. Best Free Resources
4. Best Affordable Resources
5. Hands-On Projects
6. Certification Path
7. 7-Day Study Plan
8. 30-Day Learning Plan
9. Estimated Timeline
10. Best Next Action Today
"""

    reply = ask_ai(system_prompt, user_prompt, temperature=0.35)

    return {
        "recommendations": reply,
        "learning_context": learning_context,
    }