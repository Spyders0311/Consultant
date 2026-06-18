from __future__ import annotations


def calculate_working_capital_with_scenarios(payload: dict) -> dict:
    annual_revenue = float(payload.get("annualRevenue") or 0)
    annual_cogs = float(payload.get("annualCogs") or 0)
    dso = float(payload.get("daysSalesOutstanding") or 0)
    dio = float(payload.get("daysInventoryOnHand") or 0)
    dpo = float(payload.get("daysPayablesOutstanding") or 0)
    revenue_growth = float(payload.get("revenueGrowthPercent") or 0) / 100.0
    cogs_growth = float(payload.get("cogsGrowthPercent") or revenue_growth)
    projection_years = int(payload.get("projectionYears") or 0)
    projection_years = min(max(projection_years, 0), 5)

    def wc_for(revenue: float, cogs: float) -> dict:
        ar = (revenue / 365.0) * dso
        inventory = (cogs / 365.0) * dio
        ap = (cogs / 365.0) * dpo
        nwc = ar + inventory - ap
        ccc = dso + dio - dpo
        return {
            "arInvestment": round(ar, 2),
            "inventoryInvestment": round(inventory, 2),
            "apFinancing": round(ap, 2),
            "netWorkingCapital": round(nwc, 2),
            "cashConversionCycle": round(ccc, 2),
            "workingCapitalPercentOfRevenue": round((nwc / revenue) * 100, 2) if revenue > 0 else None,
        }

    base = wc_for(annual_revenue, annual_cogs)
    warnings: list[str] = []
    if annual_revenue <= 0:
        warnings.append("Annual revenue is zero. Working capital as a percent of revenue cannot be computed.")

    scenarios: list[dict] = []
    previous_nwc = base["netWorkingCapital"]
    revenue = annual_revenue
    cogs = annual_cogs

    for year_offset in range(1, projection_years + 1):
        revenue *= 1 + revenue_growth
        cogs *= 1 + cogs_growth
        projected = wc_for(revenue, cogs)
        delta_nwc = projected["netWorkingCapital"] - previous_nwc
        scenarios.append(
            {
                "yearOffset": year_offset,
                "revenue": round(revenue, 2),
                "cogs": round(cogs, 2),
                **projected,
                "deltaWorkingCapital": round(delta_nwc, 2),
            }
        )
        previous_nwc = projected["netWorkingCapital"]

    cumulative = 0.0
    for row in scenarios:
        cumulative += row["deltaWorkingCapital"]
        row["cumulativeFundingNeed"] = round(cumulative, 2)

    return {
        **base,
        "warnings": warnings,
        "scenarios": scenarios,
        "revenueGrowthPercent": revenue_growth * 100,
        "cogsGrowthPercent": cogs_growth * 100,
        "projectionYears": projection_years,
    }
