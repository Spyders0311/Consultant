import unittest

from app.analyst.breakeven import calculate_analyst_breakeven
from app.analyst.expense_lines import calculate_expense_lines
from app.analyst.four_year_history import generate_four_year_history
from app.analyst.monthly_analysis import calculate_monthly_analysis
from app.analyst.pl_rollup import normalize_pl_year
from app.analyst.projections import calculate_five_year_projections
from app.analyst.twelve_month import calculate_twelve_month_pl
from app.analyst.wc_scenarios import calculate_working_capital_with_scenarios


class AnalystWorksheetTests(unittest.TestCase):
    def test_breakeven_contribution_method(self) -> None:
        result = calculate_analyst_breakeven(
            {
                "annualRevenue": 1_000_000,
                "cogsAmount": 400_000,
                "laborAmount": 200_000,
                "fixedExpensesAmount": 100_000,
                "indirectCostsAmount": 50_000,
                "generalAdministrativeCostsAmount": 25_000,
                "calculationMethod": "contribution",
                "workDaysPerYear": 250,
                "workHoursPerDay": 8,
            }
        )
        self.assertIsNotNone(result["breakevenRevenue"])
        self.assertGreater(result["breakevenRevenue"], 0)

    def test_pl_rollup_line_items(self) -> None:
        row = normalize_pl_year(
            {
                "year": 2026,
                "lineItems": [
                    {"category": "revenue", "amount": 100},
                    {"category": "cogs_labor", "amount": 20},
                    {"category": "opex_payroll", "amount": 10},
                    {"category": "indirect", "amount": 5},
                ],
            }
        )
        self.assertEqual(row["revenue"], 100)
        self.assertEqual(row["cogs"], 20)
        self.assertEqual(row["laborAmount"], 30)

    def test_misc_direct_expenses(self) -> None:
        result = calculate_expense_lines(
            [{"category": "labor", "description": "Shop", "amount": 1000}],
            "direct",
        )
        self.assertEqual(result["annualTotal"], 1000)

    def test_four_year_history(self) -> None:
        result = generate_four_year_history(
            {
                "client": {
                    "currentAnnualRevenue": 1_000_000,
                    "cogsPercent": 50,
                    "revenueGrowthPercent": 5,
                    "fixedPayroll": 100_000,
                    "fixedRentUtilities": 20_000,
                    "fixedOther": 10_000,
                },
                "miscDirect": {"annualTotal": 50_000},
                "miscIndirect": {"annualTotal": 30_000},
            }
        )
        self.assertEqual(len(result["plYears"]), 4)
        self.assertEqual(len(result["bsYears"]), 4)

    def test_five_year_projections_horizon(self) -> None:
        result = calculate_five_year_projections(
            {
                "baseYear": 2026,
                "horizonYears": 7,
                "baseRevenue": 1_000_000,
                "revenueGrowthPercent": 5,
                "baseCogsPercent": 50,
                "baseFixedExpenses": 300_000,
                "fixedExpenseGrowthPercent": 3,
                "taxRatePercent": 25,
                "discountRatePercent": 12,
            }
        )
        self.assertEqual(len(result["years"]), 7)
        self.assertIn("enterpriseValueNpv", result["summary"])

    def test_twelve_month_pl(self) -> None:
        months = [{"revenue": 100_000, "cogs": 40_000, "operatingExpenses": 30_000, "otherExpenses": 5_000}] * 12
        result = calculate_twelve_month_pl({"year": 2026, "months": months})
        self.assertEqual(result["annual"]["revenue"], 1_200_000)

    def test_monthly_analysis_payroll(self) -> None:
        months = [{"lines": [{"category": "payroll", "amount": 10_000}]}] * 12
        result = calculate_monthly_analysis({"year": 2026, "analysisType": "payroll", "months": months})
        self.assertEqual(result["annualTotal"], 120_000)
        self.assertEqual(len(result["months"]), 12)

    def test_working_capital_growth_scenarios(self) -> None:
        result = calculate_working_capital_with_scenarios(
            {
                "annualRevenue": 1_000_000,
                "annualCogs": 600_000,
                "daysSalesOutstanding": 45,
                "daysInventoryOnHand": 30,
                "daysPayablesOutstanding": 30,
                "revenueGrowthPercent": 10,
                "projectionYears": 2,
            }
        )
        self.assertEqual(len(result["scenarios"]), 2)
        self.assertGreater(result["scenarios"][0]["cumulativeFundingNeed"], 0)

    def test_balance_sheet_sub_lines(self) -> None:
        from app.main import calculate_balance_sheet_comparisons

        response = calculate_balance_sheet_comparisons(
            {
                "years": [
                    {
                        "year": 2026,
                        "cash": 100_000,
                        "ar": 200_000,
                        "inventory": 50_000,
                        "otherCurrentAssets": 10_000,
                        "intangibleAssets": 25_000,
                        "fixedAssets": 300_000,
                        "otherAssets": 5_000,
                        "ap": 80_000,
                        "currentPortionLtd": 20_000,
                        "otherCurrentLiabilities": 15_000,
                        "longTermDebt": 150_000,
                        "otherLiabilities": 10_000,
                        "retainedEarnings": 120_000,
                        "equity": 295_000,
                    }
                ]
            }
        )
        year = response["result"]["years"][0]
        self.assertEqual(year["intangibleAssets"], 25_000)
        self.assertEqual(year["currentPortionLtd"], 20_000)
        self.assertEqual(year["retainedEarnings"], 120_000)

    def test_financial_ratios(self) -> None:
        from app.analyst.financial_ratios import calculate_financial_ratios

        result = calculate_financial_ratios(
            {
                "plYear": {"year": 2026, "revenue": 1_000_000, "cogs": 600_000, "operatingExpenses": 250_000, "otherExpenses": 50_000},
                "bsYear": {
                    "year": 2026,
                    "cash": 100_000,
                    "ar": 120_000,
                    "inventory": 80_000,
                    "otherCurrentAssets": 10_000,
                    "ap": 60_000,
                    "otherCurrentLiabilities": 20_000,
                    "longTermDebt": 200_000,
                    "otherLiabilities": 10_000,
                    "equity": 400_000,
                    "fixedAssets": 300_000,
                    "otherAssets": 0,
                    "intangibleAssets": 0,
                    "currentPortionLtd": 0,
                },
            }
        )
        self.assertEqual(result["ratios"]["grossProfitMarginPct"], 40.0)
        self.assertIsNotNone(result["ratios"]["currentRatio"])
        self.assertIsNotNone(result["ratios"]["quickRatio"])
        self.assertIsNotNone(result["ratios"]["returnOnAssetsPct"])

    def test_pl_analysis_min_max(self) -> None:
        from app.analyst.pl_analysis import calculate_pl_analysis

        result = calculate_pl_analysis(
            {
                "analysisType": "min-max",
                "years": [
                    {"year": 2023, "revenue": 900_000, "cogs": 500_000, "operatingExpenses": 200_000, "otherExpenses": 50_000},
                    {"year": 2024, "revenue": 1_000_000, "cogs": 600_000, "operatingExpenses": 250_000, "otherExpenses": 50_000},
                ],
            }
        )
        self.assertIn("revenue", result["summary"])

    def test_roi_analysis(self) -> None:
        from app.analyst.roi_analysis import calculate_roi_analysis

        result = calculate_roi_analysis(
            {"roiType": "labor", "annualRevenue": 1_000_000, "annualCogs": 600_000, "categoryTotal": 200_000}
        )
        self.assertEqual(result["shareOfRevenuePct"], 20.0)

    def test_valuation(self) -> None:
        from app.analyst.valuation import calculate_business_valuation

        result = calculate_business_valuation({"scenario": "current", "ebitda": 200_000, "ebitdaMultiple": 4})
        self.assertEqual(result["enterpriseValue"], 800_000.0)

    def test_matrix_scoring(self) -> None:
        from app.analyst.matrix_scoring import score_matrix_responses

        result = score_matrix_responses(
            {
                "matrixKey": "management-matrix",
                "questions": [{"id": "mg1", "label": "Leadership", "category": "Leadership"}],
                "responses": {"mg1": 5},
            }
        )
        self.assertEqual(result["scorePct"], 100.0)


if __name__ == "__main__":
    unittest.main()
