# Workbook manifests

This folder stores generated workbook manifests that describe workbook structure in a stable, machine-readable format.

## Regenerate the manifest

Run:

```bash
python python_engine/tools/extract_workbook_manifest.py \
  --input /path/to/workbook.xlsx \
  --output knowledge/workbooks/analyst_program_manifest.json
```

## How we use this

- Parse the workbook once and commit the manifest so worksheet order and named ranges are versioned.
- Implement one worksheet/module at a time against the manifest instead of repeatedly opening the Excel file.
- Use `sheets` and `definedNames` as the contract for module wiring, dependency mapping, and regression checks.
