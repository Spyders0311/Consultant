from __future__ import annotations

from .helpers import num, pct, round_money
from .job_costing_core import (
    compute_advanced_bid_line,
    compute_estimate_line,
    compute_job_cost_line,
    compute_labor_burden_row,
    compute_simple_bid_line,
)

MONTH_LABELS = [
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


def _labor_burden_from_dict(data: dict, *, default_name: str) -> dict:
    annual_salary = num(data.get("annualSalary"))
    hourly_wage = num(data.get("hourlyWage"))
    hours_per_year = num(data.get("hoursPerYear")) or 2080.0
    if annual_salary <= 0 and hourly_wage > 0:
        annual_salary = hourly_wage * hours_per_year

    return compute_labor_burden_row(
        employee_name=str(data.get("employeeName") or default_name),
        annual_salary=annual_salary,
        hours_per_year=hours_per_year,
        fica_pct=num(data.get("ficaPct")) or 7.65,
        unemployment_pct=num(data.get("unemploymentPct")) or 1.0,
        workers_comp_pct=num(data.get("workersCompPct")),
        health_insurance_annual=num(data.get("healthInsuranceAnnual")),
        retirement_pct=num(data.get("retirementPct")),
        other_benefits_annual=num(data.get("otherBenefitsAnnual")),
    )


def calculate_f200b_fully_burdened_labor(inputs: dict) -> dict:
    row = _labor_burden_from_dict(inputs, default_name="Employee")
    warnings: list[str] = []
    if num(inputs.get("annualSalary")) <= 0 and num(inputs.get("hourlyWage")) <= 0:
        warnings.append("Provide an annual salary or hourly wage.")

    return {
        "summary": {
            **row,
            "employeeValueHourly": row.get("fullyBurdenedHourly"),
        },
        "rows": [row],
        "warnings": warnings,
    }


def calculate_f200a_labor_burden(inputs: dict) -> dict:
    employees = inputs.get("employees")
    if not isinstance(employees, list):
        employees = []

    rows: list[dict] = []
    total_salary = 0.0
    total_burden = 0.0
    total_fully_burdened = 0.0
    total_hours = 0.0

    for index, raw_employee in enumerate(employees[:10]):
        employee = raw_employee if isinstance(raw_employee, dict) else {}
        hours_per_year = num(employee.get("hoursPerYear")) or 2080.0
        row = _labor_burden_from_dict(employee, default_name=f"Employee {index + 1}")
        rows.append(row)
        total_salary += num(employee.get("annualSalary")) or (
            num(employee.get("hourlyWage")) * hours_per_year
        )
        total_burden += row.get("totalBurden") or 0.0
        total_fully_burdened += row.get("fullyBurdenedAnnual") or 0.0
        total_hours += hours_per_year

    warnings: list[str] = []
    if not rows:
        warnings.append("No employees were provided.")

    return {
        "summary": {
            "employeeCount": len(rows),
            "totalSalary": round_money(total_salary),
            "totalBurden": round_money(total_burden),
            "averageBurdenPct": pct(total_burden, total_salary),
            "totalFullyBurdenedAnnual": round_money(total_fully_burdened),
            "averageFullyBurdenedHourly": round_money(total_fully_burdened / total_hours) if total_hours else None,
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_f700c_annual_budget(inputs: dict) -> dict:
    budget_lines = inputs.get("budgetLines")
    if not isinstance(budget_lines, list):
        budget_lines = []

    income_tax_rate = num(inputs.get("incomeTaxRatePercent")) / 100.0
    line_rows: list[dict] = []
    annual_revenue = 0.0
    annual_variable = 0.0
    annual_fixed = 0.0

    for index, raw_line in enumerate(budget_lines[:80]):
        line = raw_line if isinstance(raw_line, dict) else {}
        category = str(line.get("category") or "fixed-cost").lower()
        line_item = str(line.get("lineItem") or f"Line {index + 1}")
        annual_amount = num(line.get("annualAmount"))
        growth_pct = num(line.get("growthPct"))

        if category == "revenue":
            annual_revenue += annual_amount
        elif category == "variable-cost":
            annual_variable += annual_amount
        else:
            annual_fixed += annual_amount

        line_rows.append(
            {
                "lineItem": line_item,
                "category": category.replace("-", " ").title(),
                "annualAmount": round_money(annual_amount),
                "growthPct": growth_pct,
                "monthlyAverage": round_money(annual_amount / 12.0),
            }
        )

    monthly_rows: list[dict] = []
    for month_index, month_label in enumerate(MONTH_LABELS):
        month_revenue = annual_revenue / 12.0
        month_variable = annual_variable / 12.0
        month_fixed = annual_fixed / 12.0
        month_contribution = month_revenue - month_variable
        month_operating = month_contribution - month_fixed
        month_tax = max(month_operating, 0.0) * income_tax_rate
        month_net = month_operating - month_tax
        monthly_rows.append(
            {
                "month": month_label,
                "revenue": round_money(month_revenue),
                "variableCosts": round_money(month_variable),
                "fixedCosts": round_money(month_fixed),
                "operatingIncome": round_money(month_operating),
                "incomeTax": round_money(month_tax),
                "netIncome": round_money(month_net),
            }
        )

    contribution_margin = annual_revenue - annual_variable
    operating_income = contribution_margin - annual_fixed
    income_tax = max(operating_income, 0.0) * income_tax_rate
    net_income = operating_income - income_tax

    warnings: list[str] = []
    if operating_income < 0:
        warnings.append("Budgeted operating income is negative.")
    if not line_rows:
        warnings.append("No budget lines were provided.")

    return {
        "summary": {
            "totalRevenue": round_money(annual_revenue),
            "totalVariableCosts": round_money(annual_variable),
            "totalFixedCosts": round_money(annual_fixed),
            "contributionMarginPct": pct(contribution_margin, annual_revenue),
            "operatingIncome": round_money(operating_income),
            "incomeTax": round_money(income_tax),
            "netIncome": round_money(net_income),
            "netMarginPct": pct(net_income, annual_revenue),
        },
        "rows": monthly_rows,
        "lineRows": line_rows,
        "warnings": warnings,
    }


def calculate_job_estimating_master(inputs: dict) -> dict:
    estimate_lines = inputs.get("estimateLines")
    if not isinstance(estimate_lines, list):
        estimate_lines = []

    job_overhead_pct = num(inputs.get("jobOverheadPct"))
    profit_pct = num(inputs.get("profitPct"))

    rows: list[dict] = []
    direct_total = 0.0
    labor_total = 0.0
    material_total = 0.0
    subcontract_total = 0.0

    for index, raw_line in enumerate(estimate_lines[:60]):
        line = raw_line if isinstance(raw_line, dict) else {}
        cost_type = str(line.get("costType") or "material").lower()
        computed = compute_estimate_line(
            description=str(line.get("description") or f"Item {index + 1}"),
            quantity=num(line.get("quantity")) or 1.0,
            unit_cost=num(line.get("unitCost")),
            cost_type=cost_type,
        )
        rows.append(computed)
        extended = computed.get("extendedCost") or 0.0
        direct_total += extended
        if cost_type == "labor":
            labor_total += extended
        elif cost_type == "subcontract":
            subcontract_total += extended
        else:
            material_total += extended

    overhead = direct_total * job_overhead_pct / 100.0
    cost_plus_overhead = direct_total + overhead
    profit = cost_plus_overhead * profit_pct / 100.0
    bid_total = cost_plus_overhead + profit

    warnings: list[str] = []
    if not rows:
        warnings.append("No estimate lines were provided.")

    return {
        "summary": {
            "clientName": str(inputs.get("clientName") or ""),
            "jobNumber": str(inputs.get("jobNumber") or ""),
            "directTotal": round_money(direct_total),
            "laborTotal": round_money(labor_total),
            "materialTotal": round_money(material_total),
            "subcontractTotal": round_money(subcontract_total),
            "overhead": round_money(overhead),
            "profit": round_money(profit),
            "bidTotal": round_money(bid_total),
            "jobOverheadPct": job_overhead_pct,
            "profitPct": profit_pct,
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_f500a_example_bid_worksheet(inputs: dict) -> dict:
    bid_lines = inputs.get("bidLines")
    if not isinstance(bid_lines, list):
        bid_lines = []

    default_overhead_pct = num(inputs.get("defaultOverheadPct"))
    default_profit_pct = num(inputs.get("defaultProfitPct"))

    rows: list[dict] = []
    bid_total = 0.0
    direct_total = 0.0

    for index, raw_line in enumerate(bid_lines[:60]):
        line = raw_line if isinstance(raw_line, dict) else {}
        overhead_pct = num(line.get("overheadPct")) or default_overhead_pct
        profit_pct = num(line.get("profitPct")) or default_profit_pct
        computed = compute_advanced_bid_line(
            description=str(line.get("description") or f"Line {index + 1}"),
            labor_hours=num(line.get("laborHours")),
            labor_rate=num(line.get("laborRate")),
            material_cost=num(line.get("materialCost")),
            equipment_cost=num(line.get("equipmentCost")),
            subcontract_cost=num(line.get("subcontractCost")),
            overhead_pct=overhead_pct,
            profit_pct=profit_pct,
        )
        rows.append(computed)
        bid_total += computed.get("lineTotal") or 0.0
        direct_total += computed.get("directCost") or 0.0

    warnings: list[str] = []
    if not rows:
        warnings.append("No bid lines were provided.")

    return {
        "summary": {
            "bidTotal": round_money(bid_total),
            "directTotal": round_money(direct_total),
            "lineCount": len(rows),
            "defaultOverheadPct": default_overhead_pct,
            "defaultProfitPct": default_profit_pct,
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_f500c_job_costing_template(inputs: dict) -> dict:
    cost_lines = inputs.get("costLines")
    if not isinstance(cost_lines, list):
        cost_lines = []

    rows: list[dict] = []
    total_estimated = 0.0
    total_actual = 0.0

    for index, raw_line in enumerate(cost_lines[:60]):
        line = raw_line if isinstance(raw_line, dict) else {}
        computed = compute_job_cost_line(
            description=str(line.get("description") or f"Line {index + 1}"),
            category=str(line.get("category") or "General"),
            estimated_cost=num(line.get("estimatedCost")),
            actual_cost=num(line.get("actualCost")),
        )
        rows.append(computed)
        total_estimated += computed.get("estimatedCost") or 0.0
        total_actual += computed.get("actualCost") or 0.0

    total_variance = total_actual - total_estimated
    warnings: list[str] = []
    if not rows:
        warnings.append("No job cost lines were provided.")
    if total_variance > 0:
        warnings.append("Actual costs exceed estimated costs.")

    return {
        "summary": {
            "jobName": str(inputs.get("jobName") or ""),
            "totalEstimated": round_money(total_estimated),
            "totalActual": round_money(total_actual),
            "totalVariance": round_money(total_variance),
            "variancePct": pct(total_variance, total_estimated),
            "lineCount": len(rows),
        },
        "rows": rows,
        "warnings": warnings,
    }


def calculate_four_year_comp_pl_optimal(inputs: dict) -> dict:
    years = inputs.get("years") or []
    rows = []
    best_margin = None
    best_year = None
    for raw in years[:4]:
        row = raw if isinstance(raw, dict) else {}
        revenue = num(row.get("revenue"))
        cogs = num(row.get("cogs"))
        opex = num(row.get("operatingExpenses"))
        gross = revenue - cogs
        net = gross - opex
        margin = pct(net, revenue)
        if margin is not None and (best_margin is None or margin > best_margin):
            best_margin = margin
            best_year = row.get("year")
        rows.append(
            {
                "year": row.get("year"),
                "revenue": round_money(revenue),
                "netIncome": round_money(net),
                "netMarginPct": margin,
            }
        )
    return {
        "summary": {
            "optimalYear": best_year,
            "optimalNetMarginPct": best_margin,
            "yearCount": len(rows),
        },
        "rows": rows,
        "warnings": [] if rows else ["Provide up to four P&L years."],
    }


def calculate_f700b_budget_planning(inputs: dict) -> dict:
    annual_revenue = num(inputs.get("annualRevenue"))
    growth_pct = num(inputs.get("growthPercent")) or 5.0
    categories = inputs.get("categories") or []
    rows = []
    total_budget = 0.0
    for raw in categories[:24]:
        item = raw if isinstance(raw, dict) else {}
        base = num(item.get("annualAmount"))
        amount = base * (1 + growth_pct / 100.0)
        rows.append({"category": item.get("category") or "General", "budgetAmount": round_money(amount)})
        total_budget += amount
    return {
        "summary": {
            "annualRevenue": round_money(annual_revenue),
            "growthPercent": growth_pct,
            "totalBudget": round_money(total_budget),
            "budgetToRevenuePct": pct(total_budget, annual_revenue),
        },
        "rows": rows,
        "warnings": [] if rows else ["Add budget categories to plan."],
    }


def calculate_employee_productivity(inputs: dict) -> dict:
    revenue = num(inputs.get("annualRevenue"))
    employees = num(inputs.get("employeeCount")) or 1.0
    hours = num(inputs.get("hoursPerEmployee")) or 2080.0
    revenue_per_employee = revenue / employees if employees else 0
    revenue_per_hour = revenue / (employees * hours) if employees and hours else 0
    return {
        "summary": {
            "annualRevenue": round_money(revenue),
            "employeeCount": employees,
            "revenuePerEmployee": round_money(revenue_per_employee),
            "revenuePerHour": round_money(revenue_per_hour),
        },
        "rows": [
            {
                "metric": "Revenue / Employee",
                "value": round_money(revenue_per_employee),
            },
            {"metric": "Revenue / Labor Hour", "value": round_money(revenue_per_hour)},
        ],
        "warnings": [],
    }


def calculate_six_wk_cash_flow_wa(inputs: dict) -> dict:
    opening = num(inputs.get("openingCash"))
    weeks = inputs.get("weeks") or []
    rows = []
    balance = opening
    for index, raw in enumerate(weeks[:6]):
        week = raw if isinstance(raw, dict) else {}
        inflow = num(week.get("inflow"))
        outflow = num(week.get("outflow"))
        balance += inflow - outflow
        rows.append(
            {
                "week": week.get("label") or f"Week {index + 1}",
                "inflow": round_money(inflow),
                "outflow": round_money(outflow),
                "endingCash": round_money(balance),
            }
        )
    return {
        "summary": {
            "openingCash": round_money(opening),
            "endingCash": round_money(balance),
            "netChange": round_money(balance - opening),
        },
        "rows": rows,
        "warnings": [] if rows else ["Enter six weekly cash flow rows."],
    }
