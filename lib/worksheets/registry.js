import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';

/**
 * Single registry for every worksheet the app can route to:
 * the 74 catalog tabs plus the standalone workbook ports and custom sheets
 * that previously lived only in the sheet dispatcher. Server-safe (no React).
 *
 * `component` names the wizard family that renders a live sheet:
 *   dedicated  — one of the bespoke wizard components (key === sheet key)
 *   advanced-analyst-sheet — AdvancedAnalystSheetWizard configs
 *   workbook-port — WorkbookPortWizard configs
 *   guided-intake — the legacy AnalystWizard flow
 *   null — not implemented yet (renders the coming-soon panel)
 */

const CUSTOM_WORKSHEETS = [
  {
    key: 'weekly-cash-flow',
    sheetName: 'WEEKLY CASH FLOW FORECAST',
    category: 'analysis',
    priorityRank: 50,
    component: 'dedicated',
    sourceWorkbook: '6 Wk Cash Flow WA.xls',
  },
  {
    key: 'flexible-budget-variance',
    sheetName: 'FLEXIBLE BUDGET / VARIANCE',
    category: 'analysis',
    priorityRank: 50,
    component: 'dedicated',
    sourceWorkbook: 'F-700a Flex Budget Worksheet.xlsx',
  },
  {
    key: 'bms-marketing-forecast',
    sheetName: 'BMS MARKETING FORECAST',
    category: 'marketing',
    priorityRank: 0,
    component: 'workbook-port',
    sourceWorkbook: 'BMS Marketing Forecast.xlsx',
  },
  {
    key: 'dashboard-gantt-chart',
    sheetName: 'DASHBOARD GANTT CHART',
    category: 'analysis',
    priorityRank: 0,
    component: 'workbook-port',
    sourceWorkbook: 'F-1600d Dashboard Gantt-Chart.xlsx',
  },
  {
    key: 'flex-budget-worksheet',
    sheetName: 'FLEX BUDGET WORKSHEET',
    category: 'analysis',
    priorityRank: 0,
    component: 'workbook-port',
    sourceWorkbook: 'F-700a Flex Budget Worksheet.xlsx',
  },
  {
    key: 'sales-pipeline-forecast',
    sheetName: 'SALES PIPELINE FORECAST',
    category: 'marketing',
    priorityRank: 0,
    component: 'workbook-port',
    sourceWorkbook: 'F-700e Sales Pipeline Forecast.xlsx',
  },
  {
    key: 'cash-flow-forecast-worksheet',
    sheetName: 'CASH FLOW FORECAST WORKSHEET',
    category: 'analysis',
    priorityRank: 0,
    component: 'workbook-port',
    sourceWorkbook: 'F-900a Cash Flow Forecast worksheet.xls',
  },
  {
    key: 'f-1200-ar-turns',
    sheetName: 'F-1200 AR TURNS WORKSHEET',
    category: 'analysis',
    priorityRank: 0,
    component: 'workbook-port',
    sourceWorkbook: 'F-1200 AR Turns Worksheet.xls',
  },
  {
    key: 'inventory-turn-calculation',
    sheetName: 'INVENTORY TURN CALCULATION',
    category: 'analysis',
    priorityRank: 0,
    component: 'workbook-port',
    sourceWorkbook: 'Inventory Turn calculation.xls',
  },
  {
    key: 'cost-vs-sales-increase',
    sheetName: 'COST VS SALES INCREASE',
    category: 'analysis',
    priorityRank: 0,
    component: 'workbook-port',
    sourceWorkbook: 'Cost vs Sales Increase.xls',
  },
  {
    key: 'f-300a-overhead-calcs',
    sheetName: 'F-300A OVERHEAD CALCS',
    category: 'analysis',
    priorityRank: 0,
    component: 'workbook-port',
    sourceWorkbook: 'F-300a Overhead Calcs.xls',
  },
];

// Wizard family per live catalog sheet. Catalog keys absent here are not
// implemented and render the coming-soon panel.
const CATALOG_COMPONENTS = {
  'basic-client-info': 'dedicated',
  'breakeven-analysis': 'dedicated',
  'working-capital-analysis': 'dedicated',
  'p-l-comparisons': 'dedicated',
  'balance-sht-comparisons': 'dedicated',
  'current-financial-information': 'dedicated',
  '5-year-projections': 'dedicated',
  '12-month-p-l-comparisons': 'advanced-analyst-sheet',
  'p-l-comparisons-min-max': 'advanced-analyst-sheet',
  'misc-direct-expenses': 'advanced-analyst-sheet',
  'misc-indirect-expenses': 'advanced-analyst-sheet',
  'z-score-private-heavy-assets': 'advanced-analyst-sheet',
  'comparative-activity-ratios': 'advanced-analyst-sheet',
};

