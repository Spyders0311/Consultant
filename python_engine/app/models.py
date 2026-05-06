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
    fixed_expenses_amount: float = Field(alias="fixedExpensesAmount", ge=0)
    profit_amount: float | None = Field(alias="profitAmount", ge=0, default=None)
    labor_amount: float | None = Field(alias="laborAmount", ge=0, default=None)
    indirect_costs_amount: float | None = Field(alias="indirectCostsAmount", ge=0, default=None)
    general_administrative_costs_amount: float | None = Field(
        alias="generalAdministrativeCostsAmount", ge=0, default=None
    )
    months_in_period: float | None = Field(alias="monthsInPeriod", ge=1, le=60, default=None)
    work_days_per_year: float = Field(alias="workDaysPerYear", ge=1, default=250)
    work_hours_per_day: float = Field(alias="workHoursPerDay", ge=1, default=8)


class BreakevenResult(BaseModel):
    gross_margin_amount: float = Field(alias="grossMarginAmount")
    gross_margin_percent: float = Field(alias="grossMarginPercent")
    net_profit_amount: float | None = Field(alias="netProfitAmount", default=None)
    variable_costs_amount: float | None = Field(alias="variableCostsAmount", default=None)
    fixed_costs_amount: float | None = Field(alias="fixedCostsAmount", default=None)
    other_costs_amount: float | None = Field(alias="otherCostsAmount", default=None)
    breakeven_revenue: float | None = Field(alias="breakevenRevenue")
    breakeven_percent: float | None = Field(alias="breakevenPercent")
    breakeven_monthly: float | None = Field(alias="breakevenMonthly")
    breakeven_weekly: float | None = Field(alias="breakevenWeekly")
    breakeven_daily: float | None = Field(alias="breakevenDaily")
    breakeven_hourly: float | None = Field(alias="breakevenHourly")
    total_days_in_period: float | None = Field(alias="totalDaysInPeriod", default=None)
    breakeven_days: float | None = Field(alias="breakevenDays", default=None)
    targeted_work_days: float | None = Field(alias="targetedWorkDays", default=None)
    formula_basis: str = Field(alias="formulaBasis")
    notes: list[str] = Field(default_factory=list)


class WorkingCapitalInput(BaseModel):
    annual_revenue: float = Field(alias="annualRevenue", ge=0)
    annual_cogs: float = Field(alias="annualCogs", ge=0)
    days_sales_outstanding: float = Field(alias="daysSalesOutstanding", ge=0)
    days_inventory_on_hand: float = Field(alias="daysInventoryOnHand", ge=0)
    days_payables_outstanding: float = Field(alias="daysPayablesOutstanding", ge=0)


class WorkingCapitalResult(BaseModel):
    ar_investment: float = Field(alias="arInvestment")
    inventory_investment: float = Field(alias="inventoryInvestment")
    ap_financing: float = Field(alias="apFinancing")
    net_working_capital: float = Field(alias="netWorkingCapital")
    cash_conversion_cycle: float = Field(alias="cashConversionCycle")
    working_capital_percent_of_revenue: float | None = Field(alias="workingCapitalPercentOfRevenue")
    warnings: list[str] = Field(default_factory=list)


class FiveYearProjectionsInput(BaseModel):
    base_year: int = Field(alias="baseYear", ge=1900, le=3000)
    base_revenue: float = Field(alias="baseRevenue", ge=0)
    revenue_growth_percent: float = Field(alias="revenueGrowthPercent", ge=-100, le=500)
    base_cogs_percent: float = Field(alias="baseCogsPercent", ge=0, le=100)
    base_fixed_expenses: float = Field(alias="baseFixedExpenses", ge=0)
    fixed_expense_growth_percent: float = Field(alias="fixedExpenseGrowthPercent", ge=-100, le=500)
    tax_rate_percent: float | None = Field(alias="taxRatePercent", ge=0, le=100, default=None)


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


class FiveYearProjectionsResult(BaseModel):
    years: list[FiveYearProjectionRow] = Field(min_length=5, max_length=5)
    warnings: list[str] = Field(default_factory=list)


class CurrentFinancialInformationInput(BaseModel):
    annual_revenue: float = Field(alias="annualRevenue", ge=0)
    annual_cogs: float = Field(alias="annualCogs", ge=0)
    annual_fixed_expenses: float = Field(alias="annualFixedExpenses", ge=0)
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


class PLComparisonsYearInput(BaseModel):
    year: int = Field(ge=1900, le=3000)
    revenue: float = Field(ge=0)
    cogs: float = Field(ge=0)
    operating_expenses: float = Field(alias="operatingExpenses", ge=0)
    other_expenses: float = Field(alias="otherExpenses", ge=0)


class PLComparisonsInput(BaseModel):
    years: list[PLComparisonsYearInput] = Field(min_length=1, max_length=10)


class BalanceSheetComparisonsYearInput(BaseModel):
    year: int = Field(ge=1900, le=3000)
    cash: float = Field(ge=0)
    ar: float = Field(ge=0)
    inventory: float = Field(ge=0)
    other_current_assets: float = Field(alias="otherCurrentAssets", ge=0)
    fixed_assets: float = Field(alias="fixedAssets", ge=0)
    other_assets: float = Field(alias="otherAssets", ge=0)
    ap: float = Field(ge=0)
    other_current_liabilities: float = Field(alias="otherCurrentLiabilities", ge=0)
    long_term_debt: float = Field(alias="longTermDebt", ge=0)
    other_liabilities: float = Field(alias="otherLiabilities", ge=0)
    equity: float = Field(ge=0)


