import unittest

from app.workbook_ports import calculate_workbook_port, supported_workbook_port_keys
from app.workbook_ports.breakeven_core import contribution_margin_summary, sales_increase_profit_impact


class WorkbookPortRegistryTests(unittest.TestCase):
    def test_registry_includes_sprint_ports(self) -> None:
        keys = supported_workbook_port_keys()
        for key in (
            "f-1200-ar-turns",
            "inventory-turn-calculation",
            "cost-vs-sales-increase",
            "f-300a-overhead-calcs",
            "f-500b-bid-calculation",
            "super-profit",
            "bms-expense-report",
            "f-100b-breakeven-sample",
            "f-1000-pl",
            "f-200b-fully-burdened-labor",
            "f-200a-labor-burden",
            "f-700c-annual-budget",
            "job-estimating-master",
            "f-500a-example-bid-worksheet",
            "f-500c-job-costing-template",
        ):
            self.assertIn(key, keys)

    def test_unknown_workbook_raises(self) -> None:
        with self.assertRaises(KeyError):
            calculate_workbook_port("missing-port", {})


class ArTurnsPortTests(unittest.TestCase):
    def test_ar_turns_primary_calculation(self) -> None:
        result = calculate_workbook_port(
            "f-1200-ar-turns",
            {
                "annualCreditSales": 1_200_000,
                "beginningArBalance": 180_000,
                "endingArBalance": 220_000,
                "daysPerYear": 365,
            },
        )
        summary = result["summary"]
        self.assertEqual(summary["averageArBalance"], 200_000.0)
        self.assertEqual(summary["arTurns"], 6.0)
        self.assertEqual(summary["avgCollectionPeriodDays"], 60.8)


class InventoryTurnPortTests(unittest.TestCase):
    def test_inventory_turn_primary_calculation(self) -> None:
        result = calculate_workbook_port(
            "inventory-turn-calculation",
            {
                "costOfSales": 850_000,
                "beginningInventory": 95_000,
                "endingInventory": 105_000,
                "daysPerYear": 365,
            },
        )
        summary = result["summary"]
        self.assertEqual(summary["averageInventory"], 100_000.0)
        self.assertEqual(summary["inventoryTurnsPerYear"], 8.5)
        self.assertEqual(summary["averageDaysHeld"], 42.9)


class CostVsSalesPortTests(unittest.TestCase):
    def test_cost_vs_sales_increase(self) -> None:
        result = calculate_workbook_port(
            "cost-vs-sales-increase",
            {
                "currentSales": 1_000_000,
                "salesIncreasePercent": 10,
                "variableCostPercent": 65,
                "fixedExpenses": 250_000,
            },
        )
        summary = result["summary"]
        self.assertEqual(summary["newSales"], 1_100_000.0)
        self.assertEqual(summary["currentProfit"], 100_000.0)
        self.assertEqual(summary["newProfit"], 135_000.0)
        self.assertEqual(summary["profitChange"], 35_000.0)


class OverheadCalcsPortTests(unittest.TestCase):
    def test_overhead_factoring(self) -> None:
        result = calculate_workbook_port(
            "f-300a-overhead-calcs",
            {
                "totalRevenue": 2_500_000,
                "totalOverhead": 450_000,
                "totalMaterialCosts": 700_000,
                "totalDirectLaborCosts": 550_000,
            },
        )
        summary = result["summary"]
        self.assertEqual(summary["directCosts"], 1_250_000.0)
        self.assertEqual(summary["overheadFactorOnDirect"], 0.36)
        self.assertEqual(summary["grossProfit"], 800_000.0)


class BidCalculationPortTests(unittest.TestCase):
    def test_bid_calculation_total(self) -> None:
        result = calculate_workbook_port(
            "f-500b-bid-calculation",
            {
                "bidLines": [
                    {
                        "description": "Line A",
                        "laborHours": 10,
                        "laborRate": 50,
                        "materialCost": 200,
                        "markupPct": 20,
                    },
                    {
                        "description": "Line B",
                        "laborHours": 5,
                        "laborRate": 60,
                        "materialCost": 100,
                        "markupPct": 15,
                    },
                ]
            },
        )
        self.assertEqual(result["summary"]["bidTotal"], 1_300.0)
        self.assertEqual(len(result["rows"]), 2)


