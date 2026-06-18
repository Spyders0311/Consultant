from __future__ import annotations

from .pl_rollup import normalize_pl_year, rollup_line_items


def calculate_twelve_month_pl(payload: dict) -> dict:
    year = int(payload.get("year") or 0)
    months = payload.get("months") or []
    if len(months) != 12:
        raise ValueError("Twelve month P&L requires exactly 12 monthly entries.")

    monthly_rows: list[dict] = []
    annual_rollup = {
        "revenue": 0.0,
        "cogs": 0.0,
        "operatingExpenses": 0.0,
        "otherExpenses": 0.0,
        "laborAmount": 0.0,
        "indirectCostsAmount": 0.0,
        "generalAdministrativeCostsAmount": 0.0,
    }

    for index, month in enumerate(months, start=1):
        rolled = rollup_line_items(month.get("lineItems"))
        revenue = float(month.get("revenue") if month.get("revenue") is not None else rolled["revenue"])
        cogs = float(month.get("cogs") if month.get("cogs") is not None else rolled["cogs"])
        operating = float(
            month.get("operatingExpenses") if month.get("operatingExpenses") is not None else rolled["operatingExpenses"]
        )
        other = float(month.get("otherExpenses") if month.get("otherExpenses") is not None else rolled["otherExpenses"])
        gross_profit = revenue - cogs
        net_income = gross_profit - operating - other

        monthly_rows.append(
            {
                "month": index,
                "revenue": round(revenue, 2),
                "cogs": round(cogs, 2),
                "operatingExpenses": round(operating, 2),
                "otherExpenses": round(other, 2),
                "grossProfit": round(gross_profit, 2),
                "netIncome": round(net_income, 2),
            }
        )

        annual_rollup["revenue"] += revenue
        annual_rollup["cogs"] += cogs
        annual_rollup["operatingExpenses"] += operating
        annual_rollup["otherExpenses"] += other
        annual_rollup["laborAmount"] += rolled["laborAmount"]
        annual_rollup["indirectCostsAmount"] += rolled["indirectCostsAmount"]
        annual_rollup["generalAdministrativeCostsAmount"] += rolled["generalAdministrativeCostsAmount"]

    annual = normalize_pl_year({"year": year, **annual_rollup, "lineItems": []})
    annual["grossProfit"] = round(annual["revenue"] - annual["cogs"], 2)
    annual["netIncome"] = round(
        annual["grossProfit"] - annual["operatingExpenses"] - annual["otherExpenses"],
        2,
    )

    return {"year": year, "months": monthly_rows, "annual": annual}
