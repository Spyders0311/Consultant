# Workspace UX Implementation Plan

**Target:** Light-themed Client Command Center + Analyst Worksheet Hub + Worksheet Shell + Analysis dashboard (per UI mockups).

**Assumption:** Phase 0 (catalog metadata, `hubStatus` contract, shared UI primitives) is **in progress**. This plan **starts at Phase 1**.

**Last updated:** 2026-06-17

---

## Quick reference: execution waves

| Wave | When to start | Parallel agents | Gate to exit wave |
|------|---------------|-----------------|-------------------|
| **Wave 1** | Phase 0 contract merged | 3–4 | Hub-status API returns real data |
| **Wave 2** | Wave 1 API merged (UI can stub earlier) | 3–4 | Command center + worksheet hub live |
| **Wave 3** | Wave 2 hub live | 2–3 | WorksheetShell wraps all integrated wizards |
| **Wave 4** | Wave 3 shell merged | 3–4 | BCI accordion + CFI table + Analysis page |
| **Wave 5** | Wave 4 stable | 1–2 | PDF export, polish, Phase 5 backlog |

---

## Phase 0 (in progress — do not duplicate)

**Owner:** Platform agent. Others **block on the contract**, not necessarily every file.

### Exit criteria (required before Wave 1 merges to main)

- [ ] `worksheet_catalog.json` has `hubCategory`, `integrationStatus`, `description`, `coreRank` (7 core = rank 1–7)
- [ ] `lib/worksheets/hubStatus.js` exports frozen `HubStatusItem` shape + `resolveWorksheetStatus()`
- [ ] `integrationStatus` values: `native` | `derived` | `workbook-port` | `planned`
- [ ] Shared UI stubs: `StatusDot`, `WorksheetCard`, `KpiCard`, `ProgressDonut` (can be minimal)
- [ ] Short contract doc linked from this file (or section below) — **no renames of worksheet keys after this**

### Phase 0 outputs other agents consume

```ts
// lib/worksheets/hubStatus.js (contract)
type IntegrationStatus = 'native' | 'derived' | 'workbook-port' | 'planned';
type WorksheetStatus = 'complete' | 'in_progress' | 'not_started' | 'planned';

type HubStatusItem = {
  worksheetKey: string;
  sheetName: string;
  hubCategory: string;
  integrationStatus: IntegrationStatus;
  status: WorksheetStatus;
  lastUpdatedAt: string | null;
  lastRunId: string | null;
  progressPercent: number | null;
  href: string | null;
  description: string;
  coreRank: number | null;
};
```

---

## Phase 1 — Hub data layer + navigation surfaces

**Goal:** Replace flat worksheet list with Command Center + categorized Worksheet Hub powered by one API.

### 1.1 Hub-status API (critical path)

| Item | Detail |
|------|--------|
| **Route** | `GET /api/clients/[clientId]/hub-status` |
| **Implementation** | `lib/server/hubStatus.js` — aggregate all `client_*_runs` tables + `client_financial_snapshots` + catalog |
| **Registry** | Extend `lib/worksheets/sourceRunEndpoints.js` → `worksheetRunRegistry.js` mapping `worksheetKey → { table, analysisType? }` |
| **Response** | `{ ok, clientId, items: HubStatusItem[], summary: { coreComplete, coreTotal, integratedCount, lastActivityAt } }` |
| **Tests** | `lib/server/hubStatus.test.js` or API integration test with mocked Supabase |

**Status rules (v1):**

| Condition | `status` |
|-----------|----------|
| `integrationStatus === 'planned'` | `planned` |
| Latest run exists | `complete` |
| Snapshot provenance for worksheet source, no run | `in_progress` |
| Neither | `not_started` |

**Parallel:** ❌ This is the **Wave 1 gate**. One agent should own it end-to-end.

---

### 1.2 Worksheet Hub UI

| Item | Detail |
|------|--------|
| **Route** | `/workspace/[clientId]/analyst-wizard` (replace `page.js`) |
| **Components** | `components/hub/AnalystWorksheetHub.js`, `components/hub/WorksheetCategoryColumn.js`, `components/hub/ContinueWhereLeftOff.js` |
| **Features** | Search, filters (category, status, integrated-only default), 7 core cards, 7 category columns, Guided Intake footer |
| **Data** | Fetch hub-status API (server component prefetch or client fetch) |

**Parallel:** ✅ **After Phase 0 contract** — can use **mock JSON** until 1.1 merges.

**Depends on:** 1.1 for production; Phase 0 only for UI scaffolding.

---

### 1.3 Client Command Center

