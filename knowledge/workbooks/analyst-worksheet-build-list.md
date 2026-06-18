# Analyst Worksheet Field Coverage — Build List

Last updated: 2026-06-09 — **implemented on branch**

## Implementation status

| Item | Status |
|---|---|
| P0.1 Basic Client Info prefill | Done |
| P0.2 5-year prefill from client | Done |
| P0.3 CFI pull from worksheets | Done |
| P0.4 Client profile columns | Done (`20260611120000_extend_clients_profile.sql`) |
| P1 Full breakeven cost stack | Done |
| P1.3 Shared breakeven in CFI | Done |
| P2.1 P&L line-item rollup (API) | Done |
| P2.1b P&L line-item editor UI | Done (`PLLineItemsEditor`, buckets/line-items toggle) |
| P2.2 MISC DIRECT EXPENSES wizard | Done |
| P2.3 MISC INDIRECT EXPENSES wizard | Done |
| P2.4 4-year history generate | Done |
| P3.1 Financial snapshot API | Done |
| P3.2 Snapshot on worksheet save | Done (client-side patch) |
| P3.3 F-1000 → P&L import | Done |
| P4 Rich 5-year projections | Done |
| P5 12-month P&L wizard | Done |
| P5.2 12-month analysis wizards (payroll, labor, material, opex) | Done |
| P6.1 BS sub-lines (intangibles, CPLTD, retained earnings) | Done |
| P6.2 WC growth scenarios | Done |
| P7.1 Field manifest + CI check | Done (`sheet_field_manifest.json`, `npm run check:fields`) |
| P7.2 Golden tests | Done (`test_analyst_worksheets.py`, 29 tests) |
| P7.3 Incorporation status script | Done (`npm run generate:incorporation-status`) |
| P3.2 Snapshot read prefill | Done (`useFinancialSnapshotPrefill`) |
| P1.2 Full feeder → breakeven pull | Done (`pullBreakevenFromAllSources`) |
| P5.3 Monthly → annual P&L push | Done (`pushFeederToPL`) |
| P5.4 4-year-history-auto wizard | Done (`FourYearHistoryWizard`) |
| Derived ratio worksheets (8 tabs) | Done (`DerivedRatiosWizard`) |
| Workbook port bridges | Done (`PortBridgePanel`, `portBridges.js`) |
| 12-month P&L line-item mode | Done |
| GitHub CI workflow | Done (`.github/workflows/ci.yml`) |

**Apply migrations:** `20260611120000`, `20260611120100`, `20260611120200`, `20260611120300`

**CI field check:** `pip install -r python_engine/requirements.txt` then `npm run check:fields`

---
 capture **all variables** the BMS Analyst Program expects across the seven priority worksheets — not spreadsheet UI parity.

Reference: gap analysis vs `python_engine/app/models.py`, wizard components, `clients` table, and feeder sheets in `analyst_program_manifest.json`.

---

## Priority legend

| Priority | Meaning |
|---|---|
| P0 | Unblocks other work or fixes data already in the system but not wired |
| P1 | Closes the largest variable gaps on core worksheets |
| P2 | Feeder sheets and line-item detail needed for Excel-equivalent inputs |
| P3 | Cross-sheet automation, richer projections, polish |

---

## P0 — Wire existing data (low effort, high leverage)

### P0.1 Fix Basic Client Info prefill from client record
- **Problem:** `page.js` loads `company_name` / `industry` from `clients`, but `BasicClientInfoWizard.normalizePrefill()` ignores them.
- **Scope:** Apply `initialClientInfo` to form defaults; optionally write back contact fields to `clients` on save (new columns or JSON `profile` column).
- **Touches:** `components/BasicClientInfoWizard.js`, optionally `supabase/migrations/*_extend_clients_profile.sql`
- **Acceptance:** Opening Basic Client Info for a client shows company + industry without re-entry.

### P0.2 Pull client baseline into 5 Year Projections
- **Problem:** `clients` table already stores revenue, COGS %, fixed expense buckets, growth %, tax rate — 5-year wizard does not use them.
- **Scope:** Prefill `FiveYearProjectionsWizard` from `clients` row; map `fixed_payroll + fixed_rent_utilities + fixed_other` → `baseFixedExpenses` (or split later in P3).
- **Touches:** `app/workspace/.../page.js`, `components/FiveYearProjectionsWizard.js`
- **Acceptance:** New projection run starts from client onboarding assumptions.

### P0.3 Pull linked runs into Current Financial Information
- **Problem:** Working Capital and Breakeven already pull from P&L / BS; Current Financial Information has no pull.
- **Scope:** Add "Pull from saved worksheets" button; merge latest P&L + BS + optional Breakeven run into form.
- **Touches:** `components/CurrentFinancialInformationWizard.js`
- **Acceptance:** One-click populate from prior runs for the same client.

