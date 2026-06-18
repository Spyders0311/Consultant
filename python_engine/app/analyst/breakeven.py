from __future__ import annotations

from ..workbook_ports.breakeven_core import contribution_margin_summary, office_tool_breakeven


def _capacity_targets(breakeven_revenue: float | None, work_days: float, work_hours: float) -> dict:
    if breakeven_revenue is None:
        return {
            "breakevenMonthly": None,
            "breakevenWeekly": None,
            "breakevenDaily": None,
            "breakevenHourly": None,
        }
    daily = breakeven_revenue / work_days if work_days > 0 else None
    return {
        "breakevenMonthly": breakeven_revenue / 12,
        "breakevenWeekly": daily * 5 if daily is not None else None,
        "breakevenDaily": daily,
        "breakevenHourly": daily / work_hours if daily is not None and work_hours > 0 else None,
    }


def calculate_analyst_breakeven(payload: dict) -> dict:
    annual_revenue = float(payload.get("annualRevenue") or 0)
    cogs_amount = float(payload.get("cogsAmount") or 0)
    fixed_expenses = float(payload.get("fixedExpensesAmount") or 0)
    labor_amount = float(payload.get("laborAmount") or 0)
    indirect_costs = float(payload.get("indirectCostsAmount") or 0)
    general_admin = float(payload.get("generalAdministrativeCostsAmount") or 0)
    profit_amount = payload.get("profitAmount")
    profit_amount = float(profit_amount) if profit_amount is not None else None
    months_in_period = float(payload.get("monthsInPeriod") or 12)
    method = str(payload.get("calculationMethod") or "auto").lower()
    work_days = float(payload.get("workDaysPerYear") or 250)
    work_hours = float(payload.get("workHoursPerDay") or 8)

    period_factor = months_in_period / 12.0 if months_in_period > 0 else 1.0
    scaled_revenue = annual_revenue * period_factor
    scaled_cogs = cogs_amount * period_factor
    scaled_labor = labor_amount * period_factor
    scaled_fixed = fixed_expenses * period_factor
    scaled_indirect = indirect_costs * period_factor
    scaled_general = general_admin * period_factor
    scaled_profit = profit_amount * period_factor if profit_amount is not None else None

    warnings: list[str] = []

    if method == "auto":
        if scaled_profit is not None:
            method = "office_tool"
        elif scaled_labor > 0 or scaled_indirect > 0 or scaled_general > 0:
            method = "contribution"
        else:
            method = "gross_margin"

    gross_margin_amount = scaled_revenue - scaled_cogs
    gross_margin_percent = (gross_margin_amount / scaled_revenue * 100) if scaled_revenue > 0 else 0.0

    breakeven_revenue = None
    breakeven_percent = None
    breakeven_days = None
    variable_costs_amount = None
    fixed_costs_amount = None
    contribution_margin = None
    operating_income = None

    if method == "office_tool":
        if scaled_profit is None:
            warnings.append("Office-tool method requires profit amount; falling back to contribution margin.")
            method = "contribution"
        else:
            office = office_tool_breakeven(
                scaled_revenue,
                scaled_cogs,
                scaled_labor,
                scaled_fixed,
                scaled_profit,
                work_days_per_year=work_days,
            )
            breakeven_revenue = office.get("breakevenRevenue")
            breakeven_percent = office.get("breakevenPercent")
            breakeven_days = office.get("breakevenDays")
            variable_costs_amount = office.get("variableCostsAmount")
            fixed_costs_amount = office.get("fixedCostsAmount")
            gross_margin_amount = office.get("grossMarginAmount", gross_margin_amount)
            gross_margin_percent = office.get("grossMarginPercent", gross_margin_percent)
            warnings.extend(office.get("warnings") or [])

    if method == "contribution":
        variable_costs = scaled_cogs + scaled_labor
        fixed_costs = scaled_fixed + scaled_indirect + scaled_general
        summary = contribution_margin_summary(
            scaled_revenue,
            variable_costs,
            fixed_costs,
            business_days=work_days,
        )
        breakeven_revenue = summary.get("breakevenSales")
        breakeven_days = summary.get("breakevenDays")
        contribution_margin = summary.get("contributionMargin")
        operating_income = summary.get("operatingIncome")
        variable_costs_amount = variable_costs
        fixed_costs_amount = fixed_costs
        if scaled_revenue > 0 and breakeven_revenue is not None:
            breakeven_percent = (breakeven_revenue / scaled_revenue) * 100
        warnings.extend(summary.get("warnings") or [])

    if method == "gross_margin":
        total_fixed = scaled_fixed + scaled_indirect + scaled_general
        if gross_margin_amount <= 0 or gross_margin_percent <= 0:
            warnings.append(
                "Gross margin is zero or negative. Breakeven cannot be computed until revenue exceeds COGS."
            )
        else:
            breakeven_revenue = total_fixed / (gross_margin_percent / 100.0)
            if scaled_revenue > 0:
                breakeven_percent = (breakeven_revenue / scaled_revenue) * 100
        fixed_costs_amount = total_fixed

    if annual_revenue <= 0:
        warnings.append("Annual revenue is zero. Breakeven percent cannot be compared against current revenue.")

    capacity = _capacity_targets(breakeven_revenue, work_days, work_hours)

    return {
        "calculationMethod": method,
        "grossMarginAmount": gross_margin_amount,
        "grossMarginPercent": gross_margin_percent,
        "variableCostsAmount": variable_costs_amount,
        "fixedCostsAmount": fixed_costs_amount,
        "contributionMargin": contribution_margin,
        "operatingIncome": operating_income,
        "breakevenRevenue": breakeven_revenue,
        "breakevenPercent": breakeven_percent,
        "breakevenDays": breakeven_days,
        "monthsInPeriod": months_in_period,
        **capacity,
        "notes": warnings,
    }
