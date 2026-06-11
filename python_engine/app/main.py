import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .calculation_service import run_projection
from .models import (
    AnalystWizardInput,
    AnalystWizardResult,
    AdvancedAnalystSheetInput,
    AdvancedAnalystSheetResult,
    BalanceSheetComparisonsInput,
    BasicClientInfoInput,
    BasicClientInfoResult,
    BreakevenInput,
    BreakevenResult,
    CurrentFinancialInformationInput,
    CurrentFinancialInformationResult,
    FlexibleBudgetVarianceInput,
    FlexibleBudgetVarianceResult,
    FiveYearProjectionsInput,
    FiveYearProjectionsResult,
    PLComparisonsInput,
    WeeklyCashFlowInput,
    WeeklyCashFlowResult,
    WorkbookPortInput,
    WorkbookPortResult,
    WorkingCapitalInput,
    WorkingCapitalResult,
)
from .spreadsheet_context import WorkbookContext, load_workbook_context
from .workbook_ports import calculate_workbook_port as run_workbook_port

ENGINE_VERSION = "1.0.0"

app = FastAPI(title="BMS Python Analyst Engine", version=ENGINE_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("PYTHON_ENGINE_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _fallback_workbook_context(path: str) -> WorkbookContext:
    return WorkbookContext(
        path=path,
        sha256="unavailable",
        size_bytes=0,
        sheet_names=[],
    )


WORKBOOK_CONTEXT: WorkbookContext = _fallback_workbook_context("unavailable")


@app.on_event("startup")
def startup_event() -> None:
    global WORKBOOK_CONTEXT
    spreadsheet_path = os.getenv("ANALYST_SPREADSHEET_PATH")
    if not spreadsheet_path:
        WORKBOOK_CONTEXT = _fallback_workbook_context("unavailable")
        return

    try:
        WORKBOOK_CONTEXT = load_workbook_context(spreadsheet_path)
    except FileNotFoundError:
        WORKBOOK_CONTEXT = _fallback_workbook_context(spreadsheet_path)
    except Exception:  # noqa: BLE001
        WORKBOOK_CONTEXT = _fallback_workbook_context(spreadsheet_path)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "engineVersion": ENGINE_VERSION}


def _normalize_text(value: str) -> str | None:
    normalized = " ".join((value or "").split()).strip()
    return normalized or None


def _normalize_email(value: str) -> str | None:
    normalized = _normalize_text(value)
    return normalized.lower() if normalized else None


def _normalize_phone(value: str) -> str | None:
    normalized = _normalize_text(value)
    if not normalized:
        return None

    digits = "".join(ch for ch in normalized if ch.isdigit())
    if len(digits) == 10:
        return f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:11]}"
    return normalized


def _num(value: object) -> float:
    try:
        if value is None or value == "":
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _pct(numerator: float, denominator: float) -> float | None:
    return (numerator / denominator * 100.0) if denominator else None


def _safe_ratio(numerator: float, denominator: float) -> float | None:
    return (numerator / denominator) if denominator else None


def _calculate_monthly_pl(inputs: dict[str, object]) -> dict:
    months = inputs.get("months")
    if not isinstance(months, list):
        months = []

    rows: list[dict] = []
    total_revenue = 0.0
    total_gross_profit = 0.0
    total_ebit = 0.0
    total_net_income = 0.0

    for index, raw_month in enumerate(months[:12]):
        month = raw_month if isinstance(raw_month, dict) else {}
        revenue = _num(month.get("revenue"))
        direct_labor = _num(month.get("directLabor"))
        materials = _num(month.get("materials"))
        subcontractors = _num(month.get("subcontractors"))
        misc_direct_cost = _num(month.get("miscDirectCost"))
        cogs = _num(month.get("cogs")) or direct_labor + materials + subcontractors + misc_direct_cost
        payroll = _num(month.get("payroll"))
        operating_expenses = _num(month.get("operatingExpenses"))
        other_expenses = _num(month.get("otherExpenses"))
        gross_profit = revenue - cogs
        ebit = gross_profit - payroll - operating_expenses
        net_income = ebit - other_expenses
        total_revenue += revenue
        total_gross_profit += gross_profit
        total_ebit += ebit
        total_net_income += net_income
        rows.append(
            {
                "period": str(month.get("period") or f"Month {index + 1}"),
                "revenue": revenue,
                "directLabor": direct_labor,
                "materials": materials,
                "subcontractors": subcontractors,
                "miscDirectCost": misc_direct_cost,
                "cogs": cogs,
                "grossProfit": gross_profit,
                "grossMarginPct": _pct(gross_profit, revenue),
                "payroll": payroll,
                "operatingExpenses": operating_expenses,
                "ebit": ebit,
                "ebitMarginPct": _pct(ebit, revenue),
                "otherExpenses": other_expenses,
                "netIncome": net_income,
                "netMarginPct": _pct(net_income, revenue),
            }
        )

    warnings: list[str] = []
    if len(rows) < 12:
        warnings.append("Less than 12 months were provided.")
    if total_net_income < 0:
        warnings.append("Total net income is negative for the period.")

    return {
        "summary": {
            "totalRevenue": total_revenue,
            "totalGrossProfit": total_gross_profit,
            "grossMarginPct": _pct(total_gross_profit, total_revenue),
            "totalEbit": total_ebit,
            "ebitMarginPct": _pct(total_ebit, total_revenue),
            "totalNetIncome": total_net_income,
            "netMarginPct": _pct(total_net_income, total_revenue),
        },
        "rows": rows,
        "warnings": warnings,
    }


