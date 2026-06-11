from __future__ import annotations

from collections.abc import Callable

from .legacy_ports import (
    calculate_bms_marketing_forecast,
    calculate_cash_flow_forecast_worksheet,
    calculate_dashboard_gantt_chart,
    calculate_flex_budget_worksheet,
    calculate_sales_pipeline_forecast,
)
from .ports.ar_turns import calculate_ar_turns
from .ports.cost_vs_sales import calculate_cost_vs_sales_increase
from .ports.inventory_turn import calculate_inventory_turn
from .ports.overhead_calcs import calculate_overhead_calcs

WorkbookPortCalculator = Callable[[dict[str, object]], dict]

WORKBOOK_PORT_CALCULATORS: dict[str, WorkbookPortCalculator] = {
    "bms-marketing-forecast": calculate_bms_marketing_forecast,
    "dashboard-gantt-chart": calculate_dashboard_gantt_chart,
    "flex-budget-worksheet": calculate_flex_budget_worksheet,
    "sales-pipeline-forecast": calculate_sales_pipeline_forecast,
    "cash-flow-forecast-worksheet": calculate_cash_flow_forecast_worksheet,
    "f-1200-ar-turns": calculate_ar_turns,
    "inventory-turn-calculation": calculate_inventory_turn,
    "cost-vs-sales-increase": calculate_cost_vs_sales_increase,
    "f-300a-overhead-calcs": calculate_overhead_calcs,
}


def calculate_workbook_port(workbook_key: str, inputs: dict[str, object]) -> dict:
    calculator = WORKBOOK_PORT_CALCULATORS.get(workbook_key)
    if calculator is None:
        raise KeyError(f"Unsupported workbook port: {workbook_key}")
    return calculator(inputs)


def supported_workbook_port_keys() -> list[str]:
    return sorted(WORKBOOK_PORT_CALCULATORS.keys())
