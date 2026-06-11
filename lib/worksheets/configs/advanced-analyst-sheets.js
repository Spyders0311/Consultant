import { parseNumber } from '@/lib/format';

/**
 * The six "advanced analyst sheet" configs, generated from the same tuple
 * definitions the pre-overhaul AdvancedAnalystSheetWizard used. All share
 * the advanced-analyst-sheet API (payload wrapped as { sheetKey, inputs })
 * and the dynamic results table derived from the response rows.
 */
const SHEET_DEFINITIONS = {
  '12-month-p-l-comparisons': {
    title: '12 Month P&L Comparisons',
    source: '12 MONTH P&L COMPARISONS',
    collectionKey: 'months',
    rowCount: 12,
    defaultRowLabel: 'Month',
    summaryFields: [
      ['totalRevenue', 'Total Revenue', 'currency'],
      ['totalGrossProfit', 'Gross Profit', 'currency'],
      ['grossMarginPct', 'Gross Margin', 'percent'],
      ['totalNetIncome', 'Net Income', 'currency'],
    ],
    rowFields: [
      ['period', 'Period', 'text'],
      ['revenue', 'Revenue', 'currency'],
      ['directLabor', 'Direct Labor', 'currency'],
      ['materials', 'Materials', 'currency'],
      ['subcontractors', 'Sub Contractors', 'currency'],
      ['miscDirectCost', 'Misc Direct Cost', 'currency'],
      ['payroll', 'Total Payroll', 'currency'],
      ['operatingExpenses', 'Operating Expense', 'currency'],
    ],
  },
  'p-l-comparisons-min-max': {
    title: 'P&L Comparisons Min Max',
    source: 'P&L COMPARISONS MIN MAX',
    collectionKey: 'years',
    rowCount: 4,
    defaultRowLabel: 'Year',
    summaryFields: [
      ['periodCount', 'Periods', 'number'],
      ['highestRevenue', 'Highest Revenue', 'currency'],
      ['lowestRevenue', 'Lowest Revenue', 'currency'],
    ],
    rowFields: [
      ['year', 'Year', 'number'],
      ['revenue', 'Revenue', 'currency'],
      ['cogs', 'COGS', 'currency'],
      ['operatingExpenses', 'Operating Exp.', 'currency'],
      ['otherExpenses', 'Other Exp.', 'currency'],
    ],
  },
  'misc-direct-expenses': {
    title: 'Misc Direct Expenses',
    source: 'MISC DIRECT EXPENSES',
    collectionKey: 'expenses',
    rowCount: 12,
    defaultRowLabel: 'Direct Expense',
    summaryFields: [
      ['totalBudget', 'Budget', 'currency'],
      ['totalActual', 'Actual', 'currency'],
      ['totalVariance', 'Variance', 'currency'],
      ['variancePct', 'Variance %', 'percent'],
    ],
    rowFields: [
      ['category', 'Category', 'text'],
      ['budget', 'Budget', 'currency'],
      ['actual', 'Actual', 'currency'],
    ],
  },
  'misc-indirect-expenses': {
    title: 'Misc Indirect Expenses',
    source: 'MISC INDIRECT EXPENSES',
    collectionKey: 'expenses',
    rowCount: 12,
    defaultRowLabel: 'Indirect Expense',
    summaryFields: [
      ['totalBudget', 'Budget', 'currency'],
      ['totalActual', 'Actual', 'currency'],
      ['totalVariance', 'Variance', 'currency'],
      ['variancePct', 'Variance %', 'percent'],
    ],
    rowFields: [
      ['category', 'Category', 'text'],
      ['budget', 'Budget', 'currency'],
      ['actual', 'Actual', 'currency'],
    ],
  },
  'z-score-private-heavy-assets': {
    title: 'Z Score - Private Heavy Assets',
    source: 'Z SCORE -PRIVATE & HEAVY ASSETS',
    scalarFields: [
      ['netSales', 'Net Sales'],
      ['currentAssets', 'Current Assets'],
      ['currentLiabilities', 'Current Liabilities'],
      ['annualIncomeFromOperations', 'Annual Income From Operations'],
      ['interestExpense', 'Interest Expense'],
      ['treasuryStock', 'Treasury Stock'],
      ['retainedEarnings', 'Retained Earnings'],
      ['totalAssets', 'Total Assets'],
      ['totalLiabilities', 'Total Liabilities'],
    ],
    summaryFields: [
      ['zScore', 'Z-Score', 'decimal'],
      ['zone', 'Risk Zone', 'text'],
    ],
  },
  'comparative-activity-ratios': {
    title: 'Comparative Activity Ratios',
    source: 'COMPARATIVE ACTIVITY RATIOS',
    scalarFields: [
      ['monthsInPeriod', '# Months in Period'],
      ['cash', 'Cash'],
      ['currentAssets', 'Current Assets'],
      ['inventory', 'Inventory'],
      ['currentLiabilities', 'Current Liabilities'],
      ['revenue', 'Revenue'],
      ['cogs', 'COGS'],
      ['annualMaterialCost', 'Annual Material Cost'],
      ['accountsReceivable', 'Accounts Receivable'],
      ['accountsPayable', 'Accounts Payable'],
      ['fixedAssets', 'Fixed Assets'],
      ['totalAssets', 'Total Assets'],
      ['totalLiabilities', 'Total Liabilities'],
      ['equity', 'Equity / Net Worth'],
      ['dailyExpenses', 'Daily Expenses'],
    ],
    summaryFields: [
      ['currentRatio', 'Current Ratio', 'decimal'],
      ['quickRatio', 'Quick Ratio', 'decimal'],
      ['assetTurnover', 'Asset Turnover', 'decimal'],
      ['debtRatio', 'Debt Ratio', 'decimal'],
    ],
  },
};