// Topical hub/sidebar grouping, hand-assigned per key. Keys not listed fall
// into the category fallback below (consulting tabs, billing forms, ...).
const GROUP_ASSIGNMENTS = {
  'Client Profile & Goals': [
    'basic-client-info',
    'client-business-goals',
    'client-personal-goals',
    'mgmt-memo',
    'report-cover-sheet',
  ],
  'Financial Statements & Comparisons': [
    'current-financial-information',
    'p-l-comparisons',
    'balance-sht-comparisons',
    '12-month-p-l-comparisons',
    'p-l-comparisons-min-max',
    '4-year-history-auto',
    '4-yr-pie',
    'cost-of-business-yr1-vs-yr2',
    'cost-of-business-yr3-vs-yr4',
    'line-graphs',
  ],
  'Breakeven & Profitability': [
    'breakeven-analysis',
    'cost-vs-sales-increase',
    'gross-profit-margin',
    'net-profit-margin',
  ],
  'Cash Flow & Working Capital': [
    'working-capital-analysis',
    'weekly-cash-flow',
    'cash-flow-forecast-worksheet',
    'f-1200-ar-turns',
    'average-collection-period',
    'inventory-turn-calculation',
    'inventory-turnover-ratio',
  ],
  'Budgeting & Forecasting': [
    '5-year-projections',
    'flexible-budget-variance',
    'flex-budget-worksheet',
    'f-300a-overhead-calcs',
  ],
  'Ratios & Scores': [
    'comparative-activity-ratios',
    'z-score-private-heavy-assets',
    'z-score-private-light-assets',
    'current-ratio',
    'quick-ratio',
    'debt-ratio',
    'equity-ratio',
    'times-interest-earned-ratio',
    'return-on-assets',
    'return-on-equity',
    'ratios-introduction',
  ],
  'Expenses & ROI': [
    'misc-direct-expenses',
    'misc-indirect-expenses',
    '12-month-analysis-material',
    '12-month-analysis-payroll',
    '12-month-analysis-direct-labor',
    '12-month-analysis-operating-exp',
    'r-o-i-misc-direct',
    'return-on-investment-c-o-g-s',
    'return-on-investment-labor',
    'return-on-investment-material',
    'return-on-investment-sub-cont',
    'roi-indirect-slide-1',
    'roi-indirect-slide-2',
    'roi-indirect-slide-3',
    'roi-indirect-slide-4',
  ],
  'Business Valuation': [
    'current-business-val-approx',
    'fixed-business-val-approx',
    'improved-business-val-approx',
    'business-impact',
  ],
  'Matrices & Organization': [
    'financial-matrix',
    'operational-matrix',
    'organizational-matrix',
    'manufact-matrix',
    'contractor-matrix',
    'owner-return-line-graphs',
  ],
  'Marketing & Pipeline': [
    'bms-marketing-forecast',
    'sales-pipeline-forecast',
    'sales-marketing-matrix',
    'sales-marketing-dist-matrix',
  ],
  'Project Tracking': ['dashboard-gantt-chart'],
};

const CATEGORY_FALLBACK_GROUPS = {
  consulting: 'Consulting & HR Sheets',
  'invoice-billing': 'Billing Sheets',
  'bms-forms': 'Form Sheets',
  marketing: 'Marketing & Pipeline',
};

const FALLBACK_GROUP = 'Other Sheets';

// Ordered list for the hub and sidebar; groups absent from a filtered set
// are simply skipped.
export const GROUP_ORDER = [
  'Client Profile & Goals',
  'Financial Statements & Comparisons',
  'Breakeven & Profitability',
  'Cash Flow & Working Capital',
  'Budgeting & Forecasting',
  'Ratios & Scores',
  'Expenses & ROI',
  'Business Valuation',
  'Matrices & Organization',
  'Marketing & Pipeline',
  'Project Tracking',
  'Consulting & HR Sheets',
  'Billing Sheets',
  'Form Sheets',
  'Other Sheets',
];

const DISPLAY_NAME_OVERRIDES = {
  'p-l-comparisons': 'P&L Comparisons',
  '12-month-p-l-comparisons': '12 Month P&L Comparisons',
  'p-l-comparisons-min-max': 'P&L Comparisons Min/Max',
  'balance-sht-comparisons': 'Balance Sheet Comparisons',
  'z-score-private-heavy-assets': 'Z Score — Private & Heavy Assets',
  'z-score-private-light-assets': 'Z Score — Private & Light Assets',
  'return-on-investment-c-o-g-s': 'Return on Investment — COGS',
  'r-o-i-misc-direct': 'ROI — Misc Direct',
  'roi-indirect-slide-1': 'ROI Indirect — Slide 1',
  'roi-indirect-slide-2': 'ROI Indirect — Slide 2',
  'roi-indirect-slide-3': 'ROI Indirect — Slide 3',
  'roi-indirect-slide-4': 'ROI Indirect — Slide 4',
  'f-1200-ar-turns': 'F-1200 AR Turns',
  'f-300a-overhead-calcs': 'F-300a Overhead Calcs',
  'bms-marketing-forecast': 'BMS Marketing Forecast',
};

