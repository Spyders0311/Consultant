from pydantic import BaseModel, Field


class RevenueInputs(BaseModel):
    current_annual_revenue: float = Field(alias="currentAnnualRevenue", ge=0)
    cogs_percent: float = Field(alias="cogsPercent", ge=0, le=100)
    revenue_growth_percent: float = Field(alias="revenueGrowthPercent", ge=-80, le=200)


class FixedExpenseInputs(BaseModel):
    payroll: float = Field(ge=0)
    rent_utilities: float = Field(alias="rentUtilities", ge=0)
    other: float = Field(ge=0)
    fixed_expense_growth_percent: float = Field(alias="fixedExpenseGrowthPercent", ge=-50, le=100)


class MarketAssumptions(BaseModel):
    market_growth_percent: float = Field(alias="marketGrowthPercent", ge=-30, le=80)
    target_market_share_percent: float = Field(alias="targetMarketSharePercent", ge=0, le=100)
    inflation_percent: float = Field(alias="inflationPercent", ge=-10, le=40)
    tax_rate_percent: float = Field(alias="taxRatePercent", ge=0, le=60)
    discount_rate_percent: float = Field(alias="discountRatePercent", ge=1, le=60)


class AnalystWizardInput(BaseModel):
    company_name: str = Field(alias="companyName", min_length=1, max_length=120)
    industry: str = Field(min_length=1, max_length=120)
    horizon_years: int = Field(alias="horizonYears", ge=3, le=10)
    revenue: RevenueInputs
    fixed_expenses: FixedExpenseInputs = Field(alias="fixedExpenses")
    market_assumptions: MarketAssumptions = Field(alias="marketAssumptions")


class ProjectionRow(BaseModel):
    year: int
    revenue: float
    gross_profit: float = Field(alias="grossProfit")
    ebitda: float
    free_cash_flow: float = Field(alias="freeCashFlow")


class Summary(BaseModel):
    enterprise_value_npv: float = Field(alias="enterpriseValueNpv")
    year_one_ebitda_margin_percent: float = Field(alias="yearOneEbitdaMarginPercent")
    cumulative_free_cash_flow: float = Field(alias="cumulativeFreeCashFlow")
    blended_growth_rate_percent: float = Field(alias="blendedGrowthRatePercent")


class WorkbookMeta(BaseModel):
    path: str
    sha256: str
    size_bytes: int = Field(alias="sizeBytes")
    sheet_count: int = Field(alias="sheetCount")
    sheet_names_sample: list[str] = Field(alias="sheetNamesSample")


class AnalystWizardResult(BaseModel):
    company_name: str = Field(alias="companyName")
    industry: str
    horizon_years: int = Field(alias="horizonYears")
    summary: Summary
    projections: list[ProjectionRow]
    engine_version: str = Field(alias="engineVersion")
    workbook: WorkbookMeta


class BreakevenInput(BaseModel):
    annual_revenue: float = Field(alias="annualRevenue", ge=0)
    cogs_amount: float = Field(alias="cogsAmount", ge=0)
    fixed_expenses_amount: float = Field(alias="fixedExpensesAmount", ge=0, default=0)
    labor_amount: float = Field(alias="laborAmount", ge=0, default=0)
    indirect_costs_amount: float = Field(alias="indirectCostsAmount", ge=0, default=0)
    general_administrative_costs_amount: float = Field(
        alias="generalAdministrativeCostsAmount", ge=0, default=0
    )
    profit_amount: float | None = Field(alias="profitAmount", ge=0, default=None)
    months_in_period: float = Field(alias="monthsInPeriod", ge=1, le=12, default=12)
    calculation_method: str = Field(alias="calculationMethod", default="auto")
    work_days_per_year: float = Field(alias="workDaysPerYear", ge=1, default=250)
    work_hours_per_day: float = Field(alias="workHoursPerDay", ge=1, default=8)


class BreakevenResult(BaseModel):
    calculation_method: str = Field(alias="calculationMethod", default="gross_margin")
    gross_margin_amount: float = Field(alias="grossMarginAmount")
    gross_margin_percent: float = Field(alias="grossMarginPercent")
    variable_costs_amount: float | None = Field(alias="variableCostsAmount", default=None)
    fixed_costs_amount: float | None = Field(alias="fixedCostsAmount", default=None)
    contribution_margin: float | None = Field(alias="contributionMargin", default=None)
    operating_income: float | None = Field(alias="operatingIncome", default=None)
    breakeven_revenue: float | None = Field(alias="breakevenRevenue")
    breakeven_percent: float | None = Field(alias="breakevenPercent")
    breakeven_days: float | None = Field(alias="breakevenDays", default=None)
    breakeven_monthly: float | None = Field(alias="breakevenMonthly")
    breakeven_weekly: float | None = Field(alias="breakevenWeekly")
    breakeven_daily: float | None = Field(alias="breakevenDaily")
    breakeven_hourly: float | None = Field(alias="breakevenHourly")
    months_in_period: float | None = Field(alias="monthsInPeriod", default=None)
    notes: list[str] = Field(default_factory=list)


