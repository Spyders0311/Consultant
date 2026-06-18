# Workbook Port Implementation Tracker

Last updated: 2026-06-10

## Sprint status

| Sprint | Scope | Status |
|---|---|---|
| Sprint 1–4 + breakeven | Prior ports | Done |
| Labor & budget | `f-200a`, `f-200b`, `f-700c` | Done |
| Job costing suite | `job-estimating-master`, `f-500a`, `f-500c` | Done |

## Live ports (22)

| portSlug | Source workbook |
|---|---|
| `bms-marketing-forecast` | BMS Marketing Forecast.xlsx |
| `dashboard-gantt-chart` | F-1600d Dashboard Gantt-Chart.xlsx |
| `flex-budget-worksheet` | F-700a Flex Budget Worksheet.xlsx |
| `sales-pipeline-forecast` | F-700e Sales Pipeline Forecast.xlsx |
| `cash-flow-forecast-worksheet` | F-900a Cash Flow Forecast worksheet.xls |
| `f-1200-ar-turns` | F-1200 AR Turns Worksheet.xls |
| `inventory-turn-calculation` | Inventory Turn calculation.xls |
| `cost-vs-sales-increase` | Cost vs Sales Increase.xls |
| `f-300a-overhead-calcs` | F-300a Overhead Calcs.xls |
| `f-500b-bid-calculation` | F-500b Bid Calculation Worksheet.xlsx |
| `super-profit` | Super Profit.xls |
| `bms-expense-report` | BMS Expense Report.xls |
| `f-100b-breakeven-sample` | F-100b Breakeven Analysis sample.xls |
| `f-100d-break-even-tool` | F-100d Break Even tool.xls |
| `breakeven-tool-advanced` | F-100a/c BE Tool Good.xlsx |
| `f-1000-pl` | F-1000 profit-and-loss-statement.xlsx |
| `f-200b-fully-burdened-labor` | F-200b Fully Burdened Labor Calcular.xlsx |
| `f-200a-labor-burden` | F-200a Labor Burden.XLS |
| `f-700c-annual-budget` | F-700c Annual Budget worksheet template.xlsx |
| `job-estimating-master` | Job Estimating MASTER.xls |
| `f-500a-example-bid-worksheet` | F-500a Example Bid Worksheet.xlsx |
| `f-500c-job-costing-template` | F-500c Job Costing Template.xlsx |

## Shared modules

| Module | Path | Used by |
|---|---|---|
| Job costing core | `python_engine/app/workbook_ports/job_costing_core.py` | F-500 suite, job estimating |
| Advanced ports | `python_engine/app/workbook_ports/advanced_ports.py` | Labor, budget, estimating |

## Next candidates

| portSlug | Workbook |
|---|---|
| `4-year-comp-pl-optimal` | 4 Year Comp P&L Optimal |
| `f-700b-budget-planning` | F-700b Budget Planning Worksheet |
| `employee-productivity` | Employee Productivity |
| `6-wk-cash-flow-wa` | 6 Wk Cash Flow WA |

## Per-port checklist

- [x] Calculator in `workbook_ports/`
- [x] Registry entry
- [x] `WORKBOOK_PORT_CONFIGS` entry
- [x] Route in `page.js` via `WORKBOOK_PORT_KEYS`
- [x] Golden tests (core ports)
- [ ] `canonical_sources.json` live flags (run `npm run catalog` when audit JSON is present)