function makeRows(definition) {
  return Array.from({ length: definition.rowCount || 0 }, (_, index) => {
    const row = {};
    for (const [key, , type] of definition.rowFields || []) {
      row[key] = type === 'text' ? `${definition.defaultRowLabel} ${index + 1}` : '';
    }
    return row;
  });
}

function buildConfig(sheetKey, definition) {
  const isCollection = Boolean(definition.collectionKey);

  const fields = isCollection
    ? {}
    : Object.fromEntries(
        definition.scalarFields.map(([key, label]) => [key, { label, type: 'number' }]),
      );

  const collections = isCollection
    ? {
        [definition.collectionKey]: {
          label: definition.title,
          rowLabel: definition.defaultRowLabel,
          fixedRows: true,
          maxRows: definition.rowCount,
          defaultRows: makeRows(definition),
          fields: definition.rowFields.map(([name, label, type]) => ({
            name,
            label,
            type: type === 'text' ? 'text' : 'number',
          })),
        },
      }
    : {};

  return {
    key: sheetKey,
    kicker: 'Analyst Program',
    title: definition.title,
    description: `Initial app port of ${definition.source}. Enter the source worksheet inputs, calculate, and save the run.`,
    source: null,
    api: {
      calculate: '/api/worksheets/advanced-analyst-sheet/calculate',
      runs: '/api/worksheets/advanced-analyst-sheet/runs',
      runParams: { sheet_key: sheetKey },
      buildRequestBody: (payload) => ({ sheetKey, inputs: payload }),
    },
    pdf: null,
    submitLabel: 'Calculate & Save',
    fields,
    collections,
    steps: [
      {
        id: 'inputs',
        fieldNames: isCollection ? [] : definition.scalarFields.map(([key]) => key),
        collections: isCollection ? [definition.collectionKey] : [],
      },
    ],
    canRun: (form) => {
      if (isCollection) {
        return (form[definition.collectionKey] || []).some((row) =>
          Object.entries(row).some(
            ([key, value]) => key !== 'period' && key !== 'category' && parseNumber(value) !== 0,
          ),
        );
      }
      return definition.scalarFields.some(([key]) => parseNumber(form[key]) !== 0);
    },
    results: {
      title: 'Results',
      kpis: definition.summaryFields.map(([key, label, type]) => ({
        key: `summary.${key}`,
        label,
        type,
      })),
      tables: [{ rowsKey: 'rows', dynamicColumns: true }],
      notesKey: 'warnings',
    },
    history: {},
  };
}

const ADVANCED_SHEET_CONFIGS = Object.fromEntries(
  Object.entries(SHEET_DEFINITIONS).map(([sheetKey, definition]) => [
    sheetKey,
    buildConfig(sheetKey, definition),
  ]),
);

export default ADVANCED_SHEET_CONFIGS;
