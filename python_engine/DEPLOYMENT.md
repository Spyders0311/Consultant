# Python Engine Deployment (Render + Vercel)

1. Create a Render blueprint deployment from this repository (it will use `render.yaml`).
2. After the Render deploy finishes, copy the Render service URL.
3. In your Vercel project environment variables, set `PYTHON_ENGINE_URL` to that Render URL.
4. Redeploy the Vercel project so the new `PYTHON_ENGINE_URL` is active.
5. Optional: set `PYTHON_ENGINE_ALLOWED_ORIGINS` on Render to your Vercel domain.

## Notes

- `ANALYST_SPREADSHEET_PATH` is optional. If it is unset or points to a missing file, the engine starts with a fallback workbook context (`sha256="unavailable"`, `sizeBytes=0`, empty sheet names).
