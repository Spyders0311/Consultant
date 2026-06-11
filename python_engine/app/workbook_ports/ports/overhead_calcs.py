from __future__ import annotations

from ..helpers import num, pct, round_money, safe_ratio


def calculate_overhead_calcs(inputs: dict[str, object]) -> dict:
    total_revenue = num(inputs.get("totalRevenue"))
    total_overhead = num(inputs.get("totalOverhead"))
    material_costs = num(inputs.get("totalMaterialCosts"))
    direct_labor = num(inputs.get("totalDirectLaborCosts"))
    direct_costs = material_costs + direct_labor

    overhead_factor_on_direct = safe_ratio(total_overhead, direct_costs)
    overhead_per_labor_dollar = safe_ratio(total_overhead, direct_labor)
    overhead_pct_of_revenue = pct(total_overhead, total_revenue)
    direct_cost_pct_of_revenue = pct(direct_costs, total_revenue)
    gross_profit = total_revenue - direct_costs - total_overhead
    gross_margin_pct = pct(gross_profit, total_revenue)
    burdened_direct_cost = direct_costs + total_overhead
    markup_on_direct = safe_ratio(burdened_direct_cost, direct_costs)

    rows: list[dict] = [
        {
            "metric": "Total Revenue",
            "amount": round_money(total_revenue),
            "pctOfRevenue": 100.0 if total_revenue else None,
        },
        {
            "metric": "Material Costs",
            "amount": round_money(material_costs),
            "pctOfRevenue": pct(material_costs, total_revenue),
        },
        {
            "metric": "Direct Labor",
            "amount": round_money(direct_labor),
            "pctOfRevenue": pct(direct_labor, total_revenue),
        },
        {
            "metric": "Total Overhead (Fixed Costs)",
            "amount": round_money(total_overhead),
            "pctOfRevenue": overhead_pct_of_revenue,
        },
        {
            "metric": "Burdened Direct Cost",
            "amount": round_money(burdened_direct_cost),
            "pctOfRevenue": pct(burdened_direct_cost, total_revenue),
        },
        {
            "metric": "Gross Profit After Overhead",
            "amount": round_money(gross_profit),
            "pctOfRevenue": gross_margin_pct,
        },
    ]

    warnings: list[str] = []
    if total_revenue <= 0:
        warnings.append("Total revenue is zero; overhead percentages may be unavailable.")
    if direct_costs <= 0:
        warnings.append("Direct costs are zero; overhead factoring on direct costs cannot be calculated.")
    if gross_profit < 0:
        warnings.append("Gross profit after overhead is negative.")

    return {
        "summary": {
            "totalRevenue": round_money(total_revenue),
            "totalOverhead": round_money(total_overhead),
            "totalMaterialCosts": round_money(material_costs),
            "totalDirectLaborCosts": round_money(direct_labor),
            "directCosts": round_money(direct_costs),
            "overheadFactorOnDirect": round(overhead_factor_on_direct, 4) if overhead_factor_on_direct is not None else None,
            "overheadPerLaborDollar": round(overhead_per_labor_dollar, 4) if overhead_per_labor_dollar is not None else None,
            "overheadPctOfRevenue": overhead_pct_of_revenue,
            "directCostPctOfRevenue": direct_cost_pct_of_revenue,
            "burdenedDirectCost": round_money(burdened_direct_cost),
            "markupOnDirect": round(markup_on_direct, 4) if markup_on_direct is not None else None,
            "grossProfit": round_money(gross_profit),
            "grossMarginPct": gross_margin_pct,
        },
        "rows": rows,
        "warnings": warnings,
    }
