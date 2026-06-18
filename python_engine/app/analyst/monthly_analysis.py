from __future__ import annotations

MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]


def calculate_monthly_analysis(payload: dict) -> dict:
    year = int(payload.get("year") or 0)
    analysis_type = str(payload.get("analysisType") or "payroll")
    months = payload.get("months") or []

    if len(months) != 12:
        raise ValueError("Monthly analysis requires exactly 12 monthly entries.")

    monthly_rows: list[dict] = []
    category_totals: dict[str, float] = {}
    annual_total = 0.0

    for index, month in enumerate(months, start=1):
        lines = month.get("lines") or []
        month_total = 0.0
        line_rows: list[dict] = []

        for line in lines:
            category = str(line.get("category") or "other")
            amount = float(line.get("amount") or 0)
            description = str(line.get("description") or "").strip()
            month_total += amount
            category_totals[category] = category_totals.get(category, 0.0) + amount
            line_rows.append({"category": category, "description": description, "amount": round(amount, 2)})

        annual_total += month_total
        monthly_rows.append(
            {
                "month": index,
                "monthLabel": MONTH_LABELS[index - 1],
                "lines": line_rows,
                "monthTotal": round(month_total, 2),
            }
        )

    return {
        "year": year,
        "analysisType": analysis_type,
        "months": monthly_rows,
        "categoryTotals": {key: round(value, 2) for key, value in category_totals.items()},
        "annualTotal": round(annual_total, 2),
    }
