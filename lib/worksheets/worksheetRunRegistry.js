/**
 * Maps worksheet keys to Supabase run tables or derived source dependencies.
 *
 * @typedef {Object} WorksheetRunTableEntry
 * @property {string} table
 * @property {string} [analysisType] - filter for client_twelve_month_analysis_runs
 * @property {string} [workbookKey] - filter for client_workbook_port_runs
 * @property {string} [runEndpoint] - latest-run API path for stale-field detection
 */

/**
 * @typedef {Object} WorksheetRunDerivedEntry
 * @property {'derived'} kind
 * @property {string[]} sourceRuns - worksheet keys whose saved runs enable this sheet
 */

/**
 * @typedef {Object} WorksheetRunSnapshotEntry
 * @property {'snapshot-only'} kind
 */

/** @type {Record<string, WorksheetRunTableEntry | WorksheetRunDerivedEntry | WorksheetRunSnapshotEntry>} */
export const WORKSHEET_RUN_REGISTRY = {
  'basic-client-info': {
    table: 'client_basic_client_info_runs',
    runEndpoint: '/api/worksheets/basic-client-info/runs',
  },
  'breakeven-analysis': {
    table: 'client_breakeven_runs',
    runEndpoint: '/api/worksheets/breakeven/runs',
  },
  'working-capital-analysis': {
    table: 'client_working_capital_runs',
    runEndpoint: '/api/worksheets/working-capital/runs',
  },
  'p-l-comparisons': {
    table: 'client_pl_comparisons_runs',
    runEndpoint: '/api/worksheets/pl-comparisons/runs',
  },
  'balance-sht-comparisons': {
    table: 'client_balance_sheet_comparisons_runs',
    runEndpoint: '/api/worksheets/balance-sheet-comparisons/runs',
  },
  'current-financial-information': {
    table: 'client_current_financial_information_runs',
    runEndpoint: '/api/worksheets/current-financial-information/runs',
  },
  '5-year-projections': {
    table: 'client_five_year_projections_runs',
    runEndpoint: '/api/worksheets/five-year-projections/runs',
  },
  'misc-direct-expenses': {
    table: 'client_misc_direct_expense_runs',
    runEndpoint: '/api/worksheets/misc-direct-expenses/runs',
  },
  'misc-indirect-expenses': {
    table: 'client_misc_indirect_expense_runs',
    runEndpoint: '/api/worksheets/misc-indirect-expenses/runs',
  },
  '12-month-p-l-comparisons': {
    table: 'client_twelve_month_pl_runs',
    runEndpoint: '/api/worksheets/twelve-month-pl-comparisons/runs',
  },
  '12-month-analysis-payroll': {
    table: 'client_twelve_month_analysis_runs',
    analysisType: 'payroll',
    runEndpoint: '/api/worksheets/twelve-month-analysis/runs?analysis_type=payroll',
  },
  '12-month-analysis-direct-labor': {
    table: 'client_twelve_month_analysis_runs',
    analysisType: 'direct_labor',
    runEndpoint: '/api/worksheets/twelve-month-analysis/runs?analysis_type=direct_labor',
  },
  '12-month-analysis-material': {
    table: 'client_twelve_month_analysis_runs',
    analysisType: 'material',
    runEndpoint: '/api/worksheets/twelve-month-analysis/runs?analysis_type=material',
  },
  '12-month-analysis-operating-exp': {
    table: 'client_twelve_month_analysis_runs',
    analysisType: 'operating_exp',
    runEndpoint: '/api/worksheets/twelve-month-analysis/runs?analysis_type=operating_exp',
  },
  '4-year-history-auto': { kind: 'snapshot-only' },
  'comparative-activity-ratios': {
    kind: 'derived',
    sourceRuns: ['p-l-comparisons', 'balance-sht-comparisons'],
  },
  'gross-profit-margin': {
    kind: 'derived',
    sourceRuns: ['p-l-comparisons'],
  },
  'net-profit-margin': {
    kind: 'derived',
    sourceRuns: ['p-l-comparisons'],
  },
  'current-ratio': {
    kind: 'derived',
    sourceRuns: ['balance-sht-comparisons'],
  },
  'debt-ratio': {
    kind: 'derived',
    sourceRuns: ['balance-sht-comparisons'],
  },
  'equity-ratio': {
    kind: 'derived',
    sourceRuns: ['balance-sht-comparisons'],
  },
  'inventory-turnover-ratio': {
    kind: 'derived',
    sourceRuns: ['p-l-comparisons', 'balance-sht-comparisons'],
  },
  'average-collection-period': {
    kind: 'derived',
    sourceRuns: ['p-l-comparisons', 'balance-sht-comparisons'],
  },
  'quick-ratio': { kind: 'derived', sourceRuns: ['p-l-comparisons', 'balance-sht-comparisons'] },
  'return-on-assets': { kind: 'derived', sourceRuns: ['p-l-comparisons', 'balance-sht-comparisons'] },
  'return-on-equity': { kind: 'derived', sourceRuns: ['p-l-comparisons', 'balance-sht-comparisons'] },
  'times-interest-earned-ratio': { kind: 'derived', sourceRuns: ['p-l-comparisons'] },
  'z-score-private-light-assets': { kind: 'derived', sourceRuns: ['p-l-comparisons', 'balance-sht-comparisons'] },
  'z-score-private-heavy-assets': { kind: 'derived', sourceRuns: ['p-l-comparisons', 'balance-sht-comparisons'] },
  'ratios-introduction': { kind: 'derived', sourceRuns: ['p-l-comparisons', 'balance-sht-comparisons'] },
  'p-l-comparisons-min-max': { kind: 'derived', sourceRuns: ['p-l-comparisons'] },
  'cost-of-business-yr1-vs-yr2': { kind: 'derived', sourceRuns: ['p-l-comparisons'] },
  'cost-of-business-yr3-vs-yr4': { kind: 'derived', sourceRuns: ['p-l-comparisons'] },
  '4-yr-pie': { kind: 'derived', sourceRuns: ['p-l-comparisons'] },
  'return-on-investment-labor': { kind: 'derived', sourceRuns: ['p-l-comparisons', '12-month-analysis-direct-labor'] },
  'return-on-investment-c-o-g-s': { kind: 'derived', sourceRuns: ['p-l-comparisons'] },
  'return-on-investment-material': { kind: 'derived', sourceRuns: ['p-l-comparisons', '12-month-analysis-material'] },
  'return-on-investment-sub-cont': { kind: 'derived', sourceRuns: ['p-l-comparisons', '12-month-analysis-payroll'] },
  'r-o-i-misc-direct': { kind: 'derived', sourceRuns: ['p-l-comparisons', 'misc-direct-expenses'] },
  'current-business-val-approx': {
    table: 'client_valuation_runs',
    runEndpoint: '/api/worksheets/valuation/runs?scenario=current',
  },
  'fixed-business-val-approx': {
    table: 'client_valuation_runs',
    runEndpoint: '/api/worksheets/valuation/runs?scenario=fixed',
  },
  'improved-business-val-approx': {
    table: 'client_valuation_runs',
    runEndpoint: '/api/worksheets/valuation/runs?scenario=improved',
  },
  'client-business-goals': {
    table: 'client_goals_runs',
    runEndpoint: '/api/worksheets/client-goals/runs?goal_type=business',
  },
  'client-personal-goals': {
    table: 'client_goals_runs',
    runEndpoint: '/api/worksheets/client-goals/runs?goal_type=personal',
  },
  'hotel-of-record-form': {
    table: 'client_form_document_runs',
    runEndpoint: '/api/worksheets/form-documents/runs?form_type=hotel',
  },
  'initial-consultation-invoice': {
    table: 'client_form_document_runs',
    runEndpoint: '/api/worksheets/form-documents/runs?form_type=invoice&invoice_type=consultation',
  },
  'ps-retainer-invoice': {
    table: 'client_form_document_runs',
    runEndpoint: '/api/worksheets/form-documents/runs?form_type=invoice&invoice_type=retainer',
  },
  'contractor-matrix': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=contractor-matrix',
  },
  'financial-matrix': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=financial-matrix',
  },
  'manufact-matrix': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=manufact-matrix',
  },
  'operational-matrix': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=operational-matrix',
  },
  'organizational-matrix': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=organizational-matrix',
  },
  'management-matrix': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=management-matrix',
  },
  'management-styles': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=management-styles',
  },
  'employee-eval-matrix': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=employee-eval-matrix',
  },
  'employee-questionnaire-pg1': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=employee-questionnaire-pg1',
  },
  'employee-questionnaire-pg2': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=employee-questionnaire-pg2',
  },
  'sales-marketing-matrix': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=sales-marketing-matrix',
  },
  'sales-marketing-dist-matrix': {
    table: 'client_matrix_questionnaire_runs',
    runEndpoint: '/api/worksheets/matrix-questionnaire/runs?matrix_key=sales-marketing-dist-matrix',
  },
};

