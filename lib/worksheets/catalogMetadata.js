/** Shared catalog metadata constants for migration and hub rendering. */

export const HUB_CATEGORIES = [
  'financial-analysis',
  'ratios',
  'valuation',
  'labor-payroll',
  'operating-expenses',
  'reports-slides',
  'matrices',
];

export const INTEGRATION_STATUSES = ['native', 'derived', 'workbook-port', 'planned', 'deprecated'];

/** Worksheets with dedicated calculate/run routes (not derived ratios). */
export const NATIVE_WORKSHEET_KEYS = new Set([
  'basic-client-info',
  'breakeven-analysis',
  'working-capital-analysis',
  'p-l-comparisons',
  'balance-sht-comparisons',
  'current-financial-information',
  '5-year-projections',
  'misc-direct-expenses',
  'misc-indirect-expenses',
  '12-month-p-l-comparisons',
  '12-month-analysis-payroll',
  '12-month-analysis-direct-labor',
  '12-month-analysis-material',
  '12-month-analysis-operating-exp',
  '4-year-history-auto',
  'current-business-val-approx',
  'fixed-business-val-approx',
  'improved-business-val-approx',
  'client-business-goals',
  'client-personal-goals',
  'hotel-of-record-form',
  'initial-consultation-invoice',
  'ps-retainer-invoice',
  'report-cover-sheet',
  'intro',
  'business-impact',
  'mgmt-memo',
  'line-graphs',
  'owner-return-line-graphs',
  'roi-indirect-slide-1',
  'roi-indirect-slide-2',
  'roi-indirect-slide-3',
  'roi-indirect-slide-4',
  'contractor-matrix',
  'financial-matrix',
  'manufact-matrix',
  'operational-matrix',
  'organizational-matrix',
  'management-matrix',
  'management-styles',
  'employee-eval-matrix',
  'emp-questionnaire-graph',
  'employee-questionnaire-pg1',
  'employee-questionnaire-pg2',
  'employee-questionnaire-tally',
  'sales-marketing-matrix',
  'sales-marketing-dist-matrix',
]);

/** Ratio tabs computed from latest P&L / balance sheet runs. */
export const DERIVED_WORKSHEET_KEYS = new Set([
  'comparative-activity-ratios',
  'gross-profit-margin',
  'net-profit-margin',
  'current-ratio',
  'debt-ratio',
  'equity-ratio',
  'inventory-turnover-ratio',
  'average-collection-period',
  'quick-ratio',
  'return-on-assets',
  'return-on-equity',
  'times-interest-earned-ratio',
  'z-score-private-heavy-assets',
  'z-score-private-light-assets',
  'ratios-introduction',
  'p-l-comparisons-min-max',
  'cost-of-business-yr1-vs-yr2',
  'cost-of-business-yr3-vs-yr4',
  '4-yr-pie',
  'return-on-investment-labor',
  'return-on-investment-c-o-g-s',
  'return-on-investment-material',
  'return-on-investment-sub-cont',
  'r-o-i-misc-direct',
]);

export const DEPRECATED_WORKSHEET_KEYS = new Set(['directory', 'sheet1', 'sheet2']);

export const ALL_INTEGRATED_WORKSHEET_KEYS = new Set([
  ...NATIVE_WORKSHEET_KEYS,
  ...DERIVED_WORKSHEET_KEYS,
]);

/** True priority worksheets (replaces overloaded priorityRank). */
export const CORE_RANK_BY_KEY = {
  'basic-client-info': 1,
  'current-financial-information': 2,
  'p-l-comparisons': 3,
  'balance-sht-comparisons': 4,
  'breakeven-analysis': 5,
  'working-capital-analysis': 6,
  '5-year-projections': 7,
};

export const HUB_CATEGORY_LABELS = {
  'financial-analysis': 'Financial Analysis',
  ratios: 'Ratios',
  valuation: 'Valuation',
  'labor-payroll': 'Labor & Payroll',
  'operating-expenses': 'Operating Expenses',
  'reports-slides': 'Reports & Slides',
  matrices: 'Matrices',
};