def _calculate_pl_min_max(inputs: dict[str, object]) -> dict:
    years = inputs.get("years")
    if not isinstance(years, list):
        years = []

    metrics = [
        ("revenue", "Revenue"),
        ("cogs", "COGS"),
        ("grossProfit", "Gross Profit"),
        ("operatingExpenses", "Operating Expenses"),
        ("netIncome", "Net Income"),
    ]
    normalized: list[dict] = []
    for row in years[:10]:
        source = row if isinstance(row, dict) else {}
        revenue = _num(source.get("revenue"))
        cogs = _num(source.get("cogs"))
        operating_expenses = _num(source.get("operatingExpenses"))
        other_expenses = _num(source.get("otherExpenses"))
        gross_profit = revenue - cogs
        net_income = gross_profit - operating_expenses - other_expenses
        normalized.append(
            {
                "year": int(_num(source.get("year"))) if _num(source.get("year")) else None,
                "revenue": revenue,
                "cogs": cogs,
                "grossProfit": gross_profit,
                "operatingExpenses": operating_expenses,
                "netIncome": net_income,
            }
        )

    rows = []
    for key, label in metrics:
        values = [float(row[key]) for row in normalized]
        if not values:
            rows.append({"metric": label, "minimum": None, "maximum": None, "average": None, "spread": None})
            continue
        rows.append(
            {
                "metric": label,
                "minimum": min(values),
                "maximum": max(values),
                "average": sum(values) / len(values),
                "spread": max(values) - min(values),
            }
        )

    revenue_values = [float(row["revenue"]) for row in normalized]
    return {
        "summary": {
            "periodCount": len(normalized),
            "highestRevenue": max(revenue_values) if revenue_values else None,
            "lowestRevenue": min(revenue_values) if revenue_values else None,
        },
        "rows": rows,
        "warnings": [] if normalized else ["No P&L years were provided."],
    }


def _calculate_misc_expenses(inputs: dict[str, object], sheet_key: str) -> dict:
    expenses = inputs.get("expenses")
    if not isinstance(expenses, list):
        expenses = []

    rows = []
    total_budget = 0.0
    total_actual = 0.0
    for index, raw_expense in enumerate(expenses[:24]):
        expense = raw_expense if isinstance(raw_expense, dict) else {}
        budget = _num(expense.get("budget"))
        actual = _num(expense.get("actual"))
        variance = budget - actual
        total_budget += budget
        total_actual += actual
        rows.append(
            {
                "category": str(expense.get("category") or f"Expense {index + 1}"),
                "budget": budget,
                "actual": actual,
                "variance": variance,
                "variancePct": _pct(variance, budget),
                "favorable": actual <= budget,
            }
        )

    total_variance = total_budget - total_actual
    return {
        "summary": {
            "expenseType": "Direct" if "direct" in sheet_key else "Indirect",
            "totalBudget": total_budget,
            "totalActual": total_actual,
            "totalVariance": total_variance,
            "variancePct": _pct(total_variance, total_budget),
        },
        "rows": rows,
        "warnings": [] if rows else ["No expense rows were provided."],
    }


def _calculate_z_score_heavy_assets(inputs: dict[str, object]) -> dict:
    sales = _num(inputs.get("sales") or inputs.get("netSales"))
    current_assets = _num(inputs.get("currentAssets"))
    current_liabilities = _num(inputs.get("currentLiabilities"))
    total_assets = _num(inputs.get("totalAssets"))
    total_liabilities = _num(inputs.get("totalLiabilities"))
    working_capital = _num(inputs.get("workingCapital")) or current_assets - current_liabilities
    annual_income_from_operations = _num(inputs.get("annualIncomeFromOperations"))
    interest_expense = _num(inputs.get("interestExpense"))
    ebit = _num(inputs.get("ebit")) or annual_income_from_operations + interest_expense
    treasury_stock = _num(inputs.get("treasuryStock"))
    retained_earnings = _num(inputs.get("retainedEarnings")) + treasury_stock
    book_equity = _num(inputs.get("bookEquity")) or total_assets - total_liabilities

    factors = [
        ("Working Capital / Total Assets", 0.717, _safe_ratio(working_capital, total_assets)),
        ("Retained Earnings / Total Assets", 0.847, _safe_ratio(retained_earnings, total_assets)),
        ("EBIT / Total Assets", 3.107, _safe_ratio(ebit, total_assets)),
        ("Book Equity / Total Liabilities", 0.420, _safe_ratio(book_equity, total_liabilities)),
        ("Sales / Total Assets", 0.998, _safe_ratio(sales, total_assets)),
    ]
    rows = []
    z_score = 0.0
    for label, weight, ratio in factors:
        contribution = None if ratio is None else weight * ratio
        if contribution is not None:
            z_score += contribution
        rows.append({"factor": label, "weight": weight, "ratio": ratio, "contribution": contribution})

    if z_score >= 2.90:
        zone = "Safe"
    elif z_score >= 1.23:
        zone = "Grey"
    else:
        zone = "Distress"

    warnings = []
    if total_assets <= 0:
        warnings.append("Total assets must be greater than zero for most Z-score factors.")
    if total_liabilities <= 0:
        warnings.append("Total liabilities must be greater than zero for the equity/liability factor.")

    return {
        "summary": {"zScore": z_score, "zone": zone},
        "rows": rows,
        "warnings": warnings,
    }


