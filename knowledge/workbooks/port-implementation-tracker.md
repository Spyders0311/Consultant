# Workbook Port Implementation Tracker

Last updated: 2026-06-09

Stable `portSlug` values route to `/workspace/[clientId]/analyst-wizard/sheets/<portSlug>` and the Python engine registry.

## Sprint status

| Sprint | Scope | Status |
|---|---|---|
| Sprint 1 | Infra registry + `f-1200-ar-turns` + `inventory-turn-calculation` | Done |
| Sprint 2 | `cost-vs-sales-increase` + `f-300a-overhead-calcs` + breakeven shared module | Done |

## Live ports

| portSlug | Source workbook | Sprint | Excel parity | Notes |
|---|---|---:|---:|---|
| `bms-marketing-forecast` | BMS Marketing Forecast.xlsx | pre-tracker | — | Baseline port |
| `dashboard-gantt-chart` | F-1600d Dashboard Gantt-Chart.xlsx | pre-tracker | — | Baseline port |
| `flex-budget-worksheet` | F-700a Flex Budget Worksheet.xlsx | pre-tracker | — | Baseline port |
| `sales-pipeline-forecast` | F-700e Sales Pipeline Forecast.xlsx | pre-tracker | — | Baseline port |
| `cash-flow-forecast-worksheet` | F-900a Cash Flow Forecast worksheet.xls | pre-tracker | — | Baseline port |
| `f-1200-ar-turns` | F-1200 AR Turns Worksheet.xls | 1 | golden tests | AR turns + collection period |
| `inventory-turn-calculation` | Inventory Turn calculation.xls | 1 | golden tests | Inventory turns + days held |
| `cost-vs-sales-increase` | Cost vs Sales Increase.xls/.xlsx | 2 | golden tests | Uses `breakeven_core.sales_increase_profit_impact` |
| `f-300a-overhead-calcs` | F-300a Overhead Calcs.xls | 2 | golden tests | Overhead factoring rates |

## Shared modules

| Module | Path | Used by |
|---|---|---|
| Port registry | `python_engine/app/workbook_ports/registry.py` | All workbook ports |
| Breakeven core | `python_engine/app/workbook_ports/breakeven_core.py` | `cost-vs-sales-increase`; future breakeven family ports |

## Ready to port (remaining)

| portSlug (planned) | Workbook | Phase | Formulas | Status |
|---|---|---:|---:|---|
| `f-500b-bid-calculation` | F-500b Bid Calculation Worksheet | 1 quick | 20 | not-started |
| `super-profit` | Super Profit | 1 quick | 8 | not-started |
| `bms-expense-report` | BMS Expense Report | 1 quick | 7 | not-started |
| `f-100b-breakeven-sample` | F-100b Breakeven Analysis sample | 2A | 55 | not-started |
| `f-100d-break-even-tool` | F-100d Break Even tool | 2A | 239 | not-started |
| `breakeven-tool-advanced` | F-100a/c BE Tool Good | 2A | 136 | not-started |
| `job-estimating-master` | Job Estimating MASTER | 2B | 63 | not-started |
| `f-500a-example-bid-worksheet` | F-500a Example Bid Worksheet | 2B | 160 | not-started |
| `f-500c-job-costing-template` | F-500c Job Costing Template | 2B | 88 | not-started |
| `f-200b-fully-burdened-labor` | F-200b Fully Burdened Labor | 2C | 43 | not-started |
| `f-200a-labor-burden` | F-200a Labor Burden | 2C/3 | 380 | not-started |
| `f-700b-budget-planning` | F-700b Budget Planning Worksheet | 2E | 5 | not-started |
| `employee-productivity` | Employee Productivity | 2E | 35 | not-started |
| `f-1000-pl` | F-1000 profit and loss statement | 3 | 358 | not-started |
| `f-700c-annual-budget` | F-700c Annual Budget template | 3 | 910 | not-started |
| `4-year-comp-pl-optimal` | 4 Year Comp P&L Optimal | 3 | 349 | not-started |
| `bms-balance-sheet` | BMS Balance Sheet | 3 | 64 | not-started |
| `f-1600b-kpi-report` | F-1600b Example KPI Report | 3 | 255 | not-started |
| `6-wk-cash-flow-wa` | 6 Wk Cash Flow WA | 2D | 87 | not-started |
| `bms-cash-flow-spreadsheet` | BMS Cash Flow Spreadsheet | 2D | 59 | not-started |
| `bms-breakeven-tool` | BMS Breakeven Analysis Tool Office | 2A/3 | 70 | not-started |
| `cbs-breakeven-analysis-tool` | CBS Breakeven Analysis Tool | 2A | 70 | merge candidate |
| `f-1600b-kpi-report` | F-1600b KPI Report | 3 | 255 | not-started |

## Blocked / reference

| Workbook | Status | Notes |
|---|---|---|
| 4 Year Comp P&L.xls | blocked | Password-protected |
| budgetseasonal, F-1600e Gantt, Process & Communications, Tasks & Duties | reference | Do not port |

## Per-port checklist

- [ ] Manifest in `knowledge/workbooks/ports/<slug>.json`
- [ ] Calculator in `python_engine/app/workbook_ports/ports/`
- [ ] Registry entry in `python_engine/app/workbook_ports/registry.py`
- [ ] Wizard config in `lib/workbookPortConfigs.js`
- [ ] Route in `lib/workbookPortKeys.js` + `page.js`
- [ ] `implementedWorkbookRoutes` in `scripts/generate-canonical-sources.cjs`
- [ ] Golden tests in `python_engine/tests/test_workbook_ports.py`
- [ ] `npm run catalog`