const HUB_CATEGORY_BY_KEY = {
  'basic-client-info': 'financial-analysis',
  'current-financial-information': 'financial-analysis',
  'p-l-comparisons': 'financial-analysis',
  'balance-sht-comparisons': 'financial-analysis',
  'breakeven-analysis': 'financial-analysis',
  'working-capital-analysis': 'financial-analysis',
  '5-year-projections': 'financial-analysis',
  '12-month-p-l-comparisons': 'financial-analysis',
  '4-year-history-auto': 'financial-analysis',
  '4-yr-pie': 'financial-analysis',
  'p-l-comparisons-min-max': 'financial-analysis',
  'cost-of-business-yr1-vs-yr2': 'financial-analysis',
  'cost-of-business-yr3-vs-yr4': 'financial-analysis',
  directory: 'financial-analysis',
  'client-business-goals': 'financial-analysis',
  'client-personal-goals': 'financial-analysis',
  intro: 'reports-slides',
  'misc-direct-expenses': 'operating-expenses',
  'misc-indirect-expenses': 'operating-expenses',
  '12-month-analysis-operating-exp': 'operating-expenses',
  '12-month-analysis-payroll': 'labor-payroll',
  '12-month-analysis-direct-labor': 'labor-payroll',
  '12-month-analysis-material': 'operating-expenses',
  'r-o-i-misc-direct': 'labor-payroll',
  'return-on-investment-labor': 'labor-payroll',
  'return-on-investment-material': 'labor-payroll',
  'return-on-investment-sub-cont': 'labor-payroll',
  'return-on-investment-c-o-g-s': 'labor-payroll',
  'current-business-val-approx': 'valuation',
  'fixed-business-val-approx': 'valuation',
  'improved-business-val-approx': 'valuation',
  'comparative-activity-ratios': 'ratios',
  'gross-profit-margin': 'ratios',
  'net-profit-margin': 'ratios',
  'current-ratio': 'ratios',
  'debt-ratio': 'ratios',
  'equity-ratio': 'ratios',
  'inventory-turnover-ratio': 'ratios',
  'average-collection-period': 'ratios',
  'quick-ratio': 'ratios',
  'return-on-assets': 'ratios',
  'return-on-equity': 'ratios',
  'times-interest-earned-ratio': 'ratios',
  'z-score-private-heavy-assets': 'ratios',
  'z-score-private-light-assets': 'ratios',
  'ratios-introduction': 'ratios',
  'report-cover-sheet': 'reports-slides',
  'mgmt-memo': 'reports-slides',
  'line-graphs': 'reports-slides',
  'owner-return-line-graphs': 'reports-slides',
  'business-impact': 'reports-slides',
  'roi-indirect-slide-1': 'reports-slides',
  'roi-indirect-slide-2': 'reports-slides',
  'roi-indirect-slide-3': 'reports-slides',
  'roi-indirect-slide-4': 'reports-slides',
  'contractor-matrix': 'matrices',
  'financial-matrix': 'matrices',
  'manufact-matrix': 'matrices',
  'operational-matrix': 'matrices',
  'organizational-matrix': 'matrices',
  'management-matrix': 'matrices',
  'management-styles': 'matrices',
  'employee-eval-matrix': 'matrices',
  'emp-questionnaire-graph': 'matrices',
  'employee-questionnaire-pg1': 'matrices',
  'employee-questionnaire-pg2': 'matrices',
  'employee-questionnaire-tally': 'matrices',
  'sales-marketing-matrix': 'matrices',
  'sales-marketing-dist-matrix': 'matrices',
  'hotel-of-record-form': 'reports-slides',
  'initial-consultation-invoice': 'reports-slides',
  'ps-retainer-invoice': 'reports-slides',
  sheet1: 'financial-analysis',
  sheet2: 'financial-analysis',
};