### P0.4 Extend clients table for contact / location (optional with P0.1)
- **Problem:** Contact and location exist only in `client_basic_client_info_runs`, not on the client record.
- **Scope:** Add `primary_contact_name`, `primary_contact_email`, `primary_contact_phone`, `location_city`, `location_state`, `notes` to `clients` (or `profile jsonb`).
- **Touches:** `supabase/migrations`, `lib/clients/globalColumns.js`, Basic Client Info save path
- **Acceptance:** Contact data persists on client and flows into Basic Client Info + reports.

---

## P1 — Breakeven variable completeness (largest single gap)

### P1.1 Expand Breakeven analyst wizard inputs
- **Problem:** Excel breakeven uses labor, indirect (L3), G&A (L4), profit, and period length; app uses revenue + COGS + single fixed bucket.
- **Scope:** Extend `BreakevenInput` / `BreakevenResult` and `BreakevenWizard` with:
  - `laborAmount` (direct labor)
  - `indirectCostsAmount`
  - `generalAdministrativeCostsAmount`
  - `profitAmount` (for office-tool path)
  - `monthsInPeriod` (default 12)
  - Toggle or auto-select: **contribution margin** vs **office-tool** formula (reuse `breakeven_core.office_tool_breakeven`)
- **Touches:** `python_engine/app/models.py`, `python_engine/app/main.py`, `components/BreakevenWizard.js`, `lib/server/pdf.js`, tests
- **Depends on:** None (logic exists in `workbook_ports/breakeven_core.py`)
- **Acceptance:** Same inputs as F-100B / Analyst Program breakeven produce matching breakeven revenue within rounding.

### P1.2 Breakeven pull from P&L with expense buckets
- **Problem:** Pull maps `operatingExpenses + otherExpenses` → single fixed bucket; cannot map labor vs indirect.
- **Scope:** After P2.1 (P&L line items) or interim mapping rules from aggregated P&L fields.
- **Depends on:** P1.1, ideally P2.1
- **Acceptance:** Pull populates all breakeven cost layers when source data exists.

### P1.3 Align Current Financial Information breakeven math with P1.1
- **Problem:** CFI uses simplified gross-margin breakeven only.
- **Scope:** Share breakeven calculation module between `/breakeven/calculate` and `/current-financial-information/calculate`.
- **Touches:** `python_engine/app/main.py` (extract helper), `CurrentFinancialInformationWizard.js` if new inputs added
- **Acceptance:** CFI and Breakeven wizards return consistent breakeven for identical inputs.

---

## P2 — P&L detail and feeder sheets (variable sources)

### P2.1 P&L Comparisons — optional line-item mode
- **Problem:** Excel uses many categories from Master Data Entry; app has 4 buckets × 4 years only.
- **Scope (MVP):** Add optional `lineItems[]` per year: `{ category, description, amount }` (mirror `f-1000-pl` categories); roll up to revenue / COGS / operating / other for backward compatibility.
- **Scope (full):** Replace bucket grid with categorized lines + auto-rollup.
- **Touches:** `PLComparisonsInput` model, `PLComparisonsWizard.js`, calculate route, PDF, migration if schema changes
- **Depends on:** None for MVP; reuse category enum from `f-1000-pl`
- **Acceptance:** User can enter F-1000-style lines; summary buckets and YoY trends still compute.

### P2.2 MISC DIRECT EXPENSES wizard
- **Problem:** Feeder sheet not in app; supplies direct cost detail for breakeven and P&L.
- **Scope:** New worksheet `misc-direct-expenses` with categorized direct expense lines, annual total, link to client runs table.
- **Touches:** New wizard, API routes, Python calculate, Supabase migration, `page.js` routing, `worksheet_catalog.json` priority
- **Acceptance:** Saved run exposes totals mappable to P&L COGS sub-components and breakeven labor/material.

### P2.3 MISC INDIRECT EXPENSES wizard
- **Problem:** Feeder sheet not in app; supplies indirect / G&A for breakeven.
- **Scope:** Same pattern as P2.2 for indirect expense categories.
- **Depends on:** P2.2 (shared expense-line component)
- **Acceptance:** Saved run maps to breakeven `indirectCostsAmount` and `generalAdministrativeCostsAmount`.

### P2.4 4 YEAR HISTORY (Auto) — import / compute layer
- **Problem:** Excel auto-builds 4-year grids from Master Data Entry; app requires manual P&L + BS entry.
- **Scope:** Service that builds 4-year P&L + BS draft from: client record + misc direct/indirect runs + optional uploaded trial balance CSV.
- **Depends on:** P2.1–P2.3 or client onboarding fields
- **Acceptance:** "Generate 4-year history" prefills P&L Comparisons and Balance Sheet Comparisons grids.

---

## P3 — Cross-worksheet data graph

### P3.1 Central client financial snapshot (optional architecture)
- **Problem:** Data scattered across `clients`, seven run tables, and 22 workbook port tables.
- **Scope:** `client_financial_snapshot` view or materialized JSON updated on each run save; documents provenance per field.
- **Touches:** Supabase view or edge function, shared `lib/worksheets/prefill.js`
- **Acceptance:** Any wizard can query one API for "latest known value" of revenue, COGS, DSO, etc.

