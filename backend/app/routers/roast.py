import random

from fastapi import APIRouter

from app.schemas.roast import RoastRequest, RoastResponse, WeeklyRoastRequest

router = APIRouter(tags=["roast"])

ROASTS = [
    "Bruh, you spent ${total} this week. Is your money allergic to your wallet?",
    "Another ${total} gone poof. At this rate, your bank account is going to file a missing person report.",
    "You really dropped ${total} like it was hot lava. Your wallet is crying.",
    "${total} spent? That's not a budget, that's a suggestion. A bad one.",
    "You've spent ${total}. The good news? Money can't buy happiness. The bad news? You're trying really hard.",
]

WEEKLY_ROASTS = [
    "You made {count} transactions this week totaling ${total}. That's roughly one bad decision per transaction.",
    "This week you spent ${total} across {count} purchases. Your top categories were {cats}. Priorities, I guess.",
    "Oh look, another week of questionable financial decisions: ${total} down the drain in {count} transactions.",
    "You spent ${total} this week in just {count} transactions. That's dedication to financial irresponsibility.",
]


@router.post("/roast", response_model=RoastResponse)
def get_roast(body: RoastRequest):
    total = sum(t.amount for t in body.transactions if t.type == "expense")
    roast = random.choice(ROASTS).format(total=f"${total:.2f}")
    return {"roast": roast}


@router.post("/weekly-roast", response_model=RoastResponse)
def get_weekly_roast(body: WeeklyRoastRequest):
    summary = body.summary
    total = summary.get("totalSpent", 0)
    count = summary.get("transactionCount", 0)
    cats = summary.get("topCategories", ["stuff"])
    roast = random.choice(WEEKLY_ROASTS).format(
        total=f"${total:.2f}", count=count, cats=", ".join(cats)
    )
    return {"roast": roast}
