from __future__ import annotations


def _num(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def calculate_roi_analysis(payload: dict) -> dict:
    roi_type = payload.get("roiType") or "labor"
    annual_revenue = _num(payload.get("annualRevenue"))
    category_total = _num(payload.get("categoryTotal"))
    gross_profit = _num(payload.get("grossProfit"))
    if gross_profit == 0:
        gross_profit = annual_revenue - _num(payload.get("annualCogs"))

    warnings: list[str] = []
    roi_pct = None
    share_of_revenue_pct = None
    share_of_gross_pct = None

    if annual_revenue > 0:
        share_of_revenue_pct = round((category_total / annual_revenue) * 100, 2)
    else:
        warnings.append("Annual revenue is zero; share metrics undefined.")

    if gross_profit > 0:
        share_of_gross_pct = round((category_total / gross_profit) * 100, 2)
        roi_pct = round(((gross_profit - category_total) / category_total) * 100, 2) if category_total > 0 else None
    elif category_total > 0:
        warnings.append("Gross profit is zero; ROI percent undefined.")

    labels = {
        "labor": "Direct Labor",
        "cogs": "Cost of Goods Sold",
        "material": "Materials",
        "subcontract": "Subcontractors",
        "misc-direct": "Misc Direct Expenses",
    }

    return {
        "roiType": roi_type,
        "label": labels.get(roi_type, roi_type),
        "annualRevenue": round(annual_revenue, 2),
        "categoryTotal": round(category_total, 2),
        "grossProfit": round(gross_profit, 2),
        "shareOfRevenuePct": share_of_revenue_pct,
        "shareOfGrossProfitPct": share_of_gross_pct,
        "roiPct": roi_pct,
        "warnings": warnings,
    }
