from __future__ import annotations

from ..helpers import num, pct, round_money, safe_ratio


def calculate_ar_turns(inputs: dict[str, object]) -> dict:
    days_per_year = num(inputs.get("daysPerYear")) or 365.0
    annual_credit_sales = num(inputs.get("annualCreditSales"))
    beginning_ar = num(inputs.get("beginningArBalance"))
    ending_ar = num(inputs.get("endingArBalance"))
    average_ar_balance = num(inputs.get("averageArBalance"))

    if average_ar_balance <= 0 and (beginning_ar > 0 or ending_ar > 0):
        average_ar_balance = (beginning_ar + ending_ar) / 2.0

    ar_turns = safe_ratio(annual_credit_sales, average_ar_balance)
    avg_collection_period = (days_per_year / ar_turns) if ar_turns else None

    rows: list[dict] = [
        {
            "scenario": "Primary calculation",
            "annualCreditSales": round_money(annual_credit_sales),
            "averageArBalance": round_money(average_ar_balance),
            "arTurns": round(ar_turns, 2) if ar_turns is not None else None,
            "avgCollectionPeriodDays": round(avg_collection_period, 1) if avg_collection_period is not None else None,
        }
    ]

    if annual_credit_sales > 0:
        implied_balance_at_turn = round_money(annual_credit_sales / 6.0)
        rows.append(
            {
                "scenario": "Example: 6.0 AR turns",
                "annualCreditSales": round_money(annual_credit_sales),
                "averageArBalance": implied_balance_at_turn,
                "arTurns": 6.0,
                "avgCollectionPeriodDays": round(days_per_year / 6.0, 1),
            }
        )
        implied_balance_at_45_days = round_money(annual_credit_sales / (days_per_year / 45.0))
        rows.append(
            {
                "scenario": "Example: 45-day collection period",
                "annualCreditSales": round_money(annual_credit_sales),
                "averageArBalance": implied_balance_at_45_days,
                "arTurns": round(days_per_year / 45.0, 2),
                "avgCollectionPeriodDays": 45.0,
            }
        )

    warnings: list[str] = []
    if annual_credit_sales <= 0:
        warnings.append("Annual credit sales are zero; turnover metrics may be unavailable.")
    if average_ar_balance <= 0:
        warnings.append("Average A/R balance is zero; turnover metrics may be unavailable.")

    return {
        "summary": {
            "annualCreditSales": round_money(annual_credit_sales),
            "averageArBalance": round_money(average_ar_balance),
            "arTurns": round(ar_turns, 2) if ar_turns is not None else None,
            "avgCollectionPeriodDays": round(avg_collection_period, 1) if avg_collection_period is not None else None,
            "daysPerYear": days_per_year,
            "arPctOfSales": pct(average_ar_balance, annual_credit_sales),
        },
        "rows": rows,
        "warnings": warnings,
    }