| Item | Detail |
|------|--------|
| **Route** | `/workspace/[clientId]/overview` (or make default `/workspace/[clientId]`) |
| **Components** | `components/hub/ClientCommandCenter.js`, reuse `KpiCard`, `ProgressDonut`, `ContinueWhereLeftOff` |
| **Blocks** | Client strip, 5 KPI cards, analyst progress donut (7 core), continue row, recent worksheets table, link to hub |
| **KPI source** | `client_financial_snapshots` + latest P&L/BS; show `—` when missing |

**Parallel:** ✅ Same as 1.2 — mock hub-status until API ready.

**Depends on:** 1.1 for real KPIs/progress; snapshot API already exists.

---

### 1.4 Navigation polish

| Item | Detail |
|------|--------|
| **Files** | `app/workspace/[clientId]/layout.js` — breadcrumbs `Clients / {company}` |
| **Links** | Analyst tab → overview or hub; worksheet pages → breadcrumb `Analyst Wizard > {name}` |
| **Planned sheets** | No dead links — `planned` rows muted, tooltip “Not yet in app” |

**Parallel:** ✅ With 1.2/1.3 once routes are agreed.

---

### Phase 1 definition of done

- [ ] `GET hub-status` returns all 23 integrated + 51 planned with correct status
- [ ] Worksheet hub: core cards + categories + search/filter; default **integrated only**
- [ ] Command center: progress donut + continue row + recent table
- [ ] No regression to existing `/sheets/[sheetKey]` routes
- [ ] `npm run generate:incorporation-status` reads `integrationStatus` from catalog

---

## Phase 2 — Worksheet shell + completion model

**Goal:** Consistent chrome around every integrated wizard (header, actions, right rail).

### 2.1 Database

| Item | Detail |
|------|--------|
| **Migration** | `client_worksheet_status` (`client_id`, `worksheet_key`, `status`, `completed_at`, `updated_at`, `completed_by`) |
| **Optional** | `client_worksheet_drafts` (`client_id`, `worksheet_key`, `draft_json`, `updated_at`) |

**Parallel:** ✅ **Independent** of Phase 1 UI — can run in Wave 1 alongside hub API (different agent).

**Depends on:** Nothing from Phase 1.

---

### 2.2 Required-fields manifest

| Item | Detail |
|------|--------|
| **File** | `lib/worksheets/requiredFields.js` |
| **Scope** | 7 core worksheets first — field keys per wizard form |
| **Use** | Right rail “X of Y required fields” + completion % |

**Parallel:** ✅ With 2.1 and Phase 1.

---

### 2.3 WorksheetShell layout

| Item | Detail |
|------|--------|
| **Components** | `components/workspace/WorksheetShell.js`, `components/workspace/WorksheetStatusRail.js`, `components/workspace/WorksheetHeaderActions.js` |
| **Props** | `clientId`, `worksheetKey`, `title`, `status`, `children`, `onSave`, `onMarkComplete` |
| **Rail v1** | Completion %, last 3 runs (from existing run endpoints), validation placeholder |

**Parallel:** ✅ UI can be built with **Storybook-style mock** before DB migrations.

**Depends on:** 2.2 for real completion %; 2.1 for Mark Complete.

---

### 2.4 Wrap integrated wizards

| Item | Detail |
|------|--------|
| **Pattern** | `page.js` renders `<WorksheetShell><ExistingWizard /></WorksheetShell>` |
| **Rollout** | Pilot: `basic-client-info`, `breakeven-analysis` → then batch remaining 21 |
| **Mechanical** | Safe to split across **multiple agents** (one PR per worksheet group) |

**Parallel:** ✅ **After 2.3 merges** — highly parallelizable.

| Agent batch | Worksheets |
|-------------|------------|
| A | basic-client-info, breakeven-analysis, working-capital-analysis |
| B | p-l-comparisons, balance-sht-comparisons, current-financial-information |
| C | 5-year-projections, misc direct/indirect, 12-month P&L |
| D | 4× twelve-month analysis, 4-year-history-auto, 8× derived ratios |

---

### Phase 2 definition of done

- [ ] All 23 integrated worksheets use `WorksheetShell`
- [ ] Mark Complete persists to `client_worksheet_status`
- [ ] Save Draft works (localStorage minimum, DB optional)
- [ ] Right rail shows completion + recent runs

---

## Phase 3 — Deep worksheet UX (parallel tracks)

**Goal:** Move priority tabs toward mock fidelity. **Three independent tracks.**

### Track 3A — Basic Client Info accordion

| Item | Detail |
|------|--------|
| **UI** | 7 accordion sections per mock |
| **DB** | Extend `clients` or `profile jsonb` for EIN, entity type, address, professional partners |
| **Migration** | New columns / `client_profile` jsonb |

