# Workbook manifests

This folder stores generated workbook manifests that describe workbook structure in a stable, machine-readable format.

## Regenerate the manifest

Run:

```bash
python python_engine/tools/extract_workbook_manifest.py \
  --input /path/to/workbook.xlsx \
  --output knowledge/workbooks/analyst_program_manifest.json
```

## Regenerate the source catalog

Run:

```bash
npm run catalog
```

This rebuilds `canonical_sources.json` from `spreadsheets_folder_audit.json` and `documents_folder_audit.json`.
The canonical catalog collapses exact duplicates by hash, assigns a business area, marks legal/commercial/confidential
sources as review-required, and records workbook porting metadata for the website resource library.

## Inspect critical workbooks

Run:

```bash
npm run inspect:critical-workbooks
```

This rebuilds `critical_workbooks_analysis.json` from `Spreadsheets/BMS Breakeven Analysis Tool Office (1).xls`
and `Spreadsheets/BMS Analyst Program (1).xlsm`, including sheet formulas, named ranges, and VBA procedure summaries.

## How we use this

- Parse the workbook once and commit the manifest so worksheet order and named ranges are versioned.
- Implement one worksheet/module at a time against the manifest instead of repeatedly opening the Excel file.
- Use `sheets` and `definedNames` as the contract for module wiring, dependency mapping, and regression checks.
- Rebuild important workbook behavior in server-side app workflows with saved client runs; source workbooks stay as
  provenance and regression fixtures.