class SuperProfitPortTests(unittest.TestCase):
    def test_super_profit_required_sales(self) -> None:
        result = calculate_workbook_port(
            "super-profit",
            {
                "currentSales": 1_000_000,
                "currentProfit": 100_000,
                "targetProfitIncrease": 50_000,
                "variableCostPct": 65,
                "fixedExpenses": 250_000,
            },
        )
        self.assertEqual(result["summary"]["requiredSales"], 1_142_857.14)
        self.assertEqual(result["summary"]["targetProfit"], 150_000.0)


class ExpenseReportPortTests(unittest.TestCase):
    def test_expense_report_totals(self) -> None:
        result = calculate_workbook_port(
            "bms-expense-report",
            {
                "expenses": [
                    {
                        "date": "2026-01-15",
                        "category": "Travel",
                        "description": "Client visit",
                        "amount": 500,
                    },
                    {
                        "date": "2026-02-01",
                        "category": "Office",
                        "description": "Supplies",
                        "amount": 250,
                    },
                ]
            },
        )
        self.assertEqual(result["summary"]["totalExpenses"], 750.0)
        self.assertEqual(result["summary"]["expenseCount"], 2)
        self.assertEqual(result["summary"]["categoryTotals"]["Travel"], 500.0)


class BreakevenSamplePortTests(unittest.TestCase):
    def test_f100b_breakeven_sample(self) -> None:
        result = calculate_workbook_port(
            "f-100b-breakeven-sample",
            {
                "annualRevenue": 1_000_000,
                "cogs": 400_000,
                "labor": 200_000,
                "fixedExpenses": 250_000,
                "profit": 150_000,
            },
        )
        summary = result["summary"]
        self.assertEqual(summary["breakevenRevenue"], 625_000.0)
        self.assertEqual(summary["breakevenPercent"], 62.5)
        self.assertEqual(summary["breakevenDays"], 228.1)


class F1000PlPortTests(unittest.TestCase):
    def test_f1000_pl_totals(self) -> None:
        result = calculate_workbook_port(
            "f-1000-pl",
            {
                "plLines": [
                    {"category": "revenue", "description": "Product sales", "amount": 1_000_000},
                    {"category": "cogs", "description": "Materials", "amount": 400_000},
                    {"category": "opex", "description": "Salaries", "amount": 300_000},
                ]
            },
        )
        summary = result["summary"]
        self.assertEqual(summary["totalRevenue"], 1_000_000.0)
        self.assertEqual(summary["grossProfit"], 600_000.0)
        self.assertEqual(summary["operatingIncome"], 300_000.0)
        self.assertEqual(summary["netMarginPct"], 30.0)


class BreakevenCoreTests(unittest.TestCase):
    def test_contribution_margin_summary(self) -> None:
        result = contribution_margin_summary(1_000_000, 650_000, 250_000, business_days=365)
        self.assertEqual(result["contributionMargin"], 350_000.0)
        self.assertEqual(result["breakevenSales"], 714_285.71)

    def test_sales_increase_profit_impact(self) -> None:
        result = sales_increase_profit_impact(1_000_000, 10, 65, 250_000)
        self.assertEqual(result["newProfit"], 135_000.0)