const DESCRIPTION_BY_KEY = {
  'basic-client-info': 'Client profile, contacts, and engagement baseline.',
  'current-financial-information': 'Consolidated financial snapshot for the engagement.',
  'p-l-comparisons': 'Multi-year profit and loss comparisons.',
  'balance-sht-comparisons': 'Multi-year balance sheet comparisons.',
  'breakeven-analysis': 'Contribution margin and breakeven revenue targets.',
  'working-capital-analysis': 'Cash conversion cycle and working capital needs.',
  '5-year-projections': 'Five-year revenue, margin, and cash flow outlook.',
  '12-month-p-l-comparisons': 'Monthly P&L rollups against annual targets.',
  '4-year-history-auto': 'Auto-generated four-year statement history.',
  'misc-direct-expenses': 'Direct cost detail feeding P&L and breakeven.',
  'misc-indirect-expenses': 'Indirect and G&A detail for breakeven layers.',
  '12-month-analysis-payroll': 'Monthly payroll expense breakdown.',
  '12-month-analysis-direct-labor': 'Monthly direct labor cost detail.',
  '12-month-analysis-material': 'Monthly materials and supplies spend.',
  '12-month-analysis-operating-exp': 'Monthly operating expense detail.',
  'comparative-activity-ratios': 'Activity ratios from latest statement runs.',
  'gross-profit-margin': 'Gross margin from the latest P&L year.',
  'net-profit-margin': 'Net and operating margin trends.',
  'current-ratio': 'Liquidity from the latest balance sheet.',
  'debt-ratio': 'Leverage ratios from balance sheet data.',
  'equity-ratio': 'Equity cushion from balance sheet totals.',
  'inventory-turnover-ratio': 'Inventory efficiency from COGS and inventory.',
  'average-collection-period': 'Receivables collection speed in days.',
};

const CATEGORY_FALLBACK = {
  'analyst-wizard': 'financial-analysis',
  consulting: 'matrices',
  marketing: 'matrices',
  'invoice-billing': 'reports-slides',
  'bms-forms': 'reports-slides',
};

/**
 * @param {string} key
 * @param {string} [legacyCategory]
 * @returns {import('./hubStatus.js').HubCategory}
 */
export function resolveHubCategory(key, legacyCategory = 'analyst-wizard') {
  return HUB_CATEGORY_BY_KEY[key] || CATEGORY_FALLBACK[legacyCategory] || 'financial-analysis';
}

/**
 * @param {string} key
 * @returns {'native' | 'derived' | 'planned'}
 */
export function resolveIntegrationStatus(key) {
  if (DEPRECATED_WORKSHEET_KEYS.has(key)) return 'deprecated';
  if (DERIVED_WORKSHEET_KEYS.has(key)) return 'derived';
  if (NATIVE_WORKSHEET_KEYS.has(key)) return 'native';
  return 'planned';
}

/**
 * @param {string} key
 * @param {string} sheetName
 * @returns {string}
 */
export function resolveDescription(key, sheetName) {
  if (DESCRIPTION_BY_KEY[key]) return DESCRIPTION_BY_KEY[key];
  return `Planned worksheet — ${sheetName}.`;
}

/**
 * Migrate a single catalog entry to the Phase 0 metadata shape.
 * @param {Record<string, unknown>} entry
 * @returns {Record<string, unknown>}
 */
export function migrateCatalogEntry(entry) {
  const key = entry.key;
  const coreRank = CORE_RANK_BY_KEY[key] ?? null;
  const next = {
    key,
    sheetName: entry.sheetName,
    category: entry.category,
    hubCategory: resolveHubCategory(key, entry.category),
    integrationStatus: resolveIntegrationStatus(key),
    description: resolveDescription(key, entry.sheetName),
  };

  if (coreRank != null) {
    next.coreRank = coreRank;
  }

  return next;
}
