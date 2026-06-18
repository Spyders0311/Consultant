/**
 * Row builders for Current Financial Information table view (Phase 3B).
 */

/** @type {{ id: string, title: string }[]} */
export const CFI_TABLE_SECTIONS = [
  { id: 'income', title: 'Revenue & Margin' },
  { id: 'balance', title: 'Balance Sheet' },
  { id: 'working-capital', title: 'Working Capital' },
  { id: 'capacity', title: 'Capacity' },
  { id: 'summary', title: 'Summary & Ratios' },
];

/**
 * @typedef {Object} CfiTableRow
 * @property {string} key
 * @property {string} label
 * @property {number|null} value
 * @property {string} [field]
 * @property {boolean} [editable]
 * @property {boolean} [emphasis]
 * @property {boolean} [indent]
 */

/**
 * @param {unknown} value
 */
export function parseCfiNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * @param {{ year?: unknown }|null|undefined} plYear
 * @param {{ year?: unknown }|null|undefined} bsYear
 */
export function buildCfiReportingPeriod(plYear, bsYear) {
  const year = parseCfiNumber(plYear?.year) || parseCfiNumber(bsYear?.year) || new Date().getFullYear();
  const sources = [];
  if (plYear?.year) sources.push('P&L');
  if (bsYear?.year) sources.push('Balance Sheet');

  return {
    year,
    label: `Annual · FY ${year}`,
    sourceNote: sources.length > 0 ? `Linked from ${sources.join(' & ')}` : 'Manual entry',
  };
}

/**
 * @param {Record<string, unknown>} form
 * @param {Record<string, unknown>|null} [result]
 * @returns {CfiTableRow[]}
 */
export function buildIncomeStatementRows(form, result = null) {
  const revenue = parseCfiNumber(form.annualRevenue);
  const cogs = parseCfiNumber(form.annualCogs);
  const fixed = parseCfiNumber(form.annualFixedExpenses);
  const labor = parseCfiNumber(form.laborAmount);
  const indirect = parseCfiNumber(form.indirectCostsAmount);
  const ga = parseCfiNumber(form.generalAdministrativeCostsAmount);
  const grossProfit =
    parseCfiNumber(result?.grossMarginAmount) ?? (revenue != null && cogs != null ? revenue - cogs : null);
  const operatingIncome =
    grossProfit != null && fixed != null ? grossProfit - fixed : null;

  /** @type {CfiTableRow[]} */
  const rows = [
    { key: 'revenue', label: 'Revenue', field: 'annualRevenue', value: revenue, editable: true },
    { key: 'cogs', label: 'Cost of Goods Sold', field: 'annualCogs', value: cogs, editable: true, indent: true },
    {
      key: 'grossProfit',
      label: 'Gross Profit',
      value: grossProfit,
      editable: false,
      emphasis: true,
    },
  ];

  if (labor != null && labor !== 0) {
    rows.push({ key: 'labor', label: 'Labor (detail)', field: 'laborAmount', value: labor, editable: true, indent: true });
  }
  if (indirect != null && indirect !== 0) {
    rows.push({
      key: 'indirect',
      label: 'Indirect Costs',
      field: 'indirectCostsAmount',
      value: indirect,
      editable: true,
      indent: true,
    });
  }
  if (ga != null && ga !== 0) {
    rows.push({
      key: 'ga',
      label: 'G&A',
      field: 'generalAdministrativeCostsAmount',
      value: ga,
      editable: true,
      indent: true,
    });
  }

  rows.push({
    key: 'fixedExpenses',
    label: 'Fixed Expenses',
    field: 'annualFixedExpenses',
    value: fixed,
    editable: true,
    indent: true,
  });
  rows.push({
    key: 'operatingIncome',
    label: 'Operating Income (est.)',
    value: operatingIncome,
    editable: false,
    emphasis: true,
  });

  return rows;
}

const BS_LINE_ITEMS = [
  { key: 'cash', label: 'Cash' },
  { key: 'ar', label: 'Accounts Receivable' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'otherCurrentAssets', label: 'Other Current Assets' },
  { key: 'intangibleAssets', label: 'Intangible Assets' },
  { key: 'fixedAssets', label: 'Fixed Assets' },
  { key: 'otherAssets', label: 'Other Assets' },
  { key: 'ap', label: 'Accounts Payable' },
  { key: 'currentPortionLtd', label: 'Current Portion of LTD' },
  { key: 'otherCurrentLiabilities', label: 'Other Current Liabilities' },
  { key: 'longTermDebt', label: 'Long-Term Debt' },
  { key: 'otherLiabilities', label: 'Other Liabilities' },
  { key: 'equity', label: 'Total Equity' },
];

/**
 * @param {Record<string, unknown>|null|undefined} bsYear
 * @param {Record<string, unknown>|null|undefined} bsComputed
 * @param {Record<string, unknown>|null} [result]
 * @returns {CfiTableRow[]}
 */