class LaborBurdenPortTests(unittest.TestCase):
    def test_f200b_fully_burdened_labor(self) -> None:
        result = calculate_workbook_port(
            "f-200b-fully-burdened-labor",
            {
                "employeeName": "Tech 1",
                "annualSalary": 52_000,
                "hoursPerYear": 2080,
                "ficaPct": 7.65,
                "unemploymentPct": 1,
                "workersCompPct": 3,
                "healthInsuranceAnnual": 6000,
                "retirementPct": 3,
                "otherBenefitsAnnual": 1200,
            },
        )
        self.assertEqual(result["summary"]["fullyBurdenedAnnual"], 66_818.0)
        self.assertEqual(result["summary"]["fullyBurdenedHourly"], 32.12)

    def test_f200a_labor_burden_multi_employee(self) -> None:
        result = calculate_workbook_port(
            "f-200a-labor-burden",
            {
                "employees": [
                    {
                        "employeeName": "Tech 1",
                        "annualSalary": 52_000,
                        "hoursPerYear": 2080,
                        "ficaPct": 7.65,
                        "unemploymentPct": 1,
                        "workersCompPct": 3,
                        "healthInsuranceAnnual": 6000,
                        "retirementPct": 3,
                        "otherBenefitsAnnual": 1200,
                    }
                ]
            },
        )
        self.assertEqual(result["summary"]["employeeCount"], 1)
        self.assertEqual(result["summary"]["totalFullyBurdenedAnnual"], 66_818.0)


class AnnualBudgetPortTests(unittest.TestCase):
    def test_f700c_annual_budget(self) -> None:
        result = calculate_workbook_port(
            "f-700c-annual-budget",
            {
                "incomeTaxRatePercent": 25,
                "budgetLines": [
                    {"lineItem": "Sales", "category": "revenue", "annualAmount": 1_200_000},
                    {"lineItem": "COGS", "category": "variable-cost", "annualAmount": 600_000},
                    {"lineItem": "Overhead", "category": "fixed-cost", "annualAmount": 400_000},
                ],
            },
        )
        self.assertEqual(result["summary"]["operatingIncome"], 200_000.0)
        self.assertEqual(result["summary"]["netIncome"], 150_000.0)
        self.assertEqual(len(result["rows"]), 12)


class JobEstimatingPortTests(unittest.TestCase):
    def test_job_estimating_master(self) -> None:
        result = calculate_workbook_port(
            "job-estimating-master",
            {
                "jobOverheadPct": 15,
                "profitPct": 10,
                "estimateLines": [
                    {"description": "Labor", "costType": "labor", "quantity": 10, "unitCost": 50},
                    {"description": "Materials", "costType": "material", "quantity": 1, "unitCost": 200},
                ],
            },
        )
        self.assertEqual(result["summary"]["directTotal"], 700.0)
        self.assertEqual(result["summary"]["bidTotal"], 885.5)


class F500SuitePortTests(unittest.TestCase):
    def test_f500a_example_bid_worksheet(self) -> None:
        result = calculate_workbook_port(
            "f-500a-example-bid-worksheet",
            {
                "defaultOverheadPct": 12,
                "defaultProfitPct": 8,
                "bidLines": [
                    {
                        "description": "Phase 1",
                        "laborHours": 10,
                        "laborRate": 50,
                        "materialCost": 200,
                        "equipmentCost": 50,
                        "subcontractCost": 100,
                    }
                ],
            },
        )
        self.assertEqual(result["summary"]["bidTotal"], 1_028.16)

    def test_f500c_job_costing_template(self) -> None:
        result = calculate_workbook_port(
            "f-500c-job-costing-template",
            {
                "costLines": [
                    {
                        "description": "Labor",
                        "category": "Labor",
                        "estimatedCost": 1000,
                        "actualCost": 1100,
                    }
                ]
            },
        )
        self.assertEqual(result["summary"]["totalVariance"], 100.0)
        self.assertEqual(result["rows"][0]["status"], "Over")

    def test_four_year_comp_pl_optimal(self) -> None:
        result = calculate_workbook_port(
            "4-year-comp-pl-optimal",
            {
                "years": [
                    {"year": 2023, "revenue": 900_000, "cogs": 500_000, "operatingExpenses": 200_000},
                    {"year": 2024, "revenue": 1_000_000, "cogs": 600_000, "operatingExpenses": 250_000},
                ]
            },
        )
        self.assertEqual(result["summary"]["yearCount"], 2)

    def test_employee_productivity(self) -> None:
        result = calculate_workbook_port(
            "employee-productivity",
            {"annualRevenue": 1_000_000, "employeeCount": 10, "hoursPerEmployee": 2080},
        )
        self.assertEqual(result["summary"]["revenuePerEmployee"], 100_000.0)


if __name__ == "__main__":
    unittest.main()
