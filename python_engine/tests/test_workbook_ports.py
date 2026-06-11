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
                "annualCreditSales": 1200000,
                "beginningArBalance": 180000,
                "endingArBalance": 220000,
                "daysPerYear": 365,
            },
        )
        self.assertEqual(result["summary"]["averageArBalance"], 200000.0)
        self.assertEqual(result["summary"]["arTurns"], 6.0)
        self.assertEqual(result["summary"]["avgCollectionPeriodDays"], 60.8)


class InventoryTurnPortTests(unittest.TestCase):
    def test_inventory_turn_primary_calculation(self) -> None:
        result = calculate_workbook_port(
            "inventory-turn-calculation",
            {
                "costOfSales": 850000,
                "beginningInventory": 95000,
                "endingInventory": 105000,
                "daysPerYear": 365,
            },
        )
        self.assertEqual(result["summary"]["averageInventory"], 100000.0)
        self.assertEqual(result["summary"]["inventoryTurnsPerYear"], 8.5)
        self.assertEqual(result["summary"]["averageDaysHeld"], 42.9)


class CostVsSalesPortTests(unittest.TestCase):
    def test_cost_vs_sales_increase(self) -> None:
        result = calculate_workbook_port(
            "cost-vs-sales-increase",
            {
                "currentSales": 1000000,
                "salesIncreasePercent": 10,
                "variableCostPercent": 65,
                "fixedExpenses": 250000,
            },
        )
        self.assertEqual(result["summary"]["newSales"], 1100000.0)
        self.assertEqual(result["summary"]["currentProfit"], 100000.0)
        self.assertEqual(result["summary"]["newProfit"], 135000.0)
        self.assertEqual(result["summary"]["profitChange"], 35000.0)


class OverheadCalcsPortTests(unittest.TestCase):
    def test_overhead_factoring(self) -> None:
        result = calculate_workbook_port(
            "f-300a-overhead-calcs",
            {
                "totalRevenue": 2500000,
                "totalOverhead": 450000,
                "totalMaterialCosts": 700000,
                "totalDirectLaborCosts": 550000,
            },
        )
        self.assertEqual(result["summary"]["directCosts"], 1250000.0)
        self.assertEqual(result["summary"]["overheadFactorOnDirect"], 0.36)
        self.assertEqual(result["summary"]["grossProfit"], 800000.0)


class BreakevenCoreTests(unittest.TestCase):
    def test_contribution_margin_summary(self) -> None:
        result = contribution_margin_summary(1000000, 650000, 250000, business_days=365)
        self.assertEqual(result["contributionMargin"], 350000.0)
        self.assertEqual(result["breakevenSales"], 714285.71)

    def test_sales_increase_profit_impact(self) -> None:
        result = sales_increase_profit_impact(1000000, 10, 65, 250000)
        self.assertEqual(result["newProfit"], 135000.0)


if __name__ == "__main__":
    unittest.main()
