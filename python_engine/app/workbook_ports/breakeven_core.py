from __future__ import annotations

from .helpers import pct, round_money, safe_ratio


def contribution_margin_summary(
    revenue: float,
    variable_costs: float,
    fixed_costs: float,
    *,
    business_days: float = 365.0,
) -> dict:
    contribution_margin = revenue - variable_costs
    contribution_ratio = safe_ratio(contribution_margin, revenue) or 0.0
    operating_income = contribution_margin - fixed_costs
    breakeven_sales = fixed_costs / contribution_ratio if contribution_ratio > 0 else None
    breakeven_days = (
        (breakeven_sales / revenue * business_days) if breakeven_sales is not None and revenue > 0 else None
    )
    warnings: list[str] = []
    if operating_income < 0:
        warnings.append("Operating income is negative at the current revenue level.")
    if contribution_ratio <= 0:
        warnings.append("Contribution margin is not positive, so breakeven sales cannot be calculated.")
    return {
        "contributionMargin": round_money(contribution_margin),
        "contributionMarginPct": pct(contribution_margin, revenue),
        "operatingIncome": round_money(operating_income),
        "breakevenSales": round_money(breakeven_sales),
        "breakevenDays": round(breakeven_days, 1) if breakeven_days is not None else None,
        "warnings": warnings,
    }


def office_tool_breakeven(
    annual_revenue: float,
    cogs_amount: float,
    labor_amount: float,
    fixed_expenses: float,
    profit_amount: float,
    *,
    work_days_per_year: float = 365.0,
) -> dict:
    gross_margin_amount = annual_revenue - cogs_amount
    total_expenses = annual_revenue - profit_amount
    variable_costs_amount = cogs_amount + labor_amount
    other_costs_amount = total_expenses - fixed_expenses - variable_costs_amount
    fixed_costs_amount = fixed_expenses + (other_costs_amount / 2)
    fixed_plus_profit = fixed_costs_amount + profit_amount
    breakeven_percent = safe_ratio(fixed_costs_amount, fixed_plus_profit)
    breakeven_revenue = annual_revenue * breakeven_percent if breakeven_percent is not None else None
    breakeven_days = work_days_per_year * breakeven_percent if breakeven_percent is not None else None
    return {
        "grossMarginAmount": round_money(gross_margin_amount),
        "grossMarginPercent": pct(gross_margin_amount, annual_revenue) or 0.0,
        "variableCostsAmount": round_money(variable_costs_amount),
        "fixedCostsAmount": round_money(fixed_costs_amount),
        "otherCostsAmount": round_money(other_costs_amount),
        "breakevenRevenue": round_money(breakeven_revenue),
        "breakevenPercent": breakeven_percent * 100 if breakeven_percent is not None else None,
        "breakevenDays": round(breakeven_days, 1) if breakeven_days is not None else None,
        "warnings": [],
    }


def sales_increase_profit_impact(
    current_sales: float,
    sales_increase_pct: float,
    variable_cost_pct: float,
    fixed_expenses: float,
) -> dict:
    variable_ratio = variable_cost_pct / 100.0
    current_variable = current_sales * variable_ratio
    current_profit = current_sales - current_variable - fixed_expenses
    new_sales = current_sales * (1 + sales_increase_pct / 100.0)
    new_variable = new_sales * variable_ratio
    new_profit = new_sales - new_variable - fixed_expenses
    profit_change = new_profit - current_profit
    return {
        "currentSales": round_money(current_sales),
        "newSales": round_money(new_sales),
        "salesChange": round_money(new_sales - current_sales),
        "currentProfit": round_money(current_profit),
        "newProfit": round_money(new_profit),
        "profitChange": round_money(profit_change),
        "profitChangePct": pct(profit_change, abs(current_profit) if current_profit else 1),
        "salesIncreasePct": sales_increase_pct,
        "variableCostPct": variable_cost_pct,
        "fixedExpenses": round_money(fixed_expenses),
    }


def gross_margin_breakeven(annual_revenue: float, cogs_amount: float, fixed_expenses: float) -> dict:
    gross_margin = annual_revenue - cogs_amount
    gross_margin_pct = pct(gross_margin, annual_revenue) or 0.0
    breakeven_revenue = None
    warnings: list[str] = []
    if gross_margin > 0 and gross_margin_pct > 0:
        breakeven_revenue = fixed_expenses / (gross_margin_pct / 100.0)
    else:
        warnings.append("Gross margin is zero or negative; breakeven revenue cannot be computed.")
    breakeven_percent = safe_ratio(breakeven_revenue, annual_revenue)
    return {
        "grossMarginAmount": round_money(gross_margin),
        "grossMarginPercent": gross_margin_pct,
        "breakevenRevenue": round_money(breakeven_revenue),
        "breakevenPercent": breakeven_percent * 100 if breakeven_percent is not None else None,
        "warnings": warnings,
    }
