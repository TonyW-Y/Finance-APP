from google import genai
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas.roast import RoastRequest, RoastResponse, WeeklyRoastRequest

router = APIRouter(tags=["roast"])

SYSTEM_PROMPT = (
    "You are a brutally honest, sarcastic financial advisor who also happens to be a stand-up comedian. "
    "Your job is to roast the user's financial decisions first, then give them one concrete piece of actionable advice. "
    "Be absolutely ruthless, use humor, and make them feel the pain of their bad choices. "
    "Call out specific numbers, categories, and wasted money. "
    "Compare their spending to tangible things like rent, groceries, or daily expenses to put it in perspective. "
    "Never go easy on them. Never be generic. Be creative, specific, and personal. "
    "Use emojis to add insult to injury. "
    "After the roast, end with 'Advice:' and one short, specific, actionable tip to improve."
)


def _get_client():
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured. Set GEMINI_API_KEY in .env",
        )
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _roast(client: genai.Client, prompt: str) -> str:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=genai.types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    )
    return response.text.strip()


@router.post("/roast", response_model=RoastResponse)
def get_roast(body: RoastRequest):
    expenses = [t for t in body.transactions if t.type == "expense"]
    total = sum(t.amount for t in expenses)

    cats: dict[str, float] = {}
    for t in expenses:
        cats[t.category] = cats.get(t.category, 0.0) + t.amount
    top_cats = sorted(cats.items(), key=lambda x: -x[1])[:3]
    cat_summary = ", ".join(f"{c}: ${a:.0f}" for c, a in top_cats)

    budget_summary_parts = []
    for b in body.budgets:
        spent = b.get("spent", 0)
        limit = b.get("limit", 0)
        if limit > 0:
            pct = (spent / limit) * 100
            flag = " (OVERRR BUDGET 🔥)" if pct > 100 else ""
            budget_summary_parts.append(f"{b['category']}: ${spent:.0f}/${limit:.0f} ({pct:.0f}%){flag}")
        else:
            budget_summary_parts.append(f"{b['category']}: ${spent:.0f}/unlimited")
    budgets_text = "; ".join(budget_summary_parts) if budget_summary_parts else "No budgets set"

    count = len(expenses)
    prompt = (
        f"I spent ${total:.0f} across {count} transactions. "
        f"Top categories: {cat_summary}. "
        f"Budgets: {budgets_text}. "
        f"Roast me."
    )

    try:
        client = _get_client()
        return {"roast": _roast(client, prompt)}
    except HTTPException:
        raise
    except Exception as e:
        return {"roast": f"Even the AI is speechless at your spending. (Error: {e})"}


@router.post("/weekly-roast", response_model=RoastResponse)
def get_weekly_roast(body: WeeklyRoastRequest):
    summary = body.summary
    total = summary.get("totalSpent", 0)
    count = summary.get("transactionCount", 0)
    cats = summary.get("topCategories", ["stuff"])
    cat_list = ", ".join(cats)

    prompt = (
        f"This week I made {count} transactions totaling ${total:.0f}. "
        f"My top spending categories were: {cat_list}. "
        f"Roast me like I'm the worst financial decision-maker you've ever seen."
    )

    try:
        client = _get_client()
        return {"roast": _roast(client, prompt)}
    except HTTPException:
        raise
    except Exception as e:
        return {"roast": f"The AI is too busy laughing at your weekly spending to respond. (Error: {e})"}