/** Unique Supabase tables referenced by native worksheet runs. */
export const RUN_TABLES = [
  'client_basic_client_info_runs',
  'client_breakeven_runs',
  'client_working_capital_runs',
  'client_pl_comparisons_runs',
  'client_balance_sheet_comparisons_runs',
  'client_current_financial_information_runs',
  'client_five_year_projections_runs',
  'client_misc_direct_expense_runs',
  'client_misc_indirect_expense_runs',
  'client_twelve_month_pl_runs',
  'client_twelve_month_analysis_runs',
  'client_valuation_runs',
  'client_goals_runs',
  'client_matrix_questionnaire_runs',
  'client_form_document_runs',
];

const BASE_RUN_SELECT = 'id, created_at, updated_at';
const ANALYSIS_TYPE_RUN_TABLES = new Set(['client_twelve_month_analysis_runs']);

export function getRunSelectForTable(table) {
  return ANALYSIS_TYPE_RUN_TABLES.has(table)
    ? `${BASE_RUN_SELECT}, analysis_type`
    : BASE_RUN_SELECT;
}

/**
 * @param {Record<string, unknown>} entry
 * @returns {entry is WorksheetRunTableEntry}
 */
export function isTableRegistryEntry(entry) {
  return Boolean(entry && typeof entry === 'object' && 'table' in entry);
}

