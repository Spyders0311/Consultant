import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .calculation_service import run_projection
from .models import AnalystWizardInput, AnalystWizardResult, BreakevenInput, BreakevenResult
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
