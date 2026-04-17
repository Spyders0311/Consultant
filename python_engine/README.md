# Python Analyst Engine

FastAPI calculation service for the BMS "TurboTax" analyst wizard.

## Purpose

- Receives wizard inputs from the Next.js frontend.
- Performs protected financial projection math server-side.
- Loads workbook provenance from:
  `/Users/teneightvideo/.openclaw/media/inbound/b0f6af9c-67d5-4d08-ae0c-26dee3f89c8d`
  and returns a file fingerprint in results for traceability.

## Run locally

```bash
cd python_engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Environment variables

- `ANALYST_SPREADSHEET_PATH`: optional override of workbook path.
- `PYTHON_ENGINE_ALLOWED_ORIGINS`: comma-separated CORS origins.

## API

- `GET /health`
- `POST /api/v1/analyst/calculate`