def _calculate_activity_ratios(inputs: dict[str, object]) -> dict:
    months_in_period = _num(inputs.get("monthsInPeriod")) or 12.0
    days_in_period = months_in_period / 12.0 * 365.0
    annualization_factor = 12.0 / months_in_period if months_in_period else 1.0
    cash = _num(inputs.get("cash"))
    current_assets = _num(inputs.get("currentAssets"))
    inventory = _num(inputs.get("inventory"))
    current_liabilities = _num(inputs.get("currentLiabilities"))
    revenue = _num(inputs.get("revenue"))
    annualized_revenue = revenue * annualization_factor
    cogs = _num(inputs.get("cogs"))
    annualized_cogs = cogs * annualization_factor
    annual_material_cost = _num(inputs.get("annualMaterialCost")) or annualized_cogs
    accounts_receivable = _num(inputs.get("accountsReceivable"))
    accounts_payable = _num(inputs.get("accountsPayable"))
    fixed_assets = _num(inputs.get("fixedAssets"))
    total_assets = _num(inputs.get("totalAssets"))
    total_liabilities = _num(inputs.get("totalLiabilities"))
    equity = _num(inputs.get("equity")) or total_assets - total_liabilities
    daily_expenses = _num(inputs.get("dailyExpenses")) or (annualized_cogs / 365.0 if annualized_cogs else 0.0)
    working_capital = current_assets - current_liabilities

    ratio_rows = [
        ("Avg Payment Period", _safe_ratio(accounts_payable, daily_expenses), "activity"),
        ("A/R Turn", _safe_ratio(annualized_revenue, accounts_receivable), "activity"),
        (
            "Avg Collection Period",
            None if not _safe_ratio(annualized_revenue, accounts_receivable) else 365.0 / _safe_ratio(annualized_revenue, accounts_receivable),
            "activity",
        ),
        ("Annual Asset Turn", _safe_ratio(annualized_revenue, total_assets), "activity"),
        ("Fixed Asset Turn", _safe_ratio(annualized_revenue, fixed_assets), "activity"),
        ("Inventory Turn", _safe_ratio(annual_material_cost, inventory), "activity"),
        (
            "Inventory Average Age",
            None if not _safe_ratio(annual_material_cost, inventory) else days_in_period / _safe_ratio(annual_material_cost, inventory),
            "activity",
        ),
        ("Current Ratio", _safe_ratio(current_assets, current_liabilities), "liquidity"),
        ("Quick Ratio - Acid Test", _safe_ratio(current_assets - inventory, current_liabilities), "liquidity"),
        ("Working Capital", working_capital, "liquidity"),
        ("Working Capital Turn", _safe_ratio(annualized_revenue, working_capital), "liquidity"),
        ("Working Capital to Total Asset Ratio", _safe_ratio(working_capital, total_assets), "liquidity"),
        ("Liquid Asset Ratio", _safe_ratio(current_assets, total_assets), "liquidity"),
        ("Number Days of Sales in Cash", None if not annualized_revenue else cash / (annualized_revenue / 365.0), "liquidity"),
        ("Net Worth", equity, "solvency"),
        ("Current Debt to Net Worth", _safe_ratio(current_liabilities, equity), "solvency"),
        ("Debt Ratio", _safe_ratio(total_liabilities, total_assets), "leverage"),
        ("Equity Ratio", _safe_ratio(equity, total_assets), "leverage"),
    ]
    rows = [{"metric": label, "value": value, "category": category} for label, value, category in ratio_rows]

    warnings = []
    if current_liabilities <= 0:
        warnings.append("Current liabilities are zero; liquidity ratios may be unavailable.")
    if revenue <= 0:
        warnings.append("Revenue is zero; turnover ratios tied to sales may be unavailable.")

    return {
        "summary": {
            "currentRatio": rows[7]["value"],
            "quickRatio": rows[8]["value"],
            "assetTurnover": rows[3]["value"],
            "debtRatio": rows[16]["value"],
        },
        "rows": rows,
        "warnings": warnings,
    }


