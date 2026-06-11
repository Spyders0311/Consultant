import { parseNumber, parseOptionalNumber } from '@/lib/format';

const config = {
  key: '5-year-projections',
  kicker: 'Analyst Program',
  title: '5 Year Projections',
  description: 'Forecast five years of revenue, margins, EBITDA, and optional after-tax net income.',
  source: null,
  api: {
    calculate: '/api/worksheets/five-year-projections/calculate',
    runs: '/api/worksheets/five-year-projections/runs',
  },
  pdf: { model: 'five-year-projections', filename: 'bms-five-year-projections-report.pdf' },
  submitLabel: 'Run 5 Year Projections',
  fields: {
    baseYear: { label: 'Base Year', type: 'number', min: 1900, max: 3000, placeholder: 'e.g. 2026' },
    baseRevenue: { label: 'Base Revenue', type: 'number', min: 0, placeholder: 'e.g. 1250000' },
    revenueGrowthPercent: { label: 'Revenue Growth %', type: 'number', step: 0.1, min: -100, placeholder: 'e.g. 8' },
    baseCogsPercent: { label: 'Base COGS %', type: 'number', step: 0.1, min: 0, max: 100, placeholder: 'e.g. 55' },
    baseFixedExpenses: { label: 'Base Fixed Expenses', type: 'number', min: 0, placeholder: 'e.g. 320000' },
    fixedExpenseGrowthPercent: {
      label: 'Fixed Expense Growth %',
      type: 'number',
      step: 0.1,
      min: -100,
      placeholder: 'e.g. 3',
    },
    taxRatePercent: {
      label: 'Tax Rate % (Optional)',
      type: 'number',
      step: 0.1,
      min: 0,
      max: 100,
      placeholder: 'Leave blank to skip',
      optional: true,
    },
  },
  steps: [
    {
      id: 'base',
      title: 'Base Inputs',
      hint: 'Set base year, revenue, and COGS assumptions.',
      fieldNames: ['baseYear', 'baseRevenue', 'revenueGrowthPercent', 'baseCogsPercent'],
      validate: (form, { num }) =>
        num(form.baseYear) >= 1900 && num(form.baseRevenue) >= 0 && num(form.baseCogsPercent) >= 0,
    },
    {
      id: 'expenses',
      title: 'Expense & Tax',
      hint: 'Set fixed expense growth and optional tax rate.',
      fieldNames: ['baseFixedExpenses', 'fixedExpenseGrowthPercent', 'taxRatePercent'],
      validate: (form, { num, opt }) => {
        const taxRate = opt(form.taxRatePercent);
        return (
          num(form.baseFixedExpenses) >= 0 &&
          num(form.fixedExpenseGrowthPercent) >= -100 &&
          (taxRate === null || (taxRate >= 0 && taxRate <= 100))
        );
      },
    },
    {
      id: 'review',
      title: 'Review & Run',
      hint: 'Confirm assumptions and calculate five-year output.',
      review: true,
    },
  ],
  review: (form, { currency, percent, formatNumber }, { runId }) => [
    {
      label: 'Projection Window',
      value: `${formatNumber(form.baseYear, 0)} to ${formatNumber(parseNumber(form.baseYear) + 4, 0)}`,
    },
    { label: 'Base Revenue', value: currency(form.baseRevenue) },
    { label: 'Revenue Growth', value: percent(form.revenueGrowthPercent) },
    { label: 'Base COGS %', value: percent(form.baseCogsPercent) },
    { label: 'Base Fixed Expenses', value: currency(form.baseFixedExpenses) },
    { label: 'Fixed Expense Growth', value: percent(form.fixedExpenseGrowthPercent) },
    {
      label: 'Tax Rate',
      value: parseOptionalNumber(form.taxRatePercent) === null ? 'Not provided' : `${Number(form.taxRatePercent).toFixed(1)}%`,
    },
    { label: 'Current Run', value: runId ? `Loaded run ${runId.slice(0, 8)}...` : 'New run (unsaved)' },
  ],
  results: {
    kpis: [
      { key: 'years.0.revenue', label: 'Start Year Revenue', type: 'currency' },
      { key: 'years.4.revenue', label: 'Year 5 Revenue', type: 'currency' },
      { key: 'years.4.ebitda', label: 'Year 5 EBITDA', type: 'currency' },
      { key: 'years.4.netIncome', label: 'Year 5 Net Income', type: 'currency' },
    ],
    tables: [
      {
        rowsKey: 'years',
        columns: [
          { key: 'year', label: 'Year', type: 'text' },
          { key: 'revenue', label: 'Revenue', type: 'currency' },
          { key: 'cogs', label: 'COGS', type: 'currency' },
          { key: 'grossProfit', label: 'Gross Profit', type: 'currency' },
          { key: 'grossMarginPct', label: 'Gross Margin %', type: 'percent' },
          { key: 'fixedExpenses', label: 'Fixed Expenses', type: 'currency' },
          { key: 'ebitda', label: 'EBITDA', type: 'currency' },
          { key: 'ebitdaMarginPct', label: 'EBITDA Margin %', type: 'percent' },
          { key: 'taxes', label: 'Taxes', type: 'currency' },
          { key: 'netIncome', label: 'Net Income', type: 'currency' },
        ],
      },
    ],
    notesKey: 'warnings',
  },
  history: {},
};

export default config;
