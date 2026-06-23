import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .analyst.breakeven import calculate_analyst_breakeven
from .analyst.engagement_report import build_engagement_report
from .analyst.expense_lines import calculate_expense_lines
from .analyst.four_year_history import generate_four_year_history
from .analyst.matrix_scoring import score_matrix_responses
from .analyst.pl_analysis import calculate_pl_analysis
from .analyst.pl_rollup import normalize_pl_year
from .analyst.projections import calculate_five_year_projections
from .analyst.financial_ratios import calculate_financial_ratios
from .analyst.monthly_analysis import calculate_monthly_analysis
from .analyst.roi_analysis import calculate_roi_analysis
from .analyst.twelve_month import calculate_twelve_month_pl
from .analyst.valuation import calculate_business_valuation
from .analyst.wc_scenarios import calculate_working_capital_with_scenarios
from .calculation_service import run_projection
from .models import (
    AnalystWizardInput,
    AnalystWizardResult,
    BalanceSheetComparisonsInput,
    BasicClientInfoInput,
    BasicClientInfoResult,
    BreakevenInput,
    BreakevenResult,
    CurrentFinancialInformationInput,
    CurrentFinancialInformationResult,
    FinancialRatiosInput,
    FourYearHistoryInput,
    FiveYearProjectionsInput,
    FiveYearProjectionsResult,
    EngagementReportInput,
    MatrixScoringInput,
    MiscExpenseInput,
    MonthlyAnalysisInput,
    PLAnalysisInput,
    PLComparisonsInput,
    ROIAnalysisInput,
    TwelveMonthPLInput,
    ValuationInput,
    WorkingCapitalInput,
    WorkingCapitalResult,
    WorkbookPortInput,
    WorkbookPortResult,
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
        computed = calculate_analyst_breakeven(validated.model_dump(by_alias=True))
        result = BreakevenResult.model_validate(computed)
        return {"ok": True, "result": result.model_dump(by_alias=True)}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/working-capital/calculate")
def calculate_working_capital(payload: dict):
    try:
        validated = WorkingCapitalInput.model_validate(payload)
        computed = calculate_working_capital_with_scenarios(validated.model_dump(by_alias=True))
        result = WorkingCapitalResult.model_validate(computed)
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

        breakeven_payload = {
            "annualRevenue": float(validated.annual_revenue),
            "cogsAmount": float(validated.annual_cogs),
            "fixedExpensesAmount": float(validated.annual_fixed_expenses),
            "laborAmount": float(validated.labor_amount),
            "indirectCostsAmount": float(validated.indirect_costs_amount),
            "generalAdministrativeCostsAmount": float(validated.general_administrative_costs_amount),
            "profitAmount": validated.profit_amount,
            "workDaysPerYear": float(validated.work_days_per_year),
            "workHoursPerDay": float(validated.work_hours_per_day),
        }
        breakeven = calculate_analyst_breakeven(breakeven_payload)
        breakeven_revenue = breakeven.get("breakevenRevenue")

        ar_investment = (annual_revenue / 365.0) * dso
        inventory_investment = (annual_cogs / 365.0) * dio
        ap_financing = (annual_cogs / 365.0) * dpo
        net_working_capital = ar_investment + inventory_investment - ap_financing
        cash_conversion_cycle = dso + dio - dpo

        if cash_conversion_cycle < 0:
            warnings.append("Cash conversion cycle is negative. Verify DPO and cycle assumptions.")

        breakeven_daily = breakeven.get("breakevenDaily")
        breakeven_weekly = breakeven.get("breakevenWeekly")
        breakeven_monthly = breakeven.get("breakevenMonthly")
        breakeven_hourly = breakeven.get("breakevenHourly")
        warnings.extend(breakeven.get("notes") or [])

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
def calculate_five_year_projections_route(payload: dict):
    try:
        validated = FiveYearProjectionsInput.model_validate(payload)
        computed = calculate_five_year_projections(validated.model_dump(by_alias=True))
        result = FiveYearProjectionsResult.model_validate(computed)
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
            normalized = normalize_pl_year(row.model_dump(by_alias=True))
            revenue = float(normalized["revenue"])
            cogs = float(normalized["cogs"])
            operating_expenses = float(normalized["operatingExpenses"])
            other_expenses = float(normalized["otherExpenses"])

            gross_profit = revenue - cogs
            ebit = gross_profit - operating_expenses
            net_income = ebit - other_expenses
            gross_margin_pct = (gross_profit / revenue * 100) if revenue > 0 else None
            ebit_margin_pct = (ebit / revenue * 100) if revenue > 0 else None

            per_year.append(
                {
                    "year": normalized["year"],
                    "revenue": revenue,
                    "cogs": cogs,
                    "operatingExpenses": operating_expenses,
                    "otherExpenses": other_expenses,
                    "lineItems": normalized.get("lineItems") or [],
                    "laborAmount": normalized.get("laborAmount"),
                    "indirectCostsAmount": normalized.get("indirectCostsAmount"),
                    "generalAdministrativeCostsAmount": normalized.get("generalAdministrativeCostsAmount"),
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
            intangible_assets = float(row.intangible_assets)
            fixed_assets = float(row.fixed_assets)
            other_assets = float(row.other_assets)
            ap = float(row.ap)
            current_portion_ltd = float(row.current_portion_ltd)
            other_current_liabilities = float(row.other_current_liabilities)
            long_term_debt = float(row.long_term_debt)
            other_liabilities = float(row.other_liabilities)
            retained_earnings = row.retained_earnings
            equity = float(row.equity)

            total_current_assets = cash + ar + inventory + other_current_assets
            total_assets = total_current_assets + fixed_assets + other_assets + intangible_assets
            total_current_liabilities = ap + current_portion_ltd + other_current_liabilities
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

            if retained_earnings is not None and retained_earnings > equity + 0.01:
                warnings.append("Retained earnings exceeds total equity. Verify equity allocation.")

            per_year.append(
                {
                    "year": row.year,
                    "intangibleAssets": intangible_assets,
                    "currentPortionLtd": current_portion_ltd,
                    "retainedEarnings": retained_earnings,
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


@app.post("/api/v1/worksheets/misc-direct-expenses/calculate")
def calculate_misc_direct_expenses(payload: dict):
    try:
        validated = MiscExpenseInput.model_validate(payload)
        lines = [line.model_dump(by_alias=True) for line in validated.lines]
        result = calculate_expense_lines(lines, "direct")
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/misc-indirect-expenses/calculate")
def calculate_misc_indirect_expenses(payload: dict):
    try:
        validated = MiscExpenseInput.model_validate(payload)
        lines = [line.model_dump(by_alias=True) for line in validated.lines]
        result = calculate_expense_lines(lines, "indirect")
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/twelve-month-analysis/calculate")
def calculate_twelve_month_analysis(payload: dict):
    try:
        validated = MonthlyAnalysisInput.model_validate(payload)
        months = [month.model_dump(by_alias=True) for month in validated.months]
        result = calculate_monthly_analysis(
            {
                "year": validated.year,
                "analysisType": validated.analysis_type,
                "months": months,
            }
        )
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/twelve-month-pl-comparisons/calculate")
def calculate_twelve_month_pl_comparisons(payload: dict):
    try:
        validated = TwelveMonthPLInput.model_validate(payload)
        months = [month.model_dump(by_alias=True) for month in validated.months]
        result = calculate_twelve_month_pl({"year": validated.year, "months": months})
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/financial-ratios/calculate")
def calculate_financial_ratios_route(payload: dict):
    try:
        validated = FinancialRatiosInput.model_validate(payload)
        pl_year = validated.pl_year.model_dump(by_alias=True) if validated.pl_year else {}
        bs_year = validated.bs_year.model_dump(by_alias=True) if validated.bs_year else {}
        result = calculate_financial_ratios(
            {
                "plYear": pl_year,
                "bsYear": bs_year,
                "bsComputed": validated.bs_computed,
            }
        )
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/four-year-history/generate")
def generate_four_year_history_route(payload: dict):
    try:
        validated = FourYearHistoryInput.model_validate(payload)
        result = generate_four_year_history(validated.model_dump(by_alias=True))
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/pl-analysis/calculate")
def calculate_pl_analysis_route(payload: dict):
    try:
        validated = PLAnalysisInput.model_validate(payload)
        result = calculate_pl_analysis(validated.model_dump(by_alias=True))
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/roi-analysis/calculate")
def calculate_roi_analysis_route(payload: dict):
    try:
        validated = ROIAnalysisInput.model_validate(payload)
        result = calculate_roi_analysis(validated.model_dump(by_alias=True))
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/valuation/calculate")
def calculate_valuation_route(payload: dict):
    try:
        validated = ValuationInput.model_validate(payload)
        result = calculate_business_valuation(validated.model_dump(by_alias=True))
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/engagement-report/build")
def build_engagement_report_route(payload: dict):
    try:
        validated = EngagementReportInput.model_validate(payload)
        result = build_engagement_report(validated.model_dump(by_alias=True))
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/matrix-scoring/calculate")
def calculate_matrix_scoring_route(payload: dict):
    try:
        validated = MatrixScoringInput.model_validate(payload)
        result = score_matrix_responses(validated.model_dump(by_alias=True))
        return {"ok": True, "result": result}
    except ValidationError as error:
        return JSONResponse(status_code=422, content={"ok": False, "error": error.errors()})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@app.post("/api/v1/worksheets/workbook-ports/calculate")
def calculate_workbook_port(payload: dict):
    try:
        validated = WorkbookPortInput.model_validate(payload)
        try:
            computed = run_workbook_port(validated.workbook_key, validated.inputs)
        except KeyError:
            return JSONResponse(
                status_code=404,
                content={"ok": False, "error": f"Unsupported workbook port: {validated.workbook_key}"},
            )

        result = WorkbookPortResult.model_validate(
            {
                "workbookKey": validated.workbook_key,
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
