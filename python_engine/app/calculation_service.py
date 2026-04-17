from __future__ import annotations

from dataclasses import dataclass

from .models import AnalystWizardInput
from .spreadsheet_context import WorkbookContext


@dataclass(frozen=True)
class ComputedResult:
    summary: dict
    projections: list[dict]


def _to_ratio(percent: float) -> float:
    return percent / 100.0


def run_projection(payload: AnalystWizardInput, workbook: WorkbookContext) -> ComputedResult:
    horizon = payload.horizon_years

    revenue = payload.revenue.current_annual_revenue
    cogs_ratio = _to_ratio(payload.revenue.cogs_percent)
    tax_rate = _to_ratio(payload.market_assumptions.tax_rate_percent)
    discount_rate = _to_ratio(payload.market_assumptions.discount_rate_percent)
    inflation_rate = _to_ratio(payload.market_assumptions.inflation_percent)
    fixed_growth_rate = _to_ratio(payload.fixed_expenses.fixed_expense_growth_percent)

    base_growth_rate = (
        _to_ratio(payload.revenue.revenue_growth_percent)
        + 0.35 * _to_ratio(payload.market_assumptions.market_growth_percent)
        + 0.15 * _to_ratio(payload.market_assumptions.target_market_share_percent)
    )
    base_growth_rate = min(max(base_growth_rate, -0.8), 1.0)

    starting_fixed = payload.fixed_expenses.payroll + payload.fixed_expenses.rent_utilities + payload.fixed_expenses.other
    fixed_growth_with_inflation = fixed_growth_rate + inflation_rate

    projections = []
    pv_cash_flow_total = 0.0
    cumulative_fcf = 0.0
    previous_working_capital = revenue * 0.02
    first_year_ebitda_margin = 0.0

    for year in range(1, horizon + 1):
        growth_decay = max(0.0, (year - 1) * 0.0035)
        effective_growth = base_growth_rate - growth_decay
        revenue = revenue * (1 + effective_growth)

        cogs = revenue * cogs_ratio
        gross_profit = revenue - cogs
        fixed_expenses = starting_fixed * ((1 + fixed_growth_with_inflation) ** year)
        ebitda = gross_profit - fixed_expenses
        if year == 1 and revenue > 0:
            first_year_ebitda_margin = (ebitda / revenue) * 100

        depreciation = fixed_expenses * 0.04
        ebit = ebitda - depreciation
        taxes = max(0.0, ebit * tax_rate)
        nopat = ebit - taxes

        capex = revenue * 0.03
        working_capital = revenue * 0.02
        delta_working_capital = working_capital - previous_working_capital
        previous_working_capital = working_capital

        free_cash_flow = nopat + depreciation - capex - delta_working_capital
        cumulative_fcf += free_cash_flow

        discounted_cash_flow = free_cash_flow / ((1 + discount_rate) ** year)
        pv_cash_flow_total += discounted_cash_flow

        projections.append(
            {
                "year": year,
                "revenue": round(revenue, 2),
                "grossProfit": round(gross_profit, 2),
                "ebitda": round(ebitda, 2),
                "freeCashFlow": round(free_cash_flow, 2),
            }
        )

    terminal_growth = min(max(inflation_rate, 0.01), 0.04)
    if discount_rate <= terminal_growth:
        terminal_growth = max(0.005, discount_rate - 0.01)

    terminal_cash_flow = projections[-1]["freeCashFlow"] * (1 + terminal_growth)
    terminal_value = terminal_cash_flow / max(discount_rate - terminal_growth, 0.005)
    terminal_value_pv = terminal_value / ((1 + discount_rate) ** horizon)
    enterprise_value_npv = pv_cash_flow_total + terminal_value_pv

    summary = {
        "enterpriseValueNpv": round(enterprise_value_npv, 2),
        "yearOneEbitdaMarginPercent": round(first_year_ebitda_margin, 2),
        "cumulativeFreeCashFlow": round(cumulative_fcf, 2),
        "blendedGrowthRatePercent": round(base_growth_rate * 100, 2),
    }

    return ComputedResult(summary=summary, projections=projections)