class BalanceSheetComparisonsInput(BaseModel):
    years: list[BalanceSheetComparisonsYearInput] = Field(min_length=1, max_length=10)


class AdvancedAnalystSheetInput(BaseModel):
    sheet_key: str = Field(alias="sheetKey", min_length=1, max_length=80)
    inputs: dict[str, object] = Field(default_factory=dict)


class AdvancedAnalystSheetResult(BaseModel):
    sheet_key: str = Field(alias="sheetKey")
    summary: dict[str, object] = Field(default_factory=dict)
    rows: list[dict[str, object]] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


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


class WeeklyCashFlowWeekInput(BaseModel):
    week_label: str = Field(alias="weekLabel", min_length=1, max_length=40)
    cash_receipts: float = Field(alias="cashReceipts", ge=0)
    new_sales: float = Field(alias="newSales", ge=0, default=0)
    payroll: float = Field(ge=0, default=0)
    materials: float = Field(ge=0, default=0)
    rent_utilities: float = Field(alias="rentUtilities", ge=0, default=0)
    loan_payments: float = Field(alias="loanPayments", ge=0, default=0)
    credit_card_payments: float = Field(alias="creditCardPayments", ge=0, default=0)
    other_disbursements: float = Field(alias="otherDisbursements", ge=0, default=0)


class WeeklyCashFlowInput(BaseModel):
    beginning_cash: float = Field(alias="beginningCash", ge=0)
    line_of_credit_limit: float = Field(alias="lineOfCreditLimit", ge=0, default=0)
    beginning_line_of_credit_balance: float = Field(alias="beginningLineOfCreditBalance", ge=0, default=0)
    minimum_cash_reserve: float = Field(alias="minimumCashReserve", ge=0, default=0)
    weeks: list[WeeklyCashFlowWeekInput] = Field(min_length=1, max_length=13)
    notes: str = Field(default="", max_length=4000)


class WeeklyCashFlowWeekResult(BaseModel):
    week_label: str = Field(alias="weekLabel")
    beginning_cash: float = Field(alias="beginningCash")
    cash_receipts: float = Field(alias="cashReceipts")
    new_sales: float = Field(alias="newSales")
    total_disbursements: float = Field(alias="totalDisbursements")
    net_cash_flow: float = Field(alias="netCashFlow")
    line_of_credit_draw: float = Field(alias="lineOfCreditDraw")
    line_of_credit_repayment: float = Field(alias="lineOfCreditRepayment")
    ending_line_of_credit_balance: float = Field(alias="endingLineOfCreditBalance")
    ending_cash: float = Field(alias="endingCash")
    remaining_line_of_credit: float = Field(alias="remainingLineOfCredit")
    reserve_shortfall: float = Field(alias="reserveShortfall")


class WeeklyCashFlowResult(BaseModel):
    weeks: list[WeeklyCashFlowWeekResult]
    total_receipts: float = Field(alias="totalReceipts")
    total_disbursements: float = Field(alias="totalDisbursements")
    ending_cash: float = Field(alias="endingCash")
    ending_line_of_credit_balance: float = Field(alias="endingLineOfCreditBalance")
    lowest_cash_balance: float = Field(alias="lowestCashBalance")
    peak_line_of_credit_use: float = Field(alias="peakLineOfCreditUse")
    warnings: list[str] = Field(default_factory=list)


class FlexibleBudgetVarianceInput(BaseModel):
    period_label: str = Field(alias="periodLabel", min_length=1, max_length=80)
    budget_revenue: float = Field(alias="budgetRevenue", ge=0)
    actual_revenue: float = Field(alias="actualRevenue", ge=0)
    budget_cogs_percent: float = Field(alias="budgetCogsPercent", ge=0, le=100)
    actual_cogs: float = Field(alias="actualCogs", ge=0)
    budget_variable_expense_percent: float = Field(alias="budgetVariableExpensePercent", ge=0, le=100, default=0)
    actual_variable_expenses: float = Field(alias="actualVariableExpenses", ge=0, default=0)
    budget_fixed_expenses: float = Field(alias="budgetFixedExpenses", ge=0)
    actual_fixed_expenses: float = Field(alias="actualFixedExpenses", ge=0)
    notes: str = Field(default="", max_length=4000)


class FlexibleBudgetVarianceRow(BaseModel):
    line_item: str = Field(alias="lineItem")
    static_budget: float = Field(alias="staticBudget")
    flexible_budget: float = Field(alias="flexibleBudget")
    actual: float
    variance: float
    variance_percent: float | None = Field(alias="variancePercent")
    favorable: bool


class FlexibleBudgetVarianceResult(BaseModel):
    period_label: str = Field(alias="periodLabel")
    rows: list[FlexibleBudgetVarianceRow]
    sales_volume_variance: float = Field(alias="salesVolumeVariance")
    flexible_budget_operating_income: float = Field(alias="flexibleBudgetOperatingIncome")
    actual_operating_income: float = Field(alias="actualOperatingIncome")
    operating_income_variance: float = Field(alias="operatingIncomeVariance")
    operating_income_variance_percent: float | None = Field(alias="operatingIncomeVariancePercent")
    warnings: list[str] = Field(default_factory=list)