@app.post("/api/v1/analyst/calculate")
def calculate(payload: dict):
    try:
        validated = AnalystWizardInput.model_validate(payload)
        computed = run_projection(validated, WORKBOOK_CONTEXT)
        result = AnalystWizardResult.model_validate(
            {
                "companyName": validated.company_name,
                "industry": validated.industry,
                "horizonYears": validated.horizon_years,
                "summary": computed.summary,
                "projections": computed.projections,
                "engineVersion": ENGINE_VERSION,
                "workbook": {
                    "path": WORKBOOK_CONTEXT.path,
                    "sha256": WORKBOOK_CONTEXT.sha256,
                    "sizeBytes": WORKBOOK_CONTEXT.size_bytes,
                    "sheetCount": WORKBOOK_CONTEXT.sheet_count,
                    "sheetNamesSample": WORKBOOK_CONTEXT.sheet_names[:10],
                },
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/basic-client-info/calculate")
def calculate_basic_client_info(payload: dict):
    try:
        validated = BasicClientInfoInput.model_validate(payload)

        normalized = {
            "companyName": _normalize_text(validated.company_name),
            "industry": _normalize_text(validated.industry),
            "primaryContactName": _normalize_text(validated.primary_contact_name),
            "primaryContactEmail": _normalize_email(validated.primary_contact_email),
            "primaryContactPhone": _normalize_phone(validated.primary_contact_phone),
            "locationCity": _normalize_text(validated.location_city),
            "locationState": _normalize_text(validated.location_state),
            "notes": _normalize_text(validated.notes),
        }

        warnings: list[str] = []
        if not normalized["primaryContactName"]:
            warnings.append("Primary contact name is missing.")
        if not normalized["primaryContactEmail"]:
            warnings.append("Primary contact email is missing.")
        if not normalized["primaryContactPhone"]:
            warnings.append("Primary contact phone is missing.")

        location = "n/a"
        if normalized["locationCity"] and normalized["locationState"]:
            location = f"{normalized['locationCity']}, {normalized['locationState']}"
        elif normalized["locationCity"]:
            location = normalized["locationCity"]
        elif normalized["locationState"]:
            location = normalized["locationState"]

        summary_lines = [
            f"Company: {normalized['companyName'] or 'n/a'}",
            f"Industry: {normalized['industry'] or 'n/a'}",
            f"Primary Contact: {normalized['primaryContactName'] or 'n/a'}",
            f"Contact Email: {normalized['primaryContactEmail'] or 'n/a'}",
            f"Contact Phone: {normalized['primaryContactPhone'] or 'n/a'}",
            f"Location: {location}",
        ]
        if normalized["notes"]:
            summary_lines.append(f"Notes: {normalized['notes']}")

        result = BasicClientInfoResult.model_validate(
            {
                **normalized,
                "summaryBlock": "\n".join(summary_lines),
                "warnings": warnings,
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/breakeven/calculate")
def calculate_breakeven(payload: dict):
    try:
        validated = BreakevenInput.model_validate(payload)

        annual_revenue = float(validated.annual_revenue)
        cogs_amount = float(validated.cogs_amount)
        fixed_expenses = float(validated.fixed_expenses_amount)
        profit_amount = float(validated.profit_amount) if validated.profit_amount is not None else None
        labor_amount = float(validated.labor_amount or 0)
        indirect_costs = (
            float(validated.indirect_costs_amount) if validated.indirect_costs_amount is not None else None
        )
        general_admin_costs = (
            float(validated.general_administrative_costs_amount)
            if validated.general_administrative_costs_amount is not None
            else None
        )
        months_in_period = float(validated.months_in_period or 12)
        work_days = float(validated.work_days_per_year or 250)
        work_hours = float(validated.work_hours_per_day or 8)
        warnings: list[str] = []

        formula_basis = "legacy gross-margin contribution"
        other_costs_amount = None
        variable_costs_amount = None
        fixed_costs_amount = None
        net_profit_amount = None
        total_days_in_period = None
        breakeven_days = None
        targeted_work_days = None

        if indirect_costs is not None or general_admin_costs is not None:
            formula_basis = "BMS Analyst Program BREAKEVEN ANALYSIS"
            indirect_costs = indirect_costs or 0.0
            general_admin_costs = general_admin_costs if general_admin_costs is not None else fixed_expenses
            net_profit_amount = annual_revenue - cogs_amount - indirect_costs - general_admin_costs
            variable_costs_amount = cogs_amount + (indirect_costs / 2)
            fixed_costs_amount = general_admin_costs + (indirect_costs / 2)
            breakeven_denominator = fixed_costs_amount + net_profit_amount
            breakeven_percent = fixed_costs_amount / breakeven_denominator if breakeven_denominator > 0 else None
            breakeven_revenue = annual_revenue * breakeven_percent if breakeven_percent is not None else None
            total_days_in_period = (365 / 12) * months_in_period
            breakeven_days = total_days_in_period * breakeven_percent if breakeven_percent is not None else None
            targeted_work_days = 20.83 * months_in_period
            gross_margin_amount = annual_revenue - cogs_amount
            gross_margin_percent = (gross_margin_amount / annual_revenue * 100) if annual_revenue > 0 else 0.0
        elif profit_amount is not None:
            formula_basis = "BMS Breakeven Analysis Tool Office"
            gross_margin_amount = annual_revenue - cogs_amount
            gross_margin_percent = (gross_margin_amount / annual_revenue * 100) if annual_revenue > 0 else 0.0
            total_expenses = annual_revenue - profit_amount
            variable_costs_amount = cogs_amount + labor_amount
            other_costs_amount = total_expenses - fixed_expenses - variable_costs_amount
            half_other_costs = other_costs_amount / 2
            fixed_costs_amount = fixed_expenses + half_other_costs
            fixed_plus_profit = fixed_costs_amount + profit_amount
            breakeven_percent = fixed_costs_amount / fixed_plus_profit if fixed_plus_profit > 0 else None
            breakeven_revenue = annual_revenue * breakeven_percent if breakeven_percent is not None else None
            breakeven_days = 365 * breakeven_percent if breakeven_percent is not None else None
        else:
            gross_margin_amount = annual_revenue - cogs_amount
            gross_margin_percent = (gross_margin_amount / annual_revenue * 100) if annual_revenue > 0 else 0.0
            variable_costs_amount = cogs_amount
            fixed_costs_amount = fixed_expenses
            breakeven_revenue = None
            if gross_margin_amount <= 0 or gross_margin_percent <= 0:
                warnings.append(
                    "Gross margin is zero or negative. Breakeven cannot be computed until revenue exceeds COGS."
                )
            else:
                contribution_margin_ratio = gross_margin_percent / 100
                breakeven_revenue = fixed_expenses / contribution_margin_ratio

            breakeven_percent = None
            if breakeven_revenue is not None and annual_revenue > 0:
                breakeven_percent = breakeven_revenue / annual_revenue
            elif annual_revenue <= 0:
                warnings.append("Annual revenue is zero. Breakeven percent cannot be compared against current revenue.")

        if breakeven_percent is None:
            warnings.append("Breakeven percentage could not be computed. Verify profit and cost assumptions.")

        breakeven_percent_display = breakeven_percent * 100 if breakeven_percent is not None else None
        breakeven_monthly = (
            breakeven_revenue / months_in_period
            if breakeven_revenue is not None and months_in_period > 0
            else None
        )
        breakeven_daily = breakeven_revenue / work_days if breakeven_revenue is not None else None
        breakeven_weekly = breakeven_daily * 5 if breakeven_daily is not None else None
        breakeven_hourly = breakeven_daily / work_hours if breakeven_daily is not None else None

        result = BreakevenResult.model_validate(
            {
                "grossMarginAmount": gross_margin_amount,
                "grossMarginPercent": gross_margin_percent,
                "netProfitAmount": net_profit_amount,
                "variableCostsAmount": variable_costs_amount,
                "fixedCostsAmount": fixed_costs_amount,
                "otherCostsAmount": other_costs_amount,
                "breakevenRevenue": breakeven_revenue,
                "breakevenPercent": breakeven_percent_display,
                "breakevenMonthly": breakeven_monthly,
                "breakevenWeekly": breakeven_weekly,
                "breakevenDaily": breakeven_daily,
                "breakevenHourly": breakeven_hourly,
                "totalDaysInPeriod": total_days_in_period,
                "breakevenDays": breakeven_days,
                "targetedWorkDays": targeted_work_days,
                "formulaBasis": formula_basis,
                "notes": warnings,
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/working-capital/calculate")
def calculate_working_capital(payload: dict):
    try:
        validated = WorkingCapitalInput.model_validate(payload)

        annual_revenue = float(validated.annual_revenue)
        annual_cogs = float(validated.annual_cogs)
        dso = float(validated.days_sales_outstanding)
        dio = float(validated.days_inventory_on_hand)
        dpo = float(validated.days_payables_outstanding)

        ar_investment = (annual_revenue / 365.0) * dso
        inventory_investment = (annual_cogs / 365.0) * dio
        ap_financing = (annual_cogs / 365.0) * dpo
        net_working_capital = ar_investment + inventory_investment - ap_financing
        cash_conversion_cycle = dso + dio - dpo

        warnings: list[str] = []
        if annual_revenue <= 0:
            warnings.append("Annual revenue is zero. Working capital as a percent of revenue cannot be computed.")

        working_capital_percent_of_revenue = (
            (net_working_capital / annual_revenue) * 100 if annual_revenue > 0 else None
        )

        result = WorkingCapitalResult.model_validate(
            {
                "arInvestment": ar_investment,
                "inventoryInvestment": inventory_investment,
                "apFinancing": ap_financing,
                "netWorkingCapital": net_working_capital,
                "cashConversionCycle": cash_conversion_cycle,
                "workingCapitalPercentOfRevenue": working_capital_percent_of_revenue,
                "warnings": warnings,
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/current-financial-information/calculate")
def calculate_current_financial_information(payload: dict):
    try:
        validated = CurrentFinancialInformationInput.model_validate(payload)

        annual_revenue = float(validated.annual_revenue)
        annual_cogs = float(validated.annual_cogs)
        annual_fixed_expenses = float(validated.annual_fixed_expenses)
        dso = float(validated.days_sales_outstanding)
        dio = float(validated.days_inventory_on_hand)
        dpo = float(validated.days_payables_outstanding)
        work_days = float(validated.work_days_per_year)
        work_hours = float(validated.work_hours_per_day)

        gross_margin_amount = annual_revenue - annual_cogs
        gross_margin_percent = (gross_margin_amount / annual_revenue * 100) if annual_revenue > 0 else 0.0

        warnings: list[str] = []

        if annual_revenue <= 0:
            warnings.append("Annual revenue is zero. Margin percent and working capital intensity are less meaningful.")
        if annual_cogs > annual_revenue:
            warnings.append("Annual COGS exceeds annual revenue. Gross margin is negative.")

        breakeven_revenue = None
        contribution_margin_ratio = gross_margin_percent / 100
        if contribution_margin_ratio <= 0:
            warnings.append("Gross margin is zero or negative. Breakeven revenue cannot be computed.")
        else:
            breakeven_revenue = annual_fixed_expenses / contribution_margin_ratio

        ar_investment = (annual_revenue / 365.0) * dso
        inventory_investment = (annual_cogs / 365.0) * dio
        ap_financing = (annual_cogs / 365.0) * dpo
        net_working_capital = ar_investment + inventory_investment - ap_financing
        cash_conversion_cycle = dso + dio - dpo

        if cash_conversion_cycle < 0:
            warnings.append("Cash conversion cycle is negative. Verify DPO and cycle assumptions.")

        breakeven_daily = breakeven_revenue / work_days if breakeven_revenue is not None else None
        breakeven_weekly = breakeven_daily * 5 if breakeven_daily is not None else None
        breakeven_monthly = breakeven_revenue / 12 if breakeven_revenue is not None else None
        breakeven_hourly = breakeven_daily / work_hours if breakeven_daily is not None else None

        result = CurrentFinancialInformationResult.model_validate(
            {
                "grossMarginAmount": gross_margin_amount,
                "grossMarginPercent": gross_margin_percent,
                "breakevenRevenue": breakeven_revenue,
                "arInvestment": ar_investment,
                "inventoryInvestment": inventory_investment,
                "apFinancing": ap_financing,
                "netWorkingCapital": net_working_capital,
                "cashConversionCycle": cash_conversion_cycle,
                "breakevenDaily": breakeven_daily,
                "breakevenWeekly": breakeven_weekly,
                "breakevenMonthly": breakeven_monthly,
                "breakevenHourly": breakeven_hourly,
                "warnings": warnings,
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/five-year-projections/calculate")
def calculate_five_year_projections(payload: dict):
    try:
        validated = FiveYearProjectionsInput.model_validate(payload)

        base_year = int(validated.base_year)
        initial_revenue = float(validated.base_revenue)
        revenue_growth_rate = float(validated.revenue_growth_percent) / 100.0
        cogs_rate = float(validated.base_cogs_percent) / 100.0
        initial_fixed_expenses = float(validated.base_fixed_expenses)
        fixed_expense_growth_rate = float(validated.fixed_expense_growth_percent) / 100.0
        tax_rate = (
            None if validated.tax_rate_percent is None else float(validated.tax_rate_percent) / 100.0
        )

        warnings: list[str] = []
        if initial_revenue == 0:
            warnings.append("Base revenue is zero. Margin metrics and earnings may be less meaningful.")
        if tax_rate is None:
            warnings.append("Tax rate not provided. Taxes and net income were omitted.")

        years: list[dict] = []

        for offset in range(5):
            year = base_year + offset
            revenue = initial_revenue * ((1 + revenue_growth_rate) ** offset)
            cogs = revenue * cogs_rate
            gross_profit = revenue - cogs
            gross_margin_pct = (gross_profit / revenue * 100) if revenue > 0 else None

            fixed_expenses = initial_fixed_expenses * ((1 + fixed_expense_growth_rate) ** offset)
            ebitda = gross_profit - fixed_expenses
            ebitda_margin_pct = (ebitda / revenue * 100) if revenue > 0 else None

            taxes = None
            net_income = None
            if tax_rate is not None:
                taxes = max(0.0, ebitda * tax_rate)
                net_income = ebitda - taxes

            years.append(
                {
                    "year": year,
                    "revenue": revenue,
                    "cogs": cogs,
                    "grossProfit": gross_profit,
                    "grossMarginPct": gross_margin_pct,
                    "fixedExpenses": fixed_expenses,
                    "ebitda": ebitda,
                    "ebitdaMarginPct": ebitda_margin_pct,
                    "taxes": taxes,
                    "netIncome": net_income,
                }
            )

        if all((row.get("ebitda") or 0) < 0 for row in years):
            warnings.append("EBITDA is negative in every projected year. Review pricing, COGS, and fixed cost inputs.")
        if any((row.get("grossMarginPct") or 0) < 0 for row in years):
            warnings.append("Gross margin is negative in at least one projected year.")

        result = FiveYearProjectionsResult.model_validate(
            {
                "years": years,
                "warnings": warnings,
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/pl-comparisons/calculate")
def calculate_pl_comparisons(payload: dict):
    try:
        validated = PLComparisonsInput.model_validate(payload)

        sorted_years = sorted(validated.years, key=lambda row: row.year)
        per_year: list[dict] = []

        for row in sorted_years:
            revenue = float(row.revenue)
            cogs = float(row.cogs)
            operating_expenses = float(row.operating_expenses)
            other_expenses = float(row.other_expenses)

            gross_profit = revenue - cogs
            ebit = gross_profit - operating_expenses
            net_income = ebit - other_expenses
            gross_margin_pct = (gross_profit / revenue * 100) if revenue > 0 else None
            ebit_margin_pct = (ebit / revenue * 100) if revenue > 0 else None

            per_year.append(
                {
                    "year": row.year,
                    "revenue": revenue,
                    "cogs": cogs,
                    "operatingExpenses": operating_expenses,
                    "otherExpenses": other_expenses,
                    "grossProfit": gross_profit,
                    "grossMarginPct": gross_margin_pct,
                    "ebit": ebit,
                    "ebitMarginPct": ebit_margin_pct,
                    "netIncome": net_income,
                }
            )

        for index, current in enumerate(per_year):
            previous = per_year[index - 1] if index > 0 else None
            trend = {}
            for key in ["revenue", "grossProfit", "ebit", "netIncome"]:
                current_value = current.get(key)
                previous_value = previous.get(key) if previous else None
                if previous_value is None or previous_value == 0:
                    trend[f"{key}YoYPct"] = None
                else:
                    trend[f"{key}YoYPct"] = ((current_value - previous_value) / abs(previous_value)) * 100
            current["trend"] = trend

        result = {
            "years": per_year,
        }
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/balance-sheet-comparisons/calculate")
def calculate_balance_sheet_comparisons(payload: dict):
    try:
        validated = BalanceSheetComparisonsInput.model_validate(payload)

        sorted_years = sorted(validated.years, key=lambda row: row.year)
        per_year: list[dict] = []

        for row in sorted_years:
            cash = float(row.cash)
            ar = float(row.ar)
            inventory = float(row.inventory)
            other_current_assets = float(row.other_current_assets)
            fixed_assets = float(row.fixed_assets)
            other_assets = float(row.other_assets)
            ap = float(row.ap)
            other_current_liabilities = float(row.other_current_liabilities)
            long_term_debt = float(row.long_term_debt)
            other_liabilities = float(row.other_liabilities)
            equity = float(row.equity)

            total_current_assets = cash + ar + inventory + other_current_assets
            total_assets = total_current_assets + fixed_assets + other_assets
            total_current_liabilities = ap + other_current_liabilities
            total_liabilities = total_current_liabilities + long_term_debt + other_liabilities
            working_capital = total_current_assets - total_current_liabilities

            warnings: list[str] = []
            current_ratio = None
            if total_current_liabilities > 0:
                current_ratio = total_current_assets / total_current_liabilities
            else:
                warnings.append("Current liabilities are zero; current ratio is not defined.")

            debt_to_equity = None
            if equity > 0:
                debt_to_equity = total_liabilities / equity
            else:
                warnings.append("Equity is zero; debt-to-equity ratio is not defined.")

            balance_difference = total_assets - (total_liabilities + equity)
            if abs(balance_difference) > 0.01:
                warnings.append(
                    "Balance sheet does not balance (Assets != Liabilities + Equity)."
                )

            per_year.append(
                {
                    "year": row.year,
                    "totalCurrentAssets": total_current_assets,
                    "totalAssets": total_assets,
                    "totalCurrentLiabilities": total_current_liabilities,
                    "totalLiabilities": total_liabilities,
                    "workingCapital": working_capital,
                    "currentRatio": current_ratio,
                    "debtToEquity": debt_to_equity,
                    "checks": {
                        "balanceDifference": balance_difference,
                    },
                    "warnings": warnings,
                }
            )

        return {"ok": True, "result": {"years": per_year}}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/advanced-analyst-sheet/calculate")
def calculate_advanced_analyst_sheet(payload: dict):
    try:
        validated = AdvancedAnalystSheetInput.model_validate(payload)
        sheet_key = validated.sheet_key
        inputs = validated.inputs

        if sheet_key == "12-month-p-l-comparisons":
            computed = _calculate_monthly_pl(inputs)
        elif sheet_key == "p-l-comparisons-min-max":
            computed = _calculate_pl_min_max(inputs)
        elif sheet_key in {"misc-direct-expenses", "misc-indirect-expenses"}:
            computed = _calculate_misc_expenses(inputs, sheet_key)
        elif sheet_key == "z-score-private-heavy-assets":
            computed = _calculate_z_score_heavy_assets(inputs)
        elif sheet_key == "comparative-activity-ratios":
            computed = _calculate_activity_ratios(inputs)
        else:
            return JSONResponse(
                status_code=404,
                content={"ok": False, "error": f"Unsupported advanced analyst sheet: {sheet_key}"},
            )

        result = AdvancedAnalystSheetResult.model_validate(
            {
                "sheetKey": sheet_key,
                "summary": computed.get("summary", {}),
                "rows": computed.get("rows", []),
                "warnings": computed.get("warnings", []),
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/weekly-cash-flow/calculate")
def calculate_weekly_cash_flow(payload: dict):
    try:
        validated = WeeklyCashFlowInput.model_validate(payload)

        cash_balance = float(validated.beginning_cash)
        loc_limit = float(validated.line_of_credit_limit)
        loc_balance = min(float(validated.beginning_line_of_credit_balance), loc_limit)
        minimum_cash_reserve = float(validated.minimum_cash_reserve)

        total_receipts = 0.0
        total_disbursements = 0.0
        lowest_cash_balance = cash_balance
        peak_line_of_credit_use = loc_balance
        warnings: list[str] = []
        weeks: list[dict] = []

        if validated.beginning_line_of_credit_balance > loc_limit:
            warnings.append("Beginning line of credit balance was capped at the available credit limit.")

        for week in validated.weeks:
            beginning_cash = cash_balance
            receipts = float(week.cash_receipts)
            disbursements = (
                float(week.payroll)
                + float(week.materials)
                + float(week.rent_utilities)
                + float(week.loan_payments)
                + float(week.credit_card_payments)
                + float(week.other_disbursements)
            )
            total_receipts += receipts
            total_disbursements += disbursements

            cash_before_financing = cash_balance + receipts - disbursements
            loc_draw = 0.0
            loc_repayment = 0.0

            if cash_before_financing < minimum_cash_reserve:
                target_shortfall = minimum_cash_reserve - cash_before_financing
                available_credit = max(loc_limit - loc_balance, 0.0)
                loc_draw = min(target_shortfall, available_credit)
                loc_balance += loc_draw
                cash_balance = cash_before_financing + loc_draw
            else:
                surplus_after_reserve = cash_before_financing - minimum_cash_reserve
                loc_repayment = min(surplus_after_reserve, loc_balance)
                loc_balance -= loc_repayment
                cash_balance = cash_before_financing - loc_repayment

            reserve_shortfall = max(minimum_cash_reserve - cash_balance, 0.0)
            if reserve_shortfall > 0:
                warnings.append(
                    f"{week.week_label}: cash reserve shortfall remains after available credit."
                )

            lowest_cash_balance = min(lowest_cash_balance, cash_balance)
            peak_line_of_credit_use = max(peak_line_of_credit_use, loc_balance)

            weeks.append(
                {
                    "weekLabel": week.week_label,
                    "beginningCash": beginning_cash,
                    "cashReceipts": receipts,
                    "newSales": float(week.new_sales),
                    "totalDisbursements": disbursements,
                    "netCashFlow": receipts - disbursements,
                    "lineOfCreditDraw": loc_draw,
                    "lineOfCreditRepayment": loc_repayment,
                    "endingLineOfCreditBalance": loc_balance,
                    "endingCash": cash_balance,
                    "remainingLineOfCredit": max(loc_limit - loc_balance, 0.0),
                    "reserveShortfall": reserve_shortfall,
                }
            )

        if peak_line_of_credit_use > 0 and loc_limit > 0 and peak_line_of_credit_use / loc_limit >= 0.9:
            warnings.append("Line of credit usage reaches at least 90% of the available limit.")
        if total_disbursements > total_receipts and loc_limit == 0:
            warnings.append("Disbursements exceed receipts and no line of credit is available.")

        result = WeeklyCashFlowResult.model_validate(
            {
                "weeks": weeks,
                "totalReceipts": total_receipts,
                "totalDisbursements": total_disbursements,
                "endingCash": cash_balance,
                "endingLineOfCreditBalance": loc_balance,
                "lowestCashBalance": lowest_cash_balance,
                "peakLineOfCreditUse": peak_line_of_credit_use,
                "warnings": warnings,
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/flexible-budget-variance/calculate")
def calculate_flexible_budget_variance(payload: dict):
    try:
        validated = FlexibleBudgetVarianceInput.model_validate(payload)

        budget_revenue = float(validated.budget_revenue)
        actual_revenue = float(validated.actual_revenue)
        budget_cogs = budget_revenue * (float(validated.budget_cogs_percent) / 100.0)
        flexible_cogs = actual_revenue * (float(validated.budget_cogs_percent) / 100.0)
        budget_variable_expenses = budget_revenue * (float(validated.budget_variable_expense_percent) / 100.0)
        flexible_variable_expenses = actual_revenue * (
            float(validated.budget_variable_expense_percent) / 100.0
        )
        budget_fixed_expenses = float(validated.budget_fixed_expenses)
        actual_cogs = float(validated.actual_cogs)
        actual_variable_expenses = float(validated.actual_variable_expenses)
        actual_fixed_expenses = float(validated.actual_fixed_expenses)

        static_budget_operating_income = (
            budget_revenue - budget_cogs - budget_variable_expenses - budget_fixed_expenses
        )
        flexible_budget_operating_income = (
            actual_revenue - flexible_cogs - flexible_variable_expenses - budget_fixed_expenses
        )
        actual_operating_income = (
            actual_revenue - actual_cogs - actual_variable_expenses - actual_fixed_expenses
        )

        def variance_percent(variance: float, baseline: float) -> float | None:
            return (variance / abs(baseline) * 100.0) if baseline else None

        rows = [
            {
                "lineItem": "Revenue",
                "staticBudget": budget_revenue,
                "flexibleBudget": actual_revenue,
                "actual": actual_revenue,
                "variance": actual_revenue - budget_revenue,
                "variancePercent": variance_percent(actual_revenue - budget_revenue, budget_revenue),
                "favorable": actual_revenue >= budget_revenue,
            },
            {
                "lineItem": "COGS",
                "staticBudget": budget_cogs,
                "flexibleBudget": flexible_cogs,
                "actual": actual_cogs,
                "variance": flexible_cogs - actual_cogs,
                "variancePercent": variance_percent(flexible_cogs - actual_cogs, flexible_cogs),
                "favorable": actual_cogs <= flexible_cogs,
            },
            {
                "lineItem": "Variable Operating Expenses",
                "staticBudget": budget_variable_expenses,
                "flexibleBudget": flexible_variable_expenses,
                "actual": actual_variable_expenses,
                "variance": flexible_variable_expenses - actual_variable_expenses,
                "variancePercent": variance_percent(
                    flexible_variable_expenses - actual_variable_expenses,
                    flexible_variable_expenses,
                ),
                "favorable": actual_variable_expenses <= flexible_variable_expenses,
            },
            {
                "lineItem": "Fixed Expenses",
                "staticBudget": budget_fixed_expenses,
                "flexibleBudget": budget_fixed_expenses,
                "actual": actual_fixed_expenses,
                "variance": budget_fixed_expenses - actual_fixed_expenses,
                "variancePercent": variance_percent(
                    budget_fixed_expenses - actual_fixed_expenses,
                    budget_fixed_expenses,
                ),
                "favorable": actual_fixed_expenses <= budget_fixed_expenses,
            },
            {
                "lineItem": "Operating Income",
                "staticBudget": static_budget_operating_income,
                "flexibleBudget": flexible_budget_operating_income,
                "actual": actual_operating_income,
                "variance": actual_operating_income - flexible_budget_operating_income,
                "variancePercent": variance_percent(
                    actual_operating_income - flexible_budget_operating_income,
                    flexible_budget_operating_income,
                ),
                "favorable": actual_operating_income >= flexible_budget_operating_income,
            },
        ]

        warnings: list[str] = []
        if actual_revenue < budget_revenue * 0.9:
            warnings.append("Actual revenue is more than 10% below the static budget.")
        if actual_operating_income < 0:
            warnings.append("Actual operating income is negative for this period.")

        operating_income_variance = actual_operating_income - flexible_budget_operating_income
        result = FlexibleBudgetVarianceResult.model_validate(
            {
                "periodLabel": validated.period_label,
                "rows": rows,
                "salesVolumeVariance": actual_revenue - budget_revenue,
                "flexibleBudgetOperatingIncome": flexible_budget_operating_income,
                "actualOperatingIncome": actual_operating_income,
                "operatingIncomeVariance": operating_income_variance,
                "operatingIncomeVariancePercent": variance_percent(
                    operating_income_variance,
                    flexible_budget_operating_income,
                ),
                "warnings": warnings,
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/workbook-ports/calculate")
def calculate_workbook_port(payload: dict):
    try:
        validated = WorkbookPortInput.model_validate(payload)
        workbook_key = validated.workbook_key
        inputs = validated.inputs

        try:
            computed = run_workbook_port(workbook_key, inputs)
        except KeyError:
            return JSONResponse(
                status_code=404,
                content={"ok": False, "error": f"Unsupported workbook port: {workbook_key}"},
            )

        result = WorkbookPortResult.model_validate(
            {
                "workbookKey": workbook_key,
                "summary": computed.get("summary", {}),
                "rows": computed.get("rows", []),
                "warnings": computed.get("warnings", []),
            }
        )
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})
