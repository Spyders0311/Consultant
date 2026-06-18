from __future__ import annotations

from .helpers import pct, round_money, safe_ratio


def compute_labor_burden_row(
    *,
    employee_name: str,
    annual_salary: float,
    hours_per_year: float,
    fica_pct: float,
    unemployment_pct: float,
    workers_comp_pct: float,
    health_insurance_annual: float,
    retirement_pct: float,
    other_benefits_annual: float,
) -> dict:
    hourly_wage = annual_salary / hours_per_year if hours_per_year > 0 else 0.0
    fica = annual_salary * fica_pct / 100.0
    unemployment = annual_salary * unemployment_pct / 100.0
    workers_comp = annual_salary * workers_comp_pct / 100.0
    retirement = annual_salary * retirement_pct / 100.0
    total_burden = fica + unemployment + workers_comp + health_insurance_annual + retirement + other_benefits_annual
    fully_burdened_annual = annual_salary + total_burden
    fully_burdened_hourly = fully_burdened_annual / hours_per_year if hours_per_year > 0 else None
    burden_pct = pct(total_burden, annual_salary)

    return {
        "employeeName": employee_name,
        "annualSalary": round_money(annual_salary),
        "hourlyWage": round_money(hourly_wage),
        "hoursPerYear": hours_per_year,
        "fica": round_money(fica),
        "unemployment": round_money(unemployment),
        "workersComp": round_money(workers_comp),
        "healthInsurance": round_money(health_insurance_annual),
        "retirement": round_money(retirement),
        "otherBenefits": round_money(other_benefits_annual),
        "totalBurden": round_money(total_burden),
        "burdenPct": burden_pct,
        "fullyBurdenedAnnual": round_money(fully_burdened_annual),
        "fullyBurdenedHourly": round_money(fully_burdened_hourly) if fully_burdened_hourly is not None else None,
    }


def compute_simple_bid_line(
    *,
    description: str,
    labor_hours: float,
    labor_rate: float,
    material_cost: float,
    markup_pct: float,
) -> dict:
    labor_cost = labor_hours * labor_rate
    direct_cost = labor_cost + material_cost
    line_total = direct_cost * (1 + markup_pct / 100.0)
    return {
        "description": description,
        "laborHours": labor_hours,
        "laborRate": round_money(labor_rate),
        "laborCost": round_money(labor_cost),
        "materialCost": round_money(material_cost),
        "directCost": round_money(direct_cost),
        "markupPct": markup_pct,
        "lineTotal": round_money(line_total),
    }


def compute_advanced_bid_line(
    *,
    description: str,
    labor_hours: float,
    labor_rate: float,
    material_cost: float,
    equipment_cost: float,
    subcontract_cost: float,
    overhead_pct: float,
    profit_pct: float,
) -> dict:
    labor_cost = labor_hours * labor_rate
    direct_cost = labor_cost + material_cost + equipment_cost + subcontract_cost
    overhead = direct_cost * overhead_pct / 100.0
    cost_plus_overhead = direct_cost + overhead
    profit = cost_plus_overhead * profit_pct / 100.0
    line_total = cost_plus_overhead + profit

    return {
        "description": description,
        "laborCost": round_money(labor_cost),
        "materialCost": round_money(material_cost),
        "equipmentCost": round_money(equipment_cost),
        "subcontractCost": round_money(subcontract_cost),
        "directCost": round_money(direct_cost),
        "overhead": round_money(overhead),
        "profit": round_money(profit),
        "lineTotal": round_money(line_total),
        "overheadPct": overhead_pct,
        "profitPct": profit_pct,
    }


def compute_estimate_line(
    *,
    description: str,
    quantity: float,
    unit_cost: float,
    cost_type: str,
) -> dict:
    extended_cost = quantity * unit_cost
    return {
        "description": description,
        "quantity": quantity,
        "unitCost": round_money(unit_cost),
        "costType": cost_type,
        "extendedCost": round_money(extended_cost),
    }


def compute_job_cost_line(
    *,
    description: str,
    category: str,
    estimated_cost: float,
    actual_cost: float,
) -> dict:
    variance = actual_cost - estimated_cost
    variance_pct = pct(variance, estimated_cost) if estimated_cost else None
    return {
        "description": description,
        "category": category,
        "estimatedCost": round_money(estimated_cost),
        "actualCost": round_money(actual_cost),
        "variance": round_money(variance),
        "variancePct": variance_pct,
        "status": "Over" if variance > 0 else "Under" if variance < 0 else "On Target",
    }
