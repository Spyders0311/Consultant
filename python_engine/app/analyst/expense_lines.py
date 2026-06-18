from __future__ import annotations

DIRECT_CATEGORIES = {"material", "labor", "subcontract", "equipment", "other_direct"}
INDIRECT_CATEGORIES = {"indirect_labor", "overhead", "ga", "other_indirect"}


def calculate_expense_lines(lines: list[dict], expense_type: str) -> dict:
    allowed = DIRECT_CATEGORIES if expense_type == "direct" else INDIRECT_CATEGORIES
    totals: dict[str, float] = {key: 0.0 for key in allowed}
    total = 0.0
    rows: list[dict] = []

    for line in lines:
        category = str(line.get("category") or "other_direct" if expense_type == "direct" else "other_indirect").lower()
        if category not in allowed:
            category = "other_direct" if expense_type == "direct" else "other_indirect"
        amount = float(line.get("amount") or 0)
        description = str(line.get("description") or "").strip()
        totals[category] = totals.get(category, 0.0) + amount
        total += amount
        rows.append({"category": category, "description": description, "amount": round(amount, 2)})

    return {
        "expenseType": expense_type,
        "lines": rows,
        "categoryTotals": {key: round(value, 2) for key, value in totals.items()},
        "annualTotal": round(total, 2),
    }
