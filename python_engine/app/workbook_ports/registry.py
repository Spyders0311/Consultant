from __future__ import annotations

from collections.abc import Callable

from .advanced_ports import (
    calculate_f200a_labor_burden,
    calculate_f200b_fully_burdened_labor,
    calculate_f500a_example_bid_worksheet,
    calculate_f500c_job_costing_template,
    calculate_f700c_annual_budget,
    calculate_job_estimating_master,
)
from .calculators import (
    calculate_ar_turns,
    calculate_bms_expense_report,
    calculate_breakeven_tool_advanced,
    calculate_cost_vs_sales_increase,
    calculate_f1000_pl,
    calculate_f100b_breakeven_sample,
    calculate_f100d_break_even_tool,
    calculate_f500b_bid_calculation,
    calculate_inventory_turn,
    calculate_overhead_calcs,
    calculate_super_profit,
)
from .legacy_ports import (
    calculate_bms_marketing_forecast,
    calculate_cash_flow_forecast_worksheet,
    calculate_dashboard_gantt_chart,
    calculate_flex_budget_worksheet,
    calculate_sales_pipeline_forecast,
)

WorkbookPortCalculator = Callable[[dict], dict]

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
    "f-500b-bid-calculation": calculate_f500b_bid_calculation,
    "super-profit": calculate_super_profit,
    "bms-expense-report": calculate_bms_expense_report,
    "f-100b-breakeven-sample": calculate_f100b_breakeven_sample,
    "f-100d-break-even-tool": calculate_f100d_break_even_tool,
    "breakeven-tool-advanced": calculate_breakeven_tool_advanced,
    "f-1000-pl": calculate_f1000_pl,
    "f-200b-fully-burdened-labor": calculate_f200b_fully_burdened_labor,
    "f-200a-labor-burden": calculate_f200a_labor_burden,
    "f-700c-annual-budget": calculate_f700c_annual_budget,
    "job-estimating-master": calculate_job_estimating_master,
    "f-500a-example-bid-worksheet": calculate_f500a_example_bid_worksheet,
    "f-500c-job-costing-template": calculate_f500c_job_costing_template,
}


def calculate_workbook_port(workbook_key: str, inputs: dict) -> dict:
    calculator = WORKBOOK_PORT_CALCULATORS.get(workbook_key)
    if calculator is None:
        raise KeyError(workbook_key)
    return calculator(inputs)


def supported_workbook_port_keys() -> list[str]:
    return sorted(WORKBOOK_PORT_CALCULATORS.keys())
