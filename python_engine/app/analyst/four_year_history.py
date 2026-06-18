from __future__ import annotations

from datetime import datetime

from .pl_rollup import normalize_pl_year


def _num(value, default: float = 0.0) -> float:
    try:
        parsed = float(value)
        return parsed if parsed == parsed else default
    except (TypeError, ValueError):
        return default


def generate_four_year_history(payload: dict) -> dict:
    client = payload.get("client") or {}
    misc_direct = payload.get("miscDirect") or {}
    misc_indirect = payload.get("miscIndirect") or {}
    pl_runs = payload.get("plRuns") or []
    bs_runs = payload.get("bsRuns") or []

    current_year = datetime.utcnow().year
    base_revenue = _num(client.get("currentAnnualRevenue") or client.get("current_annual_revenue"))
    cogs_pct = _num(client.get("cogsPercent") or client.get("cogs_percent")) / 100.0
    revenue_growth = _num(client.get("revenueGrowthPercent") or client.get("revenue_growth_percent")) / 100.0
    fixed_payroll = _num(client.get("fixedPayroll") or client.get("fixed_payroll"))
    fixed_rent = _num(client.get("fixedRentUtilities") or client.get("fixed_rent_utilities"))
    fixed_other = _num(client.get("fixedOther") or client.get("fixed_other"))
    direct_total = _num(misc_direct.get("annualTotal"))
    indirect_total = _num(misc_indirect.get("annualTotal"))

    pl_years: list[dict] = []
    for offset in range(4):
        year = current_year - 3 + offset
        growth_factor = (1 + revenue_growth) ** offset
        revenue = base_revenue * growth_factor
        cogs = revenue * cogs_pct + (direct_total * growth_factor if offset == 3 else direct_total * 0.9 ** (3 - offset))
        operating = fixed_payroll + fixed_rent + fixed_other + indirect_total
        pl_years.append(
            normalize_pl_year(
                {
                    "year": year,
                    "revenue": round(revenue, 2),
                    "cogs": round(cogs, 2),
                    "operatingExpenses": round(operating, 2),
                    "otherExpenses": 0.0,
                    "lineItems": [],
                }
            )
        )

    if pl_runs:
        latest = pl_runs[0].get("inputs", {}).get("years") or []
        if isinstance(latest, list) and len(latest) >= 4:
            pl_years = [normalize_pl_year(row) for row in latest[:4]]

    bs_years: list[dict] = []
    if bs_runs:
        latest_bs = bs_runs[0].get("inputs", {}).get("years") or []
        if isinstance(latest_bs, list) and len(latest_bs) >= 4:
            bs_years = latest_bs[:4]
    else:
        for offset, pl_row in enumerate(pl_years):
            revenue = pl_row["revenue"]
            cogs = pl_row["cogs"]
            year = pl_row["year"]
            bs_years.append(
                {
                    "year": year,
                    "cash": round(revenue * 0.05, 2),
                    "ar": round(revenue * 0.12, 2),
                    "inventory": round(cogs * 0.08, 2),
                    "otherCurrentAssets": 0.0,
                    "fixedAssets": round(revenue * 0.35, 2),
                    "otherAssets": 0.0,
                    "ap": round(cogs * 0.06, 2),
                    "otherCurrentLiabilities": round(revenue * 0.02, 2),
                    "longTermDebt": round(revenue * 0.2, 2),
                    "otherLiabilities": 0.0,
                    "equity": round(revenue * 0.4, 2),
                }
            )

    return {
        "plYears": pl_years,
        "bsYears": bs_years,
        "warnings": [
            "Generated draft history from client baseline and expense feeders. Review before saving.",
        ],
    }
