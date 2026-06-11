from __future__ import annotations

from ..breakeven_core import sales_increase_profit_impact
from ..helpers import num, round_money


def calculate_cost_vs_sales_increase(inputs: dict[str, object]) -> dict:
    current_sales = num(inputs.get("currentSales"))
    sales_increase_pct = num(inputs.get("salesIncreasePercent"))
    variable_cost_pct = num(inputs.get("variableCostPercent"))
    fixed_expenses = num(inputs.get("fixedExpenses"))
    monthly_fixed = num(inputs.get("monthlyFixedExpenses"))

    if fixed_expenses <= 0 and monthly_fixed > 0:
        fixed_expenses = monthly_fixed * 12.0

    primary = sales_increase_profit_impact(
        current_sales,
        sales_increase_pct,
        variable_cost_pct,
        fixed_expenses,
    )

    scenario_pcts = [0, 5, 10, 15, 20, 25]
    if sales_increase_pct not in scenario_pcts:
        scenario_pcts.append(sales_increase_pct)
    scenario_pcts = sorted(set(scenario_pcts))

    rows: list[dict] = []
    for scenario_pct in scenario_pcts:
        scenario = sales_increase_profit_impact(
            current_sales,
            scenario_pct,
            variable_cost_pct,
            fixed_expenses,
        )
        rows.append(
            {
                "salesIncreasePct": scenario_pct,
                "newSales": scenario["newSales"],
                "newProfit": scenario["newProfit"],
                "profitChange": scenario["profitChange"],
                "profitChangePct": scenario["profitChangePct"],
            }
        )

    warnings: list[str] = []
    if current_sales <= 0:
        warnings.append("Current sales are zero; increase scenarios may be unavailable.")
    if variable_cost_pct >= 100:
        warnings.append("Variable costs are at or above 100% of sales; profit cannot increase with sales.")
    if primary["profitChange"] is not None and primary["newSales"] and primary["currentProfit"] is not None:
        sales_lift_ratio = (primary["newSales"] - primary["currentSales"]) / current_sales if current_sales else 0
        profit_lift_ratio = (
            (primary["profitChange"] or 0) / abs(primary["currentProfit"])
            if primary["currentProfit"]
            else None
        )
        if (
            sales_lift_ratio
            and profit_lift_ratio is not None
            and profit_lift_ratio < sales_lift_ratio
            and variable_cost_pct > 0
        ):
            warnings.append(
                "Profit grows more slowly than sales because variable costs rise with each sales dollar."
            )

    return {
        "summary": {
            **primary,
            "grandTotalExpenses": round_money(current_sales * variable_cost_pct / 100.0 + fixed_expenses),
            "newGrandTotalExpenses": round_money(
                (primary["newSales"] or 0) * variable_cost_pct / 100.0 + fixed_expenses
            ),
        },
        "rows": rows,
        "warnings": warnings,
    }
