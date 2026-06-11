from __future__ import annotations

from ..helpers import num, pct, round_money, safe_ratio


def calculate_inventory_turn(inputs: dict[str, object]) -> dict:
    days_per_year = num(inputs.get("daysPerYear")) or 365.0
    cost_of_sales = num(inputs.get("costOfSales"))
    beginning_inventory = num(inputs.get("beginningInventory"))
    ending_inventory = num(inputs.get("endingInventory"))
    average_inventory = num(inputs.get("averageInventory"))

    if average_inventory <= 0 and (beginning_inventory > 0 or ending_inventory > 0):
        average_inventory = (beginning_inventory + ending_inventory) / 2.0

    inventory_turns = safe_ratio(cost_of_sales, average_inventory)
    average_days_held = (days_per_year / inventory_turns) if inventory_turns else None

    rows: list[dict] = [
        {
            "scenario": "Primary calculation",
            "costOfSales": round_money(cost_of_sales),
            "averageInventory": round_money(average_inventory),
            "inventoryTurnsPerYear": round(inventory_turns, 2) if inventory_turns is not None else None,
            "averageDaysHeld": round(average_days_held, 1) if average_days_held is not None else None,
        }
    ]

    if cost_of_sales > 0:
        rows.append(
            {
                "scenario": "Example: 8.0 inventory turns",
                "costOfSales": round_money(cost_of_sales),
                "averageInventory": round_money(cost_of_sales / 8.0),
                "inventoryTurnsPerYear": 8.0,
                "averageDaysHeld": round(days_per_year / 8.0, 1),
            }
        )

    warnings: list[str] = []
    if cost_of_sales <= 0:
        warnings.append("Cost of sales is zero; inventory turn metrics may be unavailable.")
    if average_inventory <= 0:
        warnings.append("Average inventory is zero; inventory turn metrics may be unavailable.")

    return {
        "summary": {
            "costOfSales": round_money(cost_of_sales),
            "averageInventory": round_money(average_inventory),
            "inventoryTurnsPerYear": round(inventory_turns, 2) if inventory_turns is not None else None,
            "averageDaysHeld": round(average_days_held, 1) if average_days_held is not None else None,
            "daysPerYear": days_per_year,
            "inventoryPctOfCogs": pct(average_inventory, cost_of_sales),
        },
        "rows": rows,
        "warnings": warnings,
    }