**Parallel:** ✅ After WorksheetShell (or behind flag without shell).

**Depends on:** 2.3 preferred; Phase 0 catalog only required.

---

### Track 3B — Current Financial Information table view

| Item | Detail |
|------|--------|
| **UI** | Reporting period bar + income/BS tables + key metrics panel |
| **Backend** | Reuse existing CFI calculate/save; new presentation component only |
| **Defer** | Multi-period YTD columns, document upload |

**Parallel:** ✅ **Fully independent** of 3A.

**Depends on:** `financial-ratios` API (already exists).

---

### Track 3C — Step progress on hub cards

| Item | Detail |
|------|--------|
| **Data** | Persist `stepIndex` in draft payload |
| **Hub** | `progressPercent` on `HubStatusItem` for step-based wizards |
| **Wizards** | Breakeven, WC, CFI, 5-year, P&L |

**Parallel:** ✅ With 3A/3B; needs 2.1 drafts table or localStorage convention.

**Depends on:** 2.1 optional; 1.1 hub-status must expose `progressPercent`.

---

### Phase 3 definition of done

- [ ] BCI: 7 sections with section-level status
- [ ] CFI: table layout with live ratio panel
- [ ] Hub “continue” cards show % for step wizards where draft exists

---

## Phase 4 — Analysis / Executive dashboard

**Goal:** `/workspace/[clientId]/analysis` as read-only synthesis + PDF.

| Item | Detail |
|------|--------|
| **Route** | `app/workspace/[clientId]/analysis/page.js` |
| **Assembler** | `lib/reports/executiveAnalysis.js` — pull latest P&L, BS, ratios, 5-year summary |
| **UI** | KPI cards, trend charts (need 2+ years P&L), opex breakdown, insights (rule-based), recommended actions from hub-status gaps |
| **PDF** | Extend `/api/pdf` with `reportType: executive-analysis` |

**Parallel:** ✅ **Most of Phase 4** can start in **Wave 2** (after hub-status API). Charts need P&L history.

**Depends on:** 1.1 hub-status (for recommended actions); existing calculate endpoints.

**Independent of:** Phase 2 shell, Phase 3 tracks.

---

### Phase 4 definition of done

- [ ] Analysis page renders from saved runs (no manual re-entry)
- [ ] Insights + next actions reflect real incomplete worksheets
- [ ] Export PDF works

---

## Phase 5 — Collaboration (defer)

Tasks, calendar, notes threading, document upload, activity log, engagement team.

**Start only after Phase 2 shell is stable.** Not parallel with critical path.

---

## Parallelization matrix

| Work item | Wave | Parallel with | Blocked by |
|-----------|------|---------------|------------|
| 1.1 Hub-status API | 1 | 2.1 migration, 2.2 requiredFields, 1.4 breadcrumbs | Phase 0 contract |
| 1.2 Worksheet Hub UI | 1–2 | 1.3, 1.4, 2.3 (mock) | 1.1 for prod data |
| 1.3 Command Center | 1–2 | 1.2, 1.4 | 1.1 for prod data |
| 1.4 Breadcrumbs / nav | 1–2 | 1.2, 1.3 | Phase 0 |
| 2.1 DB status/drafts | 1–2 | 1.1, 2.2 | None |
| 2.2 requiredFields.js | 1–2 | All Wave 1 | Phase 0 keys |
| 2.3 WorksheetShell | 2 | 3A, 3B (mock) | 2.2 soft |
| 2.4 Wrap wizards | 2–3 | Split across 4 agents | 2.3 |
| 3A BCI accordion | 3–4 | 3B, 3C, 4 | 2.3 preferred |
| 3B CFI tables | 3–4 | 3A, 3C, 4 | None (shell optional) |
| 3C Step progress | 3–4 | 3A, 3B | 2.1, 1.1 update |
| 4 Analysis dashboard | 2–4 | 1.2, 1.3, 3x | 1.1 |
| 4 PDF export | 4–5 | — | 4 page |

---

## Recommended agent assignment (fastest path)

### Wave 1 (start when Phase 0 contract is merged)

| Agent | Task | Deliverable |
|-------|------|-------------|
| **Platform** | 1.1 Hub-status API + registry + tests | `lib/server/hubStatus.js`, route, tests |
| **Hub UI** | 1.2 Worksheet Hub (mock → wire API) | `AnalystWorksheetHub.js`, updated `page.js` |
| **Overview UI** | 1.3 Command Center + 1.4 breadcrumbs | `overview/page.js`, layout breadcrumbs |
| **Data** | 2.1 migrations + 2.2 requiredFields | SQL + manifest |