class WorkingCapitalInput(BaseModel):
    annual_revenue: float = Field(alias="annualRevenue", ge=0)
    annual_cogs: float = Field(alias="annualCogs", ge=0)
    days_sales_outstanding: float = Field(alias="daysSalesOutstanding", ge=0)
    days_inventory_on_hand: float = Field(alias="daysInventoryOnHand", ge=0)
    days_payables_outstanding: float = Field(alias="daysPayablesOutstanding", ge=0)
    revenue_growth_percent: float | None = Field(alias="revenueGrowthPercent", default=None)
    cogs_growth_percent: float | None = Field(alias="cogsGrowthPercent", default=None)
    projection_years: int = Field(alias="projectionYears", ge=0, le=5, default=0)


class WorkingCapitalResult(BaseModel):
    ar_investment: float = Field(alias="arInvestment")
    inventory_investment: float = Field(alias="inventoryInvestment")
    ap_financing: float = Field(alias="apFinancing")
    net_working_capital: float = Field(alias="netWorkingCapital")
    cash_conversion_cycle: float = Field(alias="cashConversionCycle")
    working_capital_percent_of_revenue: float | None = Field(alias="workingCapitalPercentOfRevenue")
    revenue_growth_percent: float | None = Field(alias="revenueGrowthPercent", default=None)
    cogs_growth_percent: float | None = Field(alias="cogsGrowthPercent", default=None)
    projection_years: int | None = Field(alias="projectionYears", default=None)
    scenarios: list[dict] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class FiveYearProjectionsInput(BaseModel):
    base_year: int = Field(alias="baseYear", ge=1900, le=3000)
    horizon_years: int = Field(alias="horizonYears", ge=3, le=10, default=5)
    base_revenue: float = Field(alias="baseRevenue", ge=0)
    revenue_growth_percent: float = Field(alias="revenueGrowthPercent", ge=-100, le=500)
    base_cogs_percent: float = Field(alias="baseCogsPercent", ge=0, le=100)
    base_fixed_expenses: float = Field(alias="baseFixedExpenses", ge=0, default=0)
    fixed_payroll: float | None = Field(alias="fixedPayroll", ge=0, default=None)
    fixed_rent_utilities: float | None = Field(alias="fixedRentUtilities", ge=0, default=None)
    fixed_other: float | None = Field(alias="fixedOther", ge=0, default=None)
    fixed_expense_growth_percent: float = Field(alias="fixedExpenseGrowthPercent", ge=-100, le=500)
    tax_rate_percent: float | None = Field(alias="taxRatePercent", ge=0, le=100, default=None)
    market_growth_percent: float | None = Field(alias="marketGrowthPercent", default=None)
    inflation_percent: float | None = Field(alias="inflationPercent", default=None)
    discount_rate_percent: float | None = Field(alias="discountRatePercent", ge=0, le=100, default=None)


class FiveYearProjectionRow(BaseModel):
    year: int
    revenue: float
    cogs: float
    gross_profit: float = Field(alias="grossProfit")
    gross_margin_pct: float | None = Field(alias="grossMarginPct")
    fixed_expenses: float = Field(alias="fixedExpenses")
    ebitda: float
    ebitda_margin_pct: float | None = Field(alias="ebitdaMarginPct")
    taxes: float | None = None
    net_income: float | None = Field(alias="netIncome", default=None)
    free_cash_flow: float | None = Field(alias="freeCashFlow", default=None)


class FiveYearProjectionsSummary(BaseModel):
    enterprise_value_npv: float | None = Field(alias="enterpriseValueNpv", default=None)
    blended_growth_rate_percent: float | None = Field(alias="blendedGrowthRatePercent", default=None)


class FiveYearProjectionsResult(BaseModel):
    horizon_years: int = Field(alias="horizonYears", default=5)
    years: list[FiveYearProjectionRow] = Field(min_length=1, max_length=10)
    summary: FiveYearProjectionsSummary | None = None
    warnings: list[str] = Field(default_factory=list)


