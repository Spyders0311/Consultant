from __future__ import annotations


def _num(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def calculate_financial_ratios(payload: dict) -> dict:
    pl = payload.get("plYear") or {}
    bs = payload.get("bsYear") or {}
    bs_computed = payload.get("bsComputed") or {}

    revenue = _num(pl.get("revenue"))
    cogs = _num(pl.get("cogs"))
    operating = _num(pl.get("operatingExpenses"))
    other = _num(pl.get("otherExpenses"))

    gross_profit = revenue - cogs
    operating_income = gross_profit - operating
    net_income = operating_income - other

    cash = _num(bs.get("cash"))
    ar = _num(bs.get("ar"))
    inventory = _num(bs.get("inventory"))
    other_current_assets = _num(bs.get("otherCurrentAssets"))
    ap = _num(bs.get("ap"))
    current_portion_ltd = _num(bs.get("currentPortionLtd"))
    other_current_liabilities = _num(bs.get("otherCurrentLiabilities"))
    long_term_debt = _num(bs.get("longTermDebt"))
    other_liabilities = _num(bs.get("otherLiabilities"))
    equity = _num(bs.get("equity"))
    intangible = _num(bs.get("intangibleAssets"))
    fixed_assets = _num(bs.get("fixedAssets"))
    other_assets = _num(bs.get("otherAssets"))

    total_current_assets = _num(bs_computed.get("totalCurrentAssets")) or (
        cash + ar + inventory + other_current_assets
    )
    total_current_liabilities = _num(bs_computed.get("totalCurrentLiabilities")) or (
        ap + current_portion_ltd + other_current_liabilities
    )
    total_assets = _num(bs_computed.get("totalAssets")) or (
        total_current_assets + fixed_assets + other_assets + intangible
    )
    total_liabilities = _num(bs_computed.get("totalLiabilities")) or (
        total_current_liabilities + long_term_debt + other_liabilities
    )

    ratios: dict[str, float | None] = {}
    warnings: list[str] = []

    if revenue > 0:
        ratios["grossProfitMarginPct"] = round((gross_profit / revenue) * 100, 2)
        ratios["netProfitMarginPct"] = round((net_income / revenue) * 100, 2)
        ratios["operatingMarginPct"] = round((operating_income / revenue) * 100, 2)
        ratios["avgCollectionPeriodDays"] = round((ar / revenue) * 365, 1)
    else:
        warnings.append("Revenue is zero; margin and collection period ratios are undefined.")
        ratios["grossProfitMarginPct"] = None
        ratios["netProfitMarginPct"] = None
        ratios["operatingMarginPct"] = None
        ratios["avgCollectionPeriodDays"] = None

    if total_current_liabilities > 0:
        ratios["currentRatio"] = round(total_current_assets / total_current_liabilities, 2)
    else:
        warnings.append("Current liabilities are zero; current ratio is undefined.")
        ratios["currentRatio"] = None

    if total_assets > 0:
        ratios["debtRatio"] = round(total_liabilities / total_assets, 2)
        ratios["equityRatio"] = round(equity / total_assets, 2)
    else:
        warnings.append("Total assets are zero; debt and equity ratios are undefined.")
        ratios["debtRatio"] = None
        ratios["equityRatio"] = None

    if equity > 0:
        ratios["debtToEquity"] = round(total_liabilities / equity, 2)
    else:
        ratios["debtToEquity"] = None

    if cogs > 0 and inventory > 0:
        ratios["inventoryTurnover"] = round(cogs / inventory, 2)
        ratios["inventoryTurnoverDays"] = round((inventory / cogs) * 365, 1)
    else:
        ratios["inventoryTurnover"] = None
        ratios["inventoryTurnoverDays"] = None

    if ar > 0 and revenue > 0:
        ratios["arTurnover"] = round(revenue / ar, 2)
    else:
        ratios["arTurnover"] = None

    working_capital = total_current_assets - total_current_liabilities
    ratios["workingCapital"] = round(working_capital, 2)

    return {
        "year": pl.get("year") or bs.get("year"),
        "plSummary": {
            "revenue": round(revenue, 2),
            "cogs": round(cogs, 2),
            "grossProfit": round(gross_profit, 2),
            "operatingIncome": round(operating_income, 2),
            "netIncome": round(net_income, 2),
        },
        "bsSummary": {
            "totalCurrentAssets": round(total_current_assets, 2),
            "totalCurrentLiabilities": round(total_current_liabilities, 2),
            "totalAssets": round(total_assets, 2),
            "totalLiabilities": round(total_liabilities, 2),
            "equity": round(equity, 2),
        },
        "ratios": ratios,
        "warnings": warnings,
    }
