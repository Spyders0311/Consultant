import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .calculation_service import run_projection
from .models import (
    AnalystWizardInput,
    AnalystWizardResult,
    BalanceSheetComparisonsInput,
    BasicClientInfoInput,
    BasicClientInfoResult,
    BreakevenInput,
    BreakevenResult,
    PLComparisonsInput,
    WorkingCapitalInput,
    WorkingCapitalResult,
)
from .spreadsheet_context import WorkbookContext, load_workbook_context

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

        annual_revenue = float(validated.annual_revenue)
        cogs_amount = float(validated.cogs_amount)
        fixed_expenses = float(validated.fixed_expenses_amount)
        work_days = float(validated.work_days_per_year or 250)
        work_hours = float(validated.work_hours_per_day or 8)

        gross_margin_amount = annual_revenue - cogs_amount
        gross_margin_percent = (gross_margin_amount / annual_revenue * 100) if annual_revenue > 0 else 0.0
        warnings: list[str] = []

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
            breakeven_percent = (breakeven_revenue / annual_revenue) * 100
        elif annual_revenue <= 0:
            warnings.append("Annual revenue is zero. Breakeven percent cannot be compared against current revenue.")

        breakeven_monthly = breakeven_revenue / 12 if breakeven_revenue is not None else None
        breakeven_daily = breakeven_revenue / work_days if breakeven_revenue is not None else None
        breakeven_weekly = breakeven_daily * 5 if breakeven_daily is not None else None
        breakeven_hourly = breakeven_daily / work_hours if breakeven_daily is not None else None

        result = BreakevenResult.model_validate(
            {
                "grossMarginAmount": gross_margin_amount,
                "grossMarginPercent": gross_margin_percent,
                "breakevenRevenue": breakeven_revenue,
                "breakevenPercent": breakeven_percent,
                "breakevenMonthly": breakeven_monthly,
                "breakevenWeekly": breakeven_weekly,
                "breakevenDaily": breakeven_daily,
                "breakevenHourly": breakeven_hourly,
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
