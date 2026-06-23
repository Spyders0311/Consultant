from __future__ import annotations


def _num(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _year_row(row: dict) -> dict:
    revenue = _num(row.get("revenue"))
    cogs = _num(row.get("cogs"))
    opex = _num(row.get("operatingExpenses"))
    other = _num(row.get("otherExpenses"))
    gross = revenue - cogs
    net = gross - opex - other
    return {
        "year": row.get("year"),
        "revenue": round(revenue, 2),
        "cogs": round(cogs, 2),
        "grossProfit": round(gross, 2),
        "operatingExpenses": round(opex, 2),
        "otherExpenses": round(other, 2),
        "netIncome": round(net, 2),
        "grossMarginPct": round((gross / revenue) * 100, 2) if revenue else None,
        "netMarginPct": round((net / revenue) * 100, 2) if revenue else None,
    }


def calculate_pl_analysis(payload: dict) -> dict:
    analysis_type = payload.get("analysisType") or "min-max"
    years_in = payload.get("years") or []
    years = [_year_row(row) for row in years_in if row.get("year")]

    if not years:
        return {"analysisType": analysis_type, "years": [], "warnings": ["No P&L years provided."]}

    warnings: list[str] = []
    result: dict = {"analysisType": analysis_type, "years": years, "warnings": warnings}

    if analysis_type == "min-max":
        metrics = ["revenue", "cogs", "grossProfit", "operatingExpenses", "netIncome"]
        summary = {}
        for metric in metrics:
            values = [_num(y.get(metric)) for y in years]
            summary[metric] = {
                "min": round(min(values), 2),
                "max": round(max(values), 2),
                "spread": round(max(values) - min(values), 2),
                "avg": round(sum(values) / len(values), 2),
            }
        result["summary"] = summary
        return result

    if analysis_type in {"yr1-vs-yr2", "yr3-vs-yr4"}:
        idx = 0 if analysis_type == "yr1-vs-yr2" else 2
        if len(years) <= idx + 1:
            warnings.append("Need at least two comparable years in P&L run.")
            result["comparison"] = None
            return result
        a, b = years[idx], years[idx + 1]
        comparison = {}
        for key in ("revenue", "cogs", "grossProfit", "operatingExpenses", "netIncome"):
            base = _num(a.get(key))
            next_val = _num(b.get(key))
            delta = next_val - base
            pct = round((delta / base) * 100, 2) if base else None
            comparison[key] = {"from": base, "to": next_val, "delta": round(delta, 2), "pctChange": pct}
        result["comparison"] = {"fromYear": a.get("year"), "toYear": b.get("year"), "metrics": comparison}
        return result

    if analysis_type == "four-year-pie":
        slices = []
        total_revenue = sum(_num(y.get("revenue")) for y in years[:4])
        for y in years[:4]:
            rev = _num(y.get("revenue"))
            slices.append(
                {
                    "year": y.get("year"),
                    "revenue": rev,
                    "sharePct": round((rev / total_revenue) * 100, 2) if total_revenue else 0,
                    "grossMarginPct": y.get("grossMarginPct"),
                }
            )
        result["pieSlices"] = slices
        result["totalRevenue"] = round(total_revenue, 2)
        return result

    warnings.append(f"Unknown analysis type: {analysis_type}")
    return result