const SMALL_WORDS = new Set(['of', 'and', 'the', 'vs', 'on', 'in', 'for', 'to', 'a', 'an']);
const KEEP_UPPER = new Set(['roi', 'cogs', 'kpi', 'ar', 'ap', 'pl', 'bms', 'hr', 'p&l', 'val', 'yr', 'yr1', 'yr2', 'yr3', 'yr4', 'pg1', 'pg2', 'ps']);

function titleCase(name) {
  return String(name || '')
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      const bare = word.replace(/[^a-z0-9&]/g, '');
      if (KEEP_UPPER.has(bare)) {
        return word.toUpperCase();
      }
      if (index > 0 && SMALL_WORDS.has(bare)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

const GROUP_BY_KEY = new Map();
for (const [group, keys] of Object.entries(GROUP_ASSIGNMENTS)) {
  for (const key of keys) {
    GROUP_BY_KEY.set(key, group);
  }
}

function groupForEntry(entry) {
  return (
    GROUP_BY_KEY.get(entry.key) ||
    CATEGORY_FALLBACK_GROUPS[entry.category] ||
    FALLBACK_GROUP
  );
}

function buildRegistry() {
  const entries = [];

  for (const raw of worksheetCatalog) {
    const component = CATALOG_COMPONENTS[raw.key] || null;
    entries.push({
      key: raw.key,
      sheetName: raw.sheetName,
      displayName: DISPLAY_NAME_OVERRIDES[raw.key] || titleCase(raw.sheetName),
      category: raw.category,
      priorityRank: raw.priorityRank || 0,
      group: groupForEntry(raw),
      component,
      status: component ? 'live' : 'coming-soon',
      sourceWorkbook: raw.category === 'analyst-wizard' ? 'BMS Analyst Program.xlsm' : null,
    });
  }

  for (const raw of CUSTOM_WORKSHEETS) {
    entries.push({
      key: raw.key,
      sheetName: raw.sheetName,
      displayName: DISPLAY_NAME_OVERRIDES[raw.key] || titleCase(raw.sheetName),
      category: raw.category,
      priorityRank: raw.priorityRank || 0,
      group: groupForEntry(raw),
      component: raw.component,
      status: 'live',
      sourceWorkbook: raw.sourceWorkbook,
    });
  }

  return entries;
}

const REGISTRY = buildRegistry();
const REGISTRY_BY_KEY = new Map(REGISTRY.map((entry) => [entry.key, entry]));

export function getAllWorksheets() {
  return REGISTRY;
}

export function getWorksheet(key) {
  return REGISTRY_BY_KEY.get(key) || null;
}

export function isLive(key) {
  return REGISTRY_BY_KEY.get(key)?.status === 'live';
}

function compareWorksheets(left, right) {
  if (left.status !== right.status) {
    return left.status === 'live' ? -1 : 1;
  }
  if (left.priorityRank !== right.priorityRank) {
    return right.priorityRank - left.priorityRank;
  }
  return left.displayName.localeCompare(right.displayName);
}

/**
 * Ordered groups of worksheets for the hub and sidebar.
 * options.liveOnly limits to implemented sheets (sidebar default view).
 */
export function getWorksheetGroups(options = {}) {
  const { liveOnly = false } = options;
  const grouped = new Map();

  for (const entry of REGISTRY) {
    if (liveOnly && entry.status !== 'live') {
      continue;
    }
    if (!grouped.has(entry.group)) {
      grouped.set(entry.group, []);
    }
    grouped.get(entry.group).push(entry);
  }

  return GROUP_ORDER.filter((name) => grouped.has(name)).map((name) => ({
    name,
    worksheets: grouped.get(name).sort(compareWorksheets),
  }));
}

/**
 * Maps a worksheet/resource status string onto one of the five canonical
 * badge classes from components.css.
 */
export function badgeForStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'live') return 'badge-live';
  if (normalized === 'coming-soon' || normalized === 'coming soon') return 'badge-soon';
  if (normalized === 'review first' || normalized === 'needs access') return 'badge-review';
  if (
    normalized === 'port next' ||
    normalized === 'ready to port' ||
    normalized === 'template candidate' ||
    normalized === 'mapped source'
  ) {
    return 'badge-port';
  }
  return 'badge-soon';
}