class CurrentFinancialInformationInput(BaseModel):
    annual_revenue: float = Field(alias="annualRevenue", ge=0)
    annual_cogs: float = Field(alias="annualCogs", ge=0)
    annual_fixed_expenses: float = Field(alias="annualFixedExpenses", ge=0)
    labor_amount: float = Field(alias="laborAmount", ge=0, default=0)
    indirect_costs_amount: float = Field(alias="indirectCostsAmount", ge=0, default=0)
    general_administrative_costs_amount: float = Field(
        alias="generalAdministrativeCostsAmount", ge=0, default=0
    )
    profit_amount: float | None = Field(alias="profitAmount", ge=0, default=None)
    days_sales_outstanding: float = Field(alias="daysSalesOutstanding", ge=0)
    days_inventory_on_hand: float = Field(alias="daysInventoryOnHand", ge=0)
    days_payables_outstanding: float = Field(alias="daysPayablesOutstanding", ge=0)
    work_days_per_year: float = Field(alias="workDaysPerYear", ge=1)
    work_hours_per_day: float = Field(alias="workHoursPerDay", ge=1)
    optional_notes: str = Field(alias="optionalNotes", default="", max_length=4000)


class CurrentFinancialInformationResult(BaseModel):
    gross_margin_amount: float = Field(alias="grossMarginAmount")
    gross_margin_percent: float = Field(alias="grossMarginPercent")
    breakeven_revenue: float | None = Field(alias="breakevenRevenue")
    ar_investment: float = Field(alias="arInvestment")
    inventory_investment: float = Field(alias="inventoryInvestment")
    ap_financing: float = Field(alias="apFinancing")
    net_working_capital: float = Field(alias="netWorkingCapital")
    cash_conversion_cycle: float = Field(alias="cashConversionCycle")
    breakeven_daily: float | None = Field(alias="breakevenDaily")
    breakeven_weekly: float | None = Field(alias="breakevenWeekly")
    breakeven_monthly: float | None = Field(alias="breakevenMonthly")
    breakeven_hourly: float | None = Field(alias="breakevenHourly")
    warnings: list[str] = Field(default_factory=list)


class PLLineItemInput(BaseModel):
    category: str = Field(min_length=1, max_length=40)
    description: str = Field(default="", max_length=200)
    amount: float = Field(ge=0)


class PLComparisonsYearInput(BaseModel):
    year: int = Field(ge=1900, le=3000)
    revenue: float | None = Field(ge=0, default=None)
    cogs: float | None = Field(ge=0, default=None)
    operating_expenses: float | None = Field(alias="operatingExpenses", ge=0, default=None)
    other_expenses: float | None = Field(alias="otherExpenses", ge=0, default=None)
    line_items: list[PLLineItemInput] = Field(alias="lineItems", default_factory=list)


class PLComparisonsInput(BaseModel):
    years: list[PLComparisonsYearInput] = Field(min_length=1, max_length=10)


class BalanceSheetComparisonsYearInput(BaseModel):
    year: int = Field(ge=1900, le=3000)
    cash: float = Field(ge=0)
    ar: float = Field(ge=0)
    inventory: float = Field(ge=0)
    other_current_assets: float = Field(alias="otherCurrentAssets", ge=0)
    intangible_assets: float = Field(alias="intangibleAssets", ge=0, default=0)
    fixed_assets: float = Field(alias="fixedAssets", ge=0)
    other_assets: float = Field(alias="otherAssets", ge=0)
    ap: float = Field(ge=0)
    current_portion_ltd: float = Field(alias="currentPortionLtd", ge=0, default=0)
    other_current_liabilities: float = Field(alias="otherCurrentLiabilities", ge=0)
    long_term_debt: float = Field(alias="longTermDebt", ge=0)
    other_liabilities: float = Field(alias="otherLiabilities", ge=0)
    retained_earnings: float | None = Field(alias="retainedEarnings", ge=0, default=None)
    equity: float = Field(ge=0)


class BalanceSheetComparisonsInput(BaseModel):
    years: list[BalanceSheetComparisonsYearInput] = Field(min_length=1, max_length=10)


class BasicClientInfoInput(BaseModel):
    company_name: str = Field(alias="companyName", default="", max_length=160)
    industry: str = Field(default="", max_length=120)
    primary_contact_name: str = Field(alias="primaryContactName", default="", max_length=120)
    primary_contact_email: str = Field(alias="primaryContactEmail", default="", max_length=200)
    primary_contact_phone: str = Field(alias="primaryContactPhone", default="", max_length=40)
    location_city: str = Field(alias="locationCity", default="", max_length=120)
    location_state: str = Field(alias="locationState", default="", max_length=120)
    notes: str = Field(default="", max_length=4000)


