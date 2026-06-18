from __future__ import annotations


def _ratio(percent: float | None) -> float:
    if percent is None:
        return 0.0
    return float(percent) / 100.0


def calculate_five_year_projections(payload: dict) -> dict:
    base_year = int(payload["baseYear"])
    horizon = int(payload.get("horizonYears") or 5)
    horizon = min(max(horizon, 3), 10)

    initial_revenue = float(payload["baseRevenue"])
    revenue_growth_rate = _ratio(payload.get("revenueGrowthPercent"))
    cogs_rate = _ratio(payload.get("baseCogsPercent"))
    initial_fixed = float(payload.get("baseFixedExpenses") or 0)

    payroll = payload.get("fixedPayroll")
    rent = payload.get("fixedRentUtilities")
    other = payload.get("fixedOther")
    if payroll is not None or rent is not None or other is not None:
        initial_fixed = float(payroll or 0) + float(rent or 0) + float(other or 0)

    fixed_growth_rate = _ratio(payload.get("fixedExpenseGrowthPercent"))
    tax_rate = _ratio(payload.get("taxRatePercent")) if payload.get("taxRatePercent") is not None else None
    market_growth = _ratio(payload.get("marketGrowthPercent"))
    inflation = _ratio(payload.get("inflationPercent"))
    discount_rate = _ratio(payload.get("discountRatePercent"))

    blended_growth = revenue_growth_rate + 0.35 * market_growth
    blended_growth = min(max(blended_growth, -0.8), 1.0)
    fixed_growth_with_inflation = fixed_growth_rate + inflation

    warnings: list[str] = []
    if initial_revenue == 0:
        warnings.append("Base revenue is zero. Margin metrics and earnings may be less meaningful.")
    if tax_rate is None:
        warnings.append("Tax rate not provided. Taxes and net income were omitted.")

    years: list[dict] = []
    pv_total = 0.0

    for offset in range(horizon):
        year = base_year + offset
        growth_decay = max(0.0, offset * 0.0035)
        effective_growth = blended_growth - growth_decay
        revenue = initial_revenue * ((1 + effective_growth) ** offset)
        cogs = revenue * cogs_rate
        gross_profit = revenue - cogs
        gross_margin_pct = (gross_profit / revenue * 100) if revenue > 0 else None

        fixed_expenses = initial_fixed * ((1 + fixed_growth_with_inflation) ** offset)
        ebitda = gross_profit - fixed_expenses
        ebitda_margin_pct = (ebitda / revenue * 100) if revenue > 0 else None

        taxes = None
        net_income = None
        if tax_rate is not None:
            taxes = max(0.0, ebitda * tax_rate)
            net_income = ebitda - taxes

        free_cash_flow = ebitda * (1 - (tax_rate or 0))
        if discount_rate and discount_rate > 0:
            pv_total += free_cash_flow / ((1 + discount_rate) ** (offset + 1))

        years.append(
            {
                "year": year,
                "revenue": round(revenue, 2),
                "cogs": round(cogs, 2),
                "grossProfit": round(gross_profit, 2),
                "grossMarginPct": gross_margin_pct,
                "fixedExpenses": round(fixed_expenses, 2),
                "ebitda": round(ebitda, 2),
                "ebitdaMarginPct": ebitda_margin_pct,
                "taxes": round(taxes, 2) if taxes is not None else None,
                "netIncome": round(net_income, 2) if net_income is not None else None,
                "freeCashFlow": round(free_cash_flow, 2),
            }
        )

    summary = {}
    if discount_rate and discount_rate > 0:
        summary["enterpriseValueNpv"] = round(pv_total, 2)
    if years:
        summary["blendedGrowthRatePercent"] = round(blended_growth * 100, 2)

    if all((row.get("ebitda") or 0) < 0 for row in years):
        warnings.append("EBITDA is negative in every projected year. Review pricing, COGS, and fixed cost inputs.")

    return {"years": years, "summary": summary, "warnings": warnings, "horizonYears": horizon}