**Duration:** ~1–2 weeks. **Gate:** hub-status API merged and tested.

---

### Wave 2 (hub-status API on main)

| Agent | Task | Deliverable |
|-------|------|-------------|
| **Hub UI** | Wire real data, filters, integrated-only default | Production hub |
| **Overview UI** | Wire KPIs + progress donut | Production command center |
| **Shell** | 2.3 WorksheetShell + rail v1 | Shell components |
| **Analysis** | 4 page skeleton + KPI reuse | Analysis route (no PDF) |

**Duration:** ~1–2 weeks. **Gate:** Hub + overview live; shell ready for wrap.

---

### Wave 3 (shell merged)

| Agent | Task | Deliverable |
|-------|------|-------------|
| **A** | 2.4 wrap batch A (3 wizards) | PR |
| **B** | 2.4 wrap batch B (3 wizards) | PR |
| **C** | 2.4 wrap batch C + D (feeders + derived) | PR |
| **D** | 3C step progress + hub `progressPercent` | Draft + hub update |

**Duration:** ~1 week. **Gate:** All integrated wizards in shell.

---

### Wave 4 (parallel product depth)

| Agent | Task | Deliverable |
|-------|------|-------------|
| **A** | 3A Basic Client Info accordion + migration | Full BCI UX |
| **B** | 3B CFI table view | CFI presentation |
| **C** | 4 Analysis charts + insights + PDF | Executive report |
| **D** | Polish, accessibility, empty states | QA pass |

**Duration:** ~2–4 weeks.

---

## Order of operations (single-threaded critical path)

If you only have **one** agent, do strictly this order:

1. Phase 0 exit criteria ✓  
2. **1.1** Hub-status API  
3. **1.2** Worksheet Hub  
4. **1.3** Command Center  
5. **2.3** WorksheetShell  
6. **2.4** Wrap all wizards (batch)  
7. **4** Analysis page  
8. **3B** CFI tables  
9. **3A** BCI accordion  
10. **3C** Step progress on hub  
11. Phase 5 backlog  

If you have **four** agents after Phase 0:

```
Week 1–2:
  Agent 1 → 1.1 API
  Agent 2 → 1.2 Hub UI (mock)
  Agent 3 → 1.3 Command Center (mock)
  Agent 4 → 2.1 DB + 2.2 requiredFields

Week 2–3:
  Agents 2+3 → wire API
  Agent 1 → 2.3 WorksheetShell
  Agent 4 → 4 Analysis skeleton

Week 3–4:
  Agents 1–4 → 2.4 wizard wraps (split batches)

Week 4+:
  Parallel 3A / 3B / 3C / 4 PDF
```

---

## Feature flag (recommended)

```env
NEXT_PUBLIC_WORKSPACE_V2=1
```

- `0`: legacy flat worksheet list  
- `1`: command center + new hub + shell  

Lets UI agents merge early without breaking production.

---

## Files to create (checklist)

### Phase 1
- [ ] `lib/server/hubStatus.js`
- [ ] `lib/worksheets/worksheetRunRegistry.js`
- [ ] `app/api/clients/[clientId]/hub-status/route.js`
- [ ] `components/hub/AnalystWorksheetHub.js`
- [ ] `components/hub/ClientCommandCenter.js`
- [ ] `components/hub/ContinueWhereLeftOff.js`
- [ ] `app/workspace/[clientId]/overview/page.js`

### Phase 2
- [ ] `supabase/migrations/*_client_worksheet_status.sql`
- [ ] `lib/worksheets/requiredFields.js`
- [ ] `components/workspace/WorksheetShell.js`
- [ ] `components/workspace/WorksheetStatusRail.js`

### Phase 3–4
- [ ] `components/BasicClientInfoAccordion.js` (or refactor wizard)
- [ ] `components/CFITableView.js`
- [ ] `lib/reports/executiveAnalysis.js`
- [ ] `app/workspace/[clientId]/analysis/page.js`

---

## Out of scope (v1)

- Global left sidebar (Home, Projects, Templates, …)
- Tasks, calendar, overdue counts
- Document upload on CFI
- Full 79-worksheet completion stats
- LLM-generated insights
- Multi-user contributors / avatars

---

## Related docs

- `knowledge/workbooks/analyst-worksheet-build-list.md` — worksheet feature coverage
- `knowledge/workbooks/not-incorporated-sheets.md` — integration status (regenerate after catalog update)
- `knowledge/workbooks/worksheet_catalog.json` — source of truth for hub categories