export function buildBalanceSheetRows(bsYear, bsComputed, result = null) {
  if (bsYear && typeof bsYear === 'object') {
    /** @type {CfiTableRow[]} */
    const rows = BS_LINE_ITEMS.map((item) => ({
      key: item.key,
      label: item.label,
      value: parseCfiNumber(bsYear[item.key]),
      editable: false,
      indent: !['cash', 'equity'].includes(item.key),
    }));

    if (bsComputed?.totalCurrentAssets != null) {
      rows.push({
        key: 'totalCurrentAssets',
        label: 'Total Current Assets',
        value: parseCfiNumber(bsComputed.totalCurrentAssets),
        emphasis: true,
      });
    }
    if (bsComputed?.totalAssets != null) {
      rows.push({
        key: 'totalAssets',
        label: 'Total Assets',
        value: parseCfiNumber(bsComputed.totalAssets),
        emphasis: true,
      });
    }
    if (bsComputed?.totalCurrentLiabilities != null) {
      rows.push({
        key: 'totalCurrentLiabilities',
        label: 'Total Current Liabilities',
        value: parseCfiNumber(bsComputed.totalCurrentLiabilities),
        emphasis: true,
      });
    }
    if (bsComputed?.totalLiabilities != null) {
      rows.push({
        key: 'totalLiabilities',
        label: 'Total Liabilities',
        value: parseCfiNumber(bsComputed.totalLiabilities),
        emphasis: true,
      });
    }
    if (bsComputed?.workingCapital != null) {
      rows.push({
        key: 'workingCapital',
        label: 'Working Capital',
        value: parseCfiNumber(bsComputed.workingCapital),
        emphasis: true,
      });
    }

    return rows;
  }

  /** @type {CfiTableRow[]} */
  return [
    {
      key: 'arInvestment',
      label: 'A/R Investment (est.)',
      value: parseCfiNumber(result?.arInvestment),
      editable: false,
    },
    {
      key: 'inventoryInvestment',
      label: 'Inventory Investment (est.)',
      value: parseCfiNumber(result?.inventoryInvestment),
      editable: false,
    },
    {
      key: 'apFinancing',
      label: 'A/P Financing (est.)',
      value: parseCfiNumber(result?.apFinancing),
      editable: false,
    },
    {
      key: 'netWorkingCapital',
      label: 'Net Working Capital',
      value: parseCfiNumber(result?.netWorkingCapital),
      editable: false,
      emphasis: true,
    },
  ];
}

/**
 * @param {Record<string, unknown>} form
 * @returns {CfiTableRow[]}
 */
export function buildCycleDriverRows(form) {
  return [
    {
      key: 'dso',
      label: 'Days Sales Outstanding',
      field: 'daysSalesOutstanding',
      value: parseCfiNumber(form.daysSalesOutstanding),
      editable: true,
    },
    {
      key: 'dio',
      label: 'Days Inventory On Hand',
      field: 'daysInventoryOnHand',
      value: parseCfiNumber(form.daysInventoryOnHand),
      editable: true,
    },
    {
      key: 'dpo',
      label: 'Days Payables Outstanding',
      field: 'daysPayablesOutstanding',
      value: parseCfiNumber(form.daysPayablesOutstanding),
      editable: true,
    },
    {
      key: 'workDays',
      label: 'Work Days / Year',
      field: 'workDaysPerYear',
      value: parseCfiNumber(form.workDaysPerYear),
      editable: true,
    },
    {
      key: 'workHours',
      label: 'Work Hours / Day',
      field: 'workHoursPerDay',
      value: parseCfiNumber(form.workHoursPerDay),
      editable: true,
    },
  ];
}

/** Ratio keys shown in the CFI metrics rail. */
export const CFI_RATIO_KEYS = [
  'grossProfitMarginPct',
  'netProfitMarginPct',
  'operatingMarginPct',
  'currentRatio',
  'debtRatio',
  'debtToEquity',
  'avgCollectionPeriodDays',
  'inventoryTurnover',
];

/**
 * @param {Record<string, unknown>|null} result
 */
export function buildCfiSummaryMetrics(result) {
  if (!result) return [];

  return [
    { key: 'grossMarginAmount', label: 'Gross Margin', value: result.grossMarginAmount, format: 'currency' },
    { key: 'grossMarginPercent', label: 'Gross Margin %', value: result.grossMarginPercent, format: 'percent' },
    { key: 'breakevenRevenue', label: 'Breakeven Revenue', value: result.breakevenRevenue, format: 'currency' },
    { key: 'netWorkingCapital', label: 'Net Working Capital', value: result.netWorkingCapital, format: 'currency' },
    {
      key: 'cashConversionCycle',
      label: 'Cash Conversion Cycle',
      value: result.cashConversionCycle,
      format: 'days',
    },
    { key: 'breakevenDaily', label: 'Breakeven Daily', value: result.breakevenDaily, format: 'currency' },
    { key: 'breakevenMonthly', label: 'Breakeven Monthly', value: result.breakevenMonthly, format: 'currency' },
  ];
}

/**
 * @param {Record<string, unknown>} form
 * @param {{ year?: unknown }|null|undefined} linkedPlYear
 * @param {Record<string, unknown>|null|undefined} linkedBsYear
 * @param {Record<string, unknown>|null|undefined} linkedBsComputed
 * @param {number} reportingYear
 */
export function buildFinancialRatiosPayload(form, linkedPlYear, linkedBsYear, linkedBsComputed, reportingYear) {
  const revenue = parseCfiNumber(form.annualRevenue);
  const cogs = parseCfiNumber(form.annualCogs);
  const fixed = parseCfiNumber(form.annualFixedExpenses);

  const plYear = linkedPlYear
    ? {
        year: linkedPlYear.year,
        revenue: linkedPlYear.revenue,
        cogs: linkedPlYear.cogs,
        operatingExpenses: linkedPlYear.operatingExpenses,
        otherExpenses: linkedPlYear.otherExpenses,
      }
    : revenue != null
      ? {
          year: reportingYear,
          revenue,
          cogs: cogs ?? 0,
          operatingExpenses: fixed ?? 0,
          otherExpenses: 0,
        }
      : null;

  const bsYear = linkedBsYear || null;
  const bsComputed = linkedBsComputed || null;

  return { plYear, bsYear, bsComputed };
}
