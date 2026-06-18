from __future__ import annotations

from collections import defaultdict

from .breakeven_core import (
    contribution_margin_summary,
    office_tool_breakeven,
    sales_increase_profit_impact,
)
from .helpers import date_from_value, date_text, num, pct, round_money, safe_ratio


def calculate_ar_turns(inputs: dict) -> dict:
    days_per_year = num(inputs.get("daysPerYear")) or 365.0
    annual_credit_sales = num(inputs.get("annualCreditSales"))
    beginning_ar = num(inputs.get("beginningArBalance"))
    ending_ar = num(inputs.get("endingArBalance"))
    average_ar_balance = num(inputs.get("averageArBalance"))

    if average_ar_balance <= 0 and (beginning_ar > 0 or ending_ar > 0):
        average_ar_balance = (beginning_ar + ending_ar) / 2.0

    ar_turns = safe_ratio(annual_credit_sales, average_ar_balance)
    avg_collection_period = days_per_year / ar_turns if ar_turns else None

    rows: list[dict] = [
        {
            "scenario": "Primary calculation",
            "annualCreditSales": round_money(annual_credit_sales),
            "averageArBalance": round_money(average_ar_balance),
            "arTurns": round(ar_turns, 2) if ar_turns is not None else None,
            "avgCollectionPeriodDays": (
                round(avg_collection_period, 1) if avg_collection_period is not None else None
            ),
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
            "avgCollectionPeriodDays": (
                round(avg_collection_period, 1) if avg_collection_period is not None else None
            ),
            "daysPerYear": days_per_year,
            "arPctOfSales": pct(average_ar_balance, annual_credit_sales) or 0.0,
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_inventory_turn(inputs: dict) -> dict:
    days_per_year = num(inputs.get("daysPerYear")) or 365.0
    cost_of_sales = num(inputs.get("costOfSales"))
    beginning_inventory = num(inputs.get("beginningInventory"))
    ending_inventory = num(inputs.get("endingInventory"))
    average_inventory = num(inputs.get("averageInventory"))

    if average_inventory <= 0 and (beginning_inventory > 0 or ending_inventory > 0):
        average_inventory = (beginning_inventory + ending_inventory) / 2.0

    inventory_turns = safe_ratio(cost_of_sales, average_inventory)
    average_days_held = days_per_year / inventory_turns if inventory_turns else None

    rows: list[dict] = [
        {
            "scenario": "Primary calculation",
            "costOfSales": round_money(cost_of_sales),
            "averageInventory": round_money(average_inventory),
            "inventoryTurnsPerYear": round(inventory_turns, 2) if inventory_turns is not None else None,
            "averageDaysHeld": round(average_days_held, 1) if average_days_held is not None else None,
        }
    ]

    if cost_of_sales > 0:
        example_inventory = round_money(cost_of_sales / 8.0)
        rows.append(
            {
                "scenario": "Example: 8.0 inventory turns",
                "costOfSales": round_money(cost_of_sales),
                "averageInventory": example_inventory,
                "inventoryTurnsPerYear": 8.0,
                "averageDaysHeld": round(days_per_year / 8.0, 1),
            }
        )

    warnings: list[str] = []
    if cost_of_sales <= 0:
        warnings.append("Cost of sales is zero; inventory turn metrics may be unavailable.")
    if average_inventory <= 0:
        warnings.append("Average inventory is zero; inventory turn metrics may be unavailable.")

    return {
        "summary": {
            "costOfSales": round_money(cost_of_sales),
            "averageInventory": round_money(average_inventory),
            "inventoryTurnsPerYear": round(inventory_turns, 2) if inventory_turns is not None else None,
            "averageDaysHeld": round(average_days_held, 1) if average_days_held is not None else None,
            "daysPerYear": days_per_year,
            "inventoryPctOfCogs": pct(average_inventory, cost_of_sales) or 0.0,
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_cost_vs_sales_increase(inputs: dict) -> dict:
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

    variable_ratio = variable_cost_pct / 100.0
    grand_total_expenses = current_sales * variable_ratio + fixed_expenses
    new_grand_total_expenses = primary["newSales"] * variable_ratio + fixed_expenses if primary["newSales"] else 0.0

    return {
        "summary": {
            **primary,
            "grandTotalExpenses": round_money(grand_total_expenses),
            "newGrandTotalExpenses": round_money(new_grand_total_expenses),
        },
        "rows": rows,
        "warnings": [],
    }


def calculate_overhead_calcs(inputs: dict) -> dict:
    total_revenue = num(inputs.get("totalRevenue"))
    total_overhead = num(inputs.get("totalOverhead"))
    total_material_costs = num(inputs.get("totalMaterialCosts"))
    total_direct_labor_costs = num(inputs.get("totalDirectLaborCosts"))
    factoring_rate = num(inputs.get("factoringRate"))

    direct_costs = total_material_costs + total_direct_labor_costs
    overhead_factor_on_direct = safe_ratio(total_overhead, direct_costs)
    overhead_per_labor_dollar = safe_ratio(total_overhead, total_direct_labor_costs)
    burdened_direct_cost = direct_costs + total_overhead
    markup_on_direct = safe_ratio(burdened_direct_cost, direct_costs)
    factoring_cost = total_revenue * factoring_rate / 100.0 if factoring_rate else 0.0
    gross_profit = total_revenue - direct_costs - total_overhead - factoring_cost

    metric_rows = [
        ("Total Revenue", total_revenue),
        ("Material Costs", total_material_costs),
        ("Direct Labor", total_direct_labor_costs),
        ("Total Overhead (Fixed Costs)", total_overhead),
        ("Burdened Direct Cost", burdened_direct_cost),
        ("Gross Profit After Overhead", gross_profit),
    ]
    if factoring_rate:
        metric_rows.insert(5, ("Factoring Cost", factoring_cost))

    rows = [
        {
            "metric": label,
            "amount": round_money(amount),
            "pctOfRevenue": pct(amount, total_revenue),
        }
        for label, amount in metric_rows
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
            "totalMaterialCosts": round_money(total_material_costs),
            "totalDirectLaborCosts": round_money(total_direct_labor_costs),
            "directCosts": round_money(direct_costs),
            "overheadFactorOnDirect": round(overhead_factor_on_direct, 4) if overhead_factor_on_direct is not None else None,
            "overheadPerLaborDollar": round(overhead_per_labor_dollar, 4) if overhead_per_labor_dollar is not None else None,
            "overheadPctOfRevenue": pct(total_overhead, total_revenue),
            "directCostPctOfRevenue": pct(direct_costs, total_revenue),
            "burdenedDirectCost": round_money(burdened_direct_cost),
            "markupOnDirect": round(markup_on_direct, 2) if markup_on_direct is not None else None,
            "factoringCost": round_money(factoring_cost) if factoring_rate else None,
            "grossProfit": round_money(gross_profit),
            "grossMarginPct": pct(gross_profit, total_revenue),
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_f500b_bid_calculation(inputs: dict) -> dict:
    bid_lines = inputs.get("bidLines")
    if not isinstance(bid_lines, list):
        bid_lines = []

    rows: list[dict] = []
    bid_total = 0.0

    for index, raw_line in enumerate(bid_lines):
        line = raw_line if isinstance(raw_line, dict) else {}
        description = str(line.get("description") or f"Line {index + 1}")
        labor_hours = num(line.get("laborHours"))
        labor_rate = num(line.get("laborRate"))
        material_cost = num(line.get("materialCost"))
        markup_pct = num(line.get("markupPct"))

        labor_cost = labor_hours * labor_rate
        direct_cost = labor_cost + material_cost
        line_total = direct_cost * (1 + markup_pct / 100.0)
        bid_total += line_total

        rows.append(
            {
                "description": description,
                "laborHours": labor_hours,
                "laborRate": round_money(labor_rate),
                "laborCost": round_money(labor_cost),
                "materialCost": round_money(material_cost),
                "directCost": round_money(direct_cost),
                "markupPct": markup_pct,
                "lineTotal": round_money(line_total),
            }
        )

    warnings: list[str] = []
    if not rows:
        warnings.append("No bid lines were provided.")

    return {
        "summary": {
            "bidTotal": round_money(bid_total),
            "lineCount": len(rows),
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_super_profit(inputs: dict) -> dict:
    current_sales = num(inputs.get("currentSales"))
    current_profit = num(inputs.get("currentProfit"))
    target_profit_increase = num(inputs.get("targetProfitIncrease"))
    variable_cost_pct = num(inputs.get("variableCostPct"))
    fixed_expenses = num(inputs.get("fixedExpenses"))

    variable_ratio = variable_cost_pct / 100.0
    contribution_ratio = 1.0 - variable_ratio
    target_profit = current_profit + target_profit_increase

    required_sales = None
    sales_increase = None
    sales_increase_pct = None
    if contribution_ratio > 0:
        required_sales = (target_profit + fixed_expenses) / contribution_ratio
        sales_increase = required_sales - current_sales
        sales_increase_pct = pct(sales_increase, current_sales) if current_sales > 0 else None

    warnings: list[str] = []
    if contribution_ratio <= 0:
        warnings.append("Contribution margin is not positive; required sales cannot be calculated.")
    if target_profit_increase <= 0:
        warnings.append("Target profit increase is zero or negative.")

    return {
        "summary": {
            "currentSales": round_money(current_sales),
            "currentProfit": round_money(current_profit),
            "targetProfitIncrease": round_money(target_profit_increase),
            "targetProfit": round_money(target_profit),
            "variableCostPct": variable_cost_pct,
            "fixedExpenses": round_money(fixed_expenses),
            "requiredSales": round_money(required_sales),
            "salesIncrease": round_money(sales_increase),
            "salesIncreasePct": sales_increase_pct,
        },
        "rows": [
            {
                "metric": "Current sales",
                "amount": round_money(current_sales),
            },
            {
                "metric": "Current profit",
                "amount": round_money(current_profit),
            },
            {
                "metric": "Target profit",
                "amount": round_money(target_profit),
            },
            {
                "metric": "Required sales for super profit target",
                "amount": round_money(required_sales),
            },
        ],
        "warnings": warnings,
    }


def calculate_bms_expense_report(inputs: dict) -> dict:
    expenses = inputs.get("expenses")
    if not isinstance(expenses, list):
        expenses = []

    rows: list[dict] = []
    total_amount = 0.0
    category_totals: dict[str, float] = defaultdict(float)

    for raw_expense in expenses:
        expense = raw_expense if isinstance(raw_expense, dict) else {}
        amount = num(expense.get("amount"))
        category = str(expense.get("category") or "Uncategorized")
        description = str(expense.get("description") or "")
        expense_date = date_text(date_from_value(expense.get("date")))

        total_amount += amount
        category_totals[category] += amount
        rows.append(
            {
                "date": expense_date,
                "category": category,
                "description": description,
                "amount": round_money(amount),
            }
        )

    warnings: list[str] = []
    if not rows:
        warnings.append("No expenses were provided.")

    return {
        "summary": {
            "totalExpenses": round_money(total_amount),
            "expenseCount": len(rows),
            "categoryTotals": {key: round_money(value) for key, value in category_totals.items()},
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_f100b_breakeven_sample(inputs: dict) -> dict:
    annual_revenue = num(inputs.get("annualRevenue"))
    cogs_amount = num(inputs.get("cogs"))
    labor_amount = num(inputs.get("labor"))
    fixed_expenses = num(inputs.get("fixedExpenses"))
    profit_amount = num(inputs.get("profit"))
    work_days = num(inputs.get("workDaysPerYear")) or 365.0

    core = office_tool_breakeven(
        annual_revenue,
        cogs_amount,
        labor_amount,
        fixed_expenses,
        profit_amount,
        work_days_per_year=work_days,
    )

    return {
        "summary": {
            "annualRevenue": round_money(annual_revenue),
            "cogs": round_money(cogs_amount),
            "labor": round_money(labor_amount),
            "fixedExpenses": round_money(fixed_expenses),
            "profit": round_money(profit_amount),
            **{key: value for key, value in core.items() if key != "warnings"},
        },
        "rows": [],
        "warnings": core.get("warnings", []),
    }


def calculate_f100d_break_even_tool(inputs: dict) -> dict:
    annual_revenue = num(inputs.get("annualRevenue"))
    variable_cost_pct = num(inputs.get("variableCostPct"))
    fixed_costs = num(inputs.get("fixedCosts"))
    variable_costs = annual_revenue * variable_cost_pct / 100.0

    core = contribution_margin_summary(annual_revenue, variable_costs, fixed_costs)
    warnings = list(core.pop("warnings", []))

    chart_pcts = [50, 75, 100, 125, 150]
    rows: list[dict] = []
    for sales_pct in chart_pcts:
        scenario_sales = annual_revenue * sales_pct / 100.0
        scenario_variable = scenario_sales * variable_cost_pct / 100.0
        operating_income = scenario_sales - scenario_variable - fixed_costs
        rows.append(
            {
                "salesPct": sales_pct,
                "sales": round_money(scenario_sales),
                "variableCosts": round_money(scenario_variable),
                "fixedCosts": round_money(fixed_costs),
                "operatingIncome": round_money(operating_income),
                "operatingMarginPct": pct(operating_income, scenario_sales),
            }
        )

    return {
        "summary": {
            "annualRevenue": round_money(annual_revenue),
            "variableCostPct": variable_cost_pct,
            "fixedCosts": round_money(fixed_costs),
            **core,
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_breakeven_tool_advanced(inputs: dict) -> dict:
    annual_base_revenue = num(inputs.get("annualBaseRevenue"))
    fixed_costs = num(inputs.get("fixedCosts"))
    variable_cost_pct = num(inputs.get("variableCostPct"))
    seasonality = inputs.get("seasonality")
    if not isinstance(seasonality, list):
        seasonality = []

    month_labels = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]

    rows: list[dict] = []
    adjusted_revenue = 0.0
    base_monthly = annual_base_revenue / 12.0

    for index in range(12):
        month_input = seasonality[index] if index < len(seasonality) else {}
        month = month_input if isinstance(month_input, dict) else {}
        flex_pct = num(month.get("flexPct"))
        month_label = str(month.get("month") or month_labels[index])
        month_revenue = base_monthly * (1 + flex_pct / 100.0)
        adjusted_revenue += month_revenue
        rows.append(
            {
                "month": month_label,
                "flexPct": flex_pct,
                "baseMonthRevenue": round_money(base_monthly),
                "adjustedMonthRevenue": round_money(month_revenue),
            }
        )

    variable_costs = adjusted_revenue * variable_cost_pct / 100.0
    core = contribution_margin_summary(adjusted_revenue, variable_costs, fixed_costs)
    warnings = list(core.pop("warnings", []))

    return {
        "summary": {
            "annualBaseRevenue": round_money(annual_base_revenue),
            "adjustedRevenue": round_money(adjusted_revenue),
            "variableCostPct": variable_cost_pct,
            "fixedCosts": round_money(fixed_costs),
            **core,
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_f1000_pl(inputs: dict) -> dict:
    pl_lines = inputs.get("plLines")
    if not isinstance(pl_lines, list):
        pl_lines = []

    rows: list[dict] = []
    revenue = 0.0
    cogs = 0.0
    opex = 0.0

    for raw_line in pl_lines:
        line = raw_line if isinstance(raw_line, dict) else {}
        category = str(line.get("category") or "").lower()
        description = str(line.get("description") or "")
        amount = num(line.get("amount"))

        if category == "revenue":
            revenue += amount
        elif category == "cogs":
            cogs += amount
        elif category == "opex":
            opex += amount

        rows.append(
            {
                "category": category,
                "description": description,
                "amount": round_money(amount),
            }
        )

    gross_profit = revenue - cogs
    operating_income = gross_profit - opex

    warnings: list[str] = []
    if revenue <= 0:
        warnings.append("Revenue is zero; margin percentages may be unavailable.")
    if operating_income < 0:
        warnings.append("Operating income is negative.")

    return {
        "summary": {
            "totalRevenue": round_money(revenue),
            "totalCogs": round_money(cogs),
            "totalOpex": round_money(opex),
            "grossProfit": round_money(gross_profit),
            "grossMarginPct": pct(gross_profit, revenue),
            "operatingIncome": round_money(operating_income),
            "netMarginPct": pct(operating_income, revenue),
        },
        "rows": rows,
        "warnings": warnings,
    }
