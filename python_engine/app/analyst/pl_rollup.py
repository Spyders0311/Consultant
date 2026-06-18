from __future__ import annotations

COGS_CATEGORIES = {"cogs", "cogs_labor", "cogs_material", "cogs_subcontract"}
OPEX_CATEGORIES = {"opex", "opex_payroll", "opex_rent", "opex_utilities"}
LABOR_CATEGORIES = {"cogs_labor", "opex_payroll", "labor"}
INDIRECT_CATEGORIES = {"indirect", "opex"}
GA_CATEGORIES = {"general_administrative", "ga"}


def rollup_line_items(line_items: list[dict] | None) -> dict:
    if not line_items:
        return {
            "revenue": 0.0,
            "cogs": 0.0,
            "operatingExpenses": 0.0,
            "otherExpenses": 0.0,
            "laborAmount": 0.0,
            "indirectCostsAmount": 0.0,
            "generalAdministrativeCostsAmount": 0.0,
        }

    totals = {
        "revenue": 0.0,
        "cogs": 0.0,
        "operatingExpenses": 0.0,
        "otherExpenses": 0.0,
        "laborAmount": 0.0,
        "indirectCostsAmount": 0.0,
        "generalAdministrativeCostsAmount": 0.0,
    }

    for item in line_items:
        category = str(item.get("category") or "").lower()
        amount = float(item.get("amount") or 0)
        if category == "revenue":
            totals["revenue"] += amount
        elif category in COGS_CATEGORIES or category == "cogs":
            totals["cogs"] += amount
            if category in LABOR_CATEGORIES or category == "cogs_labor":
                totals["laborAmount"] += amount
        elif category in OPEX_CATEGORIES or category == "opex":
            totals["operatingExpenses"] += amount
            if category in LABOR_CATEGORIES or category == "opex_payroll":
                totals["laborAmount"] += amount
        elif category in INDIRECT_CATEGORIES or category == "indirect":
            totals["indirectCostsAmount"] += amount
            totals["operatingExpenses"] += amount
        elif category in GA_CATEGORIES:
            totals["generalAdministrativeCostsAmount"] += amount
            totals["operatingExpenses"] += amount
        elif category == "other":
            totals["otherExpenses"] += amount
        else:
            totals["otherExpenses"] += amount

    return totals


def normalize_pl_year(row: dict) -> dict:
    line_items = row.get("lineItems")
    rolled = rollup_line_items(line_items if isinstance(line_items, list) else None)

    revenue = float(row.get("revenue") if row.get("revenue") is not None else rolled["revenue"])
    cogs = float(row.get("cogs") if row.get("cogs") is not None else rolled["cogs"])
    operating = float(
        row.get("operatingExpenses") if row.get("operatingExpenses") is not None else rolled["operatingExpenses"]
    )
    other = float(row.get("otherExpenses") if row.get("otherExpenses") is not None else rolled["otherExpenses"])

    return {
        "year": int(row["year"]),
        "revenue": revenue,
        "cogs": cogs,
        "operatingExpenses": operating,
        "otherExpenses": other,
        "lineItems": line_items or [],
        "laborAmount": rolled["laborAmount"],
        "indirectCostsAmount": rolled["indirectCostsAmount"],
        "generalAdministrativeCostsAmount": rolled["generalAdministrativeCostsAmount"],
    }
