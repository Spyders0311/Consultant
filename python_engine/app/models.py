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
    work_days_per_year: float = Field(alias="workDaysPerYear", ge=1, default=250)
    work_hours_per_day: float = Field(alias="workHoursPerDay", ge=1, default=8)


class BreakevenResult(BaseModel):
    gross_margin_amount: float = Field(alias="grossMarginAmount")
    gross_margin_percent: float = Field(alias="grossMarginPercent")
    breakeven_revenue: float | None = Field(alias="breakevenRevenue")
    breakeven_percent: float | None = Field(alias="breakevenPercent")
    breakeven_monthly: float | None = Field(alias="breakevenMonthly")
    breakeven_weekly: float | None = Field(alias="breakevenWeekly")
    breakeven_daily: float | None = Field(alias="breakevenDaily")
    breakeven_hourly: float | None = Field(alias="breakevenHourly")
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
