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