### P3.2 Auto-push on save hooks
- **Problem:** Pull buttons are manual only.
- **Scope:** When P&L or BS run saves, offer to refresh dependent worksheets (WC, Breakeven, CFI) or auto-update snapshot.
- **Depends on:** P3.1 recommended
- **Acceptance:** Saving P&L updates snapshot; WC wizard shows stale-field indicators when source run is newer.

### P3.3 Link f-1000-pl workbook port to analyst P&L
- **Problem:** Detailed P&L exists as port but not connected to `p-l-comparisons`.
- **Scope:** "Import from F-1000 run" or shared `plLines` storage.
- **Depends on:** P2.1
- **Acceptance:** F-1000 port output rolls into P&L Comparisons year column.

---

## P4 — 5 Year Projections richness

### P4.1 Split fixed expenses in projections
- **Problem:** Single `baseFixedExpenses` vs client’s payroll / rent / other split.
- **Scope:** Extend `FiveYearProjectionsInput` with optional `fixedPayroll`, `fixedRentUtilities`, `fixedOther` + growth rates (or single growth on total).
- **Depends on:** P0.2
- **Acceptance:** Projections match client onboarding structure.

### P4.2 Market / valuation assumptions
- **Problem:** `clients` has market growth, inflation, discount rate; 5-year wizard omits them.
- **Scope:** Add optional market block; compute NPV / enterprise value summary (reuse `AnalystWizardInput` logic from `guided-intake.js`).
- **Depends on:** P0.2
- **Acceptance:** 5-year output includes EV/NPV when discount rate provided.

### P4.3 Configurable horizon
- **Problem:** Wizard hardcodes 5 years; client has `horizon_years`.
- **Scope:** Use `horizon_years` from client (3–10); rename UI label if not always 5.
- **Touches:** `FiveYearProjectionsInput`, wizard copy, PDF title
- **Acceptance:** Client with `horizon_years: 7` gets 7 projection rows.

---

## P5 — Monthly / 12-month analysis family

### P5.1 12 MONTH P&L COMPARISONS
- **Scope:** 12 monthly columns × P&L buckets (or line items from P2.1); annual rollup.
- **Effort:** Large
- **Depends on:** P2.1

### P5.2 12 MONTH ANALYSIS sheets (payroll, direct labor, operating exp, material)
- **Scope:** Four feeder wizards or one tabbed wizard with shared month grid component.
- **Depends on:** P5.1 patterns
- **Acceptance:** Monthly detail available for reports; annual totals feed P2.4.

---

## P6 — Balance sheet and working capital polish

### P6.1 Balance sheet optional sub-lines
- **Scope:** Retained earnings, intangibles, current portion of LTD if needed after Excel cell audit.
- **Depends on:** Excel manifest cell map (run `extract_workbook_manifest.py` with source xlsx when available)

### P6.2 Working capital scenarios
- **Scope:** Growth rate on revenue/COGS, projected WC funding need (if in Excel).
- **Depends on:** P3.1 snapshot

---

## P7 — Tooling and regression

### P7.1 Per-sheet field manifest (machine-readable)
- **Scope:** Generate `knowledge/workbooks/sheet_field_manifest.json` from Excel + app models; CI diff warns on drift.
- **Command:** Extend `python_engine/tools/extract_workbook_manifest.py` or new `extract_sheet_fields.py`
- **Acceptance:** PR checklist compares Excel defined names vs `models.py` fields.

### P7.2 Golden tests per priority worksheet
- **Scope:** Fixture inputs from Excel sample client; assert outputs match within tolerance.
- **Touches:** `python_engine/tests/test_analyst_worksheets.py`

### P7.3 Regenerate `not-incorporated-sheets.md` from catalog + build list status
- **Scope:** Script marks feeder sheets as planned/in-progress/done.

---

## Suggested sprint order

| Sprint | Items | Outcome |
|---|---|---|
| **Sprint A** | P0.1, P0.2, P0.3 | Existing data wired; less re-entry |
| **Sprint B** | P0.4, P1.1, P1.3 | Client profile + full breakeven variables |
| **Sprint C** | P2.1, P2.2, P2.3, P1.2 | P&L detail + expense feeders → breakeven |
| **Sprint D** | P2.4, P3.1, P3.2 | Auto history + snapshot graph |
| **Sprint E** | P4.1–P4.3 | Projections match client model |
| **Sprint F** | P5.x, P6.x, P7.x | Monthly detail, polish, regression harness |

---

## Definition of done (program-level)

- [ ] Every input cell on the seven priority Excel tabs maps to a field in app DB or derived from a feeder wizard
- [ ] Saving any priority worksheet updates a queryable client snapshot
- [ ] Breakeven accepts full cost stack (direct, indirect, G&A, profit-based formula)
- [x] P&L supports line-item detail that rolls into comparisons and breakeven pulls
- [x] Feeder sheets `MISC DIRECT EXPENSES`, `MISC INDIRECT EXPENSES`, `4 YEAR HISTORY (Auto)` have app equivalents
- [x] Golden tests pass against at least one reference client workbook export