class BasicClientInfoResult(BaseModel):
    company_name: str | None = Field(alias="companyName")
    industry: str | None
    primary_contact_name: str | None = Field(alias="primaryContactName")
    primary_contact_email: str | None = Field(alias="primaryContactEmail")
    primary_contact_phone: str | None = Field(alias="primaryContactPhone")
    location_city: str | None = Field(alias="locationCity")
    location_state: str | None = Field(alias="locationState")
    notes: str | None
    summary_block: str = Field(alias="summaryBlock")
    warnings: list[str] = Field(default_factory=list)


class ExpenseLineInput(BaseModel):
    category: str = Field(min_length=1, max_length=40)
    description: str = Field(default="", max_length=200)
    amount: float = Field(ge=0)


class MiscExpenseInput(BaseModel):
    lines: list[ExpenseLineInput] = Field(min_length=1, max_length=120)


class TwelveMonthPLMonthInput(BaseModel):
    revenue: float | None = Field(ge=0, default=None)
    cogs: float | None = Field(ge=0, default=None)
    operating_expenses: float | None = Field(alias="operatingExpenses", ge=0, default=None)
    other_expenses: float | None = Field(alias="otherExpenses", ge=0, default=None)
    line_items: list[PLLineItemInput] = Field(alias="lineItems", default_factory=list)


class TwelveMonthPLInput(BaseModel):
    year: int = Field(ge=1900, le=3000)
    months: list[TwelveMonthPLMonthInput] = Field(min_length=12, max_length=12)


class MonthlyAnalysisLineInput(BaseModel):
    category: str = Field(min_length=1, max_length=40)
    description: str = Field(default="", max_length=200)
    amount: float = Field(ge=0)


class MonthlyAnalysisMonthInput(BaseModel):
    lines: list[MonthlyAnalysisLineInput] = Field(default_factory=list)


class MonthlyAnalysisInput(BaseModel):
    year: int = Field(ge=1900, le=3000)
    analysis_type: str = Field(alias="analysisType", min_length=1, max_length=40)
    months: list[MonthlyAnalysisMonthInput] = Field(min_length=12, max_length=12)


class FourYearHistoryInput(BaseModel):
    client: dict = Field(default_factory=dict)
    misc_direct: dict | None = Field(alias="miscDirect", default=None)
    misc_indirect: dict | None = Field(alias="miscIndirect", default=None)
    pl_runs: list[dict] = Field(alias="plRuns", default_factory=list)
    bs_runs: list[dict] = Field(alias="bsRuns", default_factory=list)


class FinancialRatiosYearInput(BaseModel):
    year: int | None = Field(default=None, ge=1900, le=3000)
    revenue: float | None = Field(ge=0, default=None)
    cogs: float | None = Field(ge=0, default=None)
    operating_expenses: float | None = Field(alias="operatingExpenses", ge=0, default=None)
    other_expenses: float | None = Field(alias="otherExpenses", ge=0, default=None)


class FinancialRatiosBSYearInput(BaseModel):
    year: int | None = Field(default=None, ge=1900, le=3000)
    cash: float = Field(ge=0, default=0)
    ar: float = Field(ge=0, default=0)
    inventory: float = Field(ge=0, default=0)
    other_current_assets: float = Field(alias="otherCurrentAssets", ge=0, default=0)
    intangible_assets: float = Field(alias="intangibleAssets", ge=0, default=0)
    fixed_assets: float = Field(alias="fixedAssets", ge=0, default=0)
    other_assets: float = Field(alias="otherAssets", ge=0, default=0)
    ap: float = Field(ge=0, default=0)
    current_portion_ltd: float = Field(alias="currentPortionLtd", ge=0, default=0)
    other_current_liabilities: float = Field(alias="otherCurrentLiabilities", ge=0, default=0)
    long_term_debt: float = Field(alias="longTermDebt", ge=0, default=0)
    other_liabilities: float = Field(alias="otherLiabilities", ge=0, default=0)
    equity: float = Field(ge=0, default=0)


class FinancialRatiosInput(BaseModel):
    pl_year: FinancialRatiosYearInput | None = Field(alias="plYear", default=None)
    bs_year: FinancialRatiosBSYearInput | None = Field(alias="bsYear", default=None)
    bs_computed: dict = Field(alias="bsComputed", default_factory=dict)


class WorkbookPortInput(BaseModel):
    workbook_key: str = Field(alias="workbookKey", min_length=1, max_length=120)
    inputs: dict = Field(default_factory=dict)


class WorkbookPortResult(BaseModel):
    workbook_key: str = Field(alias="workbookKey")
    summary: dict = Field(default_factory=dict)
    rows: list[dict] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