/**
 * @param {Record<string, unknown>} entry
 * @returns {entry is WorksheetRunDerivedEntry}
 */
export function isDerivedRegistryEntry(entry) {
  return Boolean(entry && typeof entry === 'object' && entry.kind === 'derived');
}

/**
 * @param {Record<string, unknown>} entry
 * @returns {entry is WorksheetRunSnapshotEntry}
 */
export function isSnapshotOnlyRegistryEntry(entry) {
  return Boolean(entry && typeof entry === 'object' && entry.kind === 'snapshot-only');
}

/**
 * @param {string} worksheetKey
 * @returns {WorksheetRunTableEntry | WorksheetRunDerivedEntry | WorksheetRunSnapshotEntry | null}
 */
export function getWorksheetRunRegistryEntry(worksheetKey) {
  return WORKSHEET_RUN_REGISTRY[worksheetKey] || null;
}

/**
 * Build worksheetKey → latest-run API endpoint map for stale-field detection.
 * @returns {Record<string, string>}
 */
export function buildSourceRunEndpoints() {
  /** @type {Record<string, string>} */
  const endpoints = {};

  for (const [worksheetKey, entry] of Object.entries(WORKSHEET_RUN_REGISTRY)) {
    if (isTableRegistryEntry(entry) && entry.runEndpoint) {
      endpoints[worksheetKey] = entry.runEndpoint;
    }
  }

  return endpoints;
}
