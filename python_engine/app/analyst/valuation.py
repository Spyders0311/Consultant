from __future__ import annotations


def _num(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def calculate_business_valuation(payload: dict) -> dict:
    scenario = payload.get("scenario") or "current"
    ebitda = _num(payload.get("ebitda"))
    if ebitda == 0:
        revenue = _num(payload.get("annualRevenue"))
        margin = _num(payload.get("ebitdaMarginPct"), 15.0) / 100.0
        ebitda = revenue * margin

    multiple = _num(payload.get("ebitdaMultiple"), 4.0)
    asset_adjustment = _num(payload.get("assetAdjustment"))
    improvement_premium_pct = _num(payload.get("improvementPremiumPct"))

    if scenario == "fixed":
        multiple = _num(payload.get("ebitdaMultiple"), 3.5)
        asset_adjustment = _num(payload.get("assetAdjustment"), ebitda * 0.1)
    elif scenario == "improved":
        multiple = _num(payload.get("ebitdaMultiple"), 4.5)
        premium = improvement_premium_pct / 100.0 if improvement_premium_pct else 0.15
        ebitda = ebitda * (1 + premium)

    enterprise_value = ebitda * multiple + asset_adjustment
    equity_value = enterprise_value - _num(payload.get("totalDebt")) + _num(payload.get("cash"))

    return {
        "scenario": scenario,
        "ebitda": round(ebitda, 2),
        "ebitdaMultiple": round(multiple, 2),
        "assetAdjustment": round(asset_adjustment, 2),
        "enterpriseValue": round(enterprise_value, 2),
        "equityValue": round(equity_value, 2),
        "warnings": [],
    }
