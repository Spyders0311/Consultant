from __future__ import annotations


def _num(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _pl_net_income(pl: dict) -> tuple[float, float, float, float]:
    revenue = _num(pl.get("revenue"))
    cogs = _num(pl.get("cogs"))
    operating = _num(pl.get("operatingExpenses"))
    other = _num(pl.get("otherExpenses"))
    interest = _num(pl.get("interestExpense"))
    gross_profit = revenue - cogs
    operating_income = gross_profit - operating
    ebit = operating_income
    net_income = operating_income - other - interest
    return revenue, gross_profit, operating_income, net_income


def calculate_financial_ratios(payload: dict) -> dict:
    pl = payload.get("plYear") or {}
    bs = payload.get("bsYear") or {}
    bs_computed = payload.get("bsComputed") or {}

    revenue, gross_profit, operating_income, net_income = _pl_net_income(pl)
    cogs = _num(pl.get("cogs"))
    interest_expense = _num(pl.get("interestExpense"))

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
        quick_assets = cash + ar
        ratios["quickRatio"] = round(quick_assets / total_current_liabilities, 2)
    else:
        warnings.append("Current liabilities are zero; liquidity ratios are undefined.")
        ratios["currentRatio"] = None
        ratios["quickRatio"] = None

    if total_assets > 0:
        ratios["debtRatio"] = round(total_liabilities / total_assets, 2)
        ratios["equityRatio"] = round(equity / total_assets, 2)
        ratios["returnOnAssetsPct"] = round((net_income / total_assets) * 100, 2)
    else:
        warnings.append("Total assets are zero; debt, equity, and ROA ratios are undefined.")
        ratios["debtRatio"] = None
        ratios["equityRatio"] = None
        ratios["returnOnAssetsPct"] = None

    if equity > 0:
        ratios["debtToEquity"] = round(total_liabilities / equity, 2)
        ratios["returnOnEquityPct"] = round((net_income / equity) * 100, 2)
    else:
        ratios["debtToEquity"] = None
        ratios["returnOnEquityPct"] = None

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

    if interest_expense > 0:
        ratios["timesInterestEarned"] = round(operating_income / interest_expense, 2)
    else:
        ratios["timesInterestEarned"] = None
        if operating_income != 0:
            warnings.append("Interest expense not provided; times interest earned is undefined.")

    # Altman Z-Score (private company variants)
    working_capital = total_current_assets - total_current_liabilities
    retained_earnings = _num(bs.get("retainedEarnings"))
    if retained_earnings == 0:
        retained_earnings = equity * 0.6

    if total_assets > 0:
        x1 = working_capital / total_assets
        x2 = retained_earnings / total_assets
        x3 = operating_income / total_assets
        x4 = equity / total_liabilities if total_liabilities > 0 else 0.0
        x5 = revenue / total_assets
        z_light = 0.717 * x1 + 0.847 * x2 + 3.107 * x3 + 0.420 * x4 + 0.998 * x5
        z_heavy = 0.717 * x1 + 0.847 * x2 + 3.107 * x3 + 0.420 * x4 + 0.998 * x5 + 0.1 * (fixed_assets / total_assets)
        ratios["zScorePrivateLightAssets"] = round(z_light, 2)
        ratios["zScorePrivateHeavyAssets"] = round(z_heavy, 2)
        ratios["zScoreZone"] = (
            "distress" if z_light < 1.23 else "grey" if z_light < 2.9 else "safe"
        )
    else:
        ratios["zScorePrivateLightAssets"] = None
        ratios["zScorePrivateHeavyAssets"] = None
        ratios["zScoreZone"] = None

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
