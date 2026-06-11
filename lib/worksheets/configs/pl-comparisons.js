import { currency, parseNumber, percent } from '@/lib/format';
import ReviewTable from './ReviewTable';

function makeDefaultYears() {
  return Array.from({ length: 4 }, () => ({
    year: '',
    revenue: '',
    cogs: '',
    operatingExpenses: '',
    otherExpenses: '',
  }));
}

function lastYear(years) {
  return Array.isArray(years) && years.length ? years[years.length - 1] : null;
}

const config = {
  key: 'p-l-comparisons',
  kicker: 'Analyst Program',
  title: 'P&L Comparisons',
  description:
    'Enter a four-year P&L view, run protected calculations, review trends, and export a consultant-ready PDF.',
  source: null,
  api: {
    calculate: '/api/worksheets/pl-comparisons/calculate',
    runs: '/api/worksheets/pl-comparisons/runs',
  },
  pdf: { model: 'pl-comparisons', filename: 'bms-pl-comparisons-report.pdf' },
  submitLabel: 'Run P&L Comparison',
  fields: {},
  collections: {
    years: {
      label: '4-Year P&L Grid',
      rowLabel: 'Year',
      fixedRows: true,
      maxRows: 4,
      defaultRows: makeDefaultYears(),
      fields: [
        { name: 'year', label: 'Year', type: 'number', min: 1900, placeholder: 'e.g. 2026' },
        { name: 'revenue', label: 'Revenue', type: 'number', min: 0, placeholder: 'e.g. 1250000' },
        { name: 'cogs', label: 'COGS', type: 'number', min: 0, placeholder: 'e.g. 700000' },
        { name: 'operatingExpenses', label: 'Operating Expenses', type: 'number', min: 0, placeholder: 'e.g. 220000' },
        { name: 'otherExpenses', label: 'Other Expenses', type: 'number', min: 0, placeholder: 'e.g. 80000' },
      ],
    },
  },
  steps: [
    {
      id: 'grid',
      title: 'Enter 4 Years',
      hint: 'Input revenue and expense buckets by year.',
      collections: ['years'],
      validate: (form, { num }) =>
        (form.years || []).length === 4 &&
        form.years.every((row) => num(row.year) > 1900 && num(row.revenue) >= 0),
    },
    {
      id: 'review',
      title: 'Review & Run',
      hint: 'Validate assumptions, then run.',
      render: ({ form }) => (
        <ReviewTable
          rows={form.years || []}
          columns={[
            { key: 'year', label: 'Year', format: (value) => parseNumber(value) },
            { key: 'revenue', label: 'Revenue', format: currency },
            { key: 'cogs', label: 'COGS', format: currency },
            { key: 'operatingExpenses', label: 'Operating Expenses', format: currency },
            { key: 'otherExpenses', label: 'Other Expenses', format: currency },
          ]}
        />
      ),
    },
  ],
  results: {
    kpis: [
      { key: 'years', label: 'Latest Year', format: (years) => lastYear(years)?.year || 'n/a' },
      { key: 'years', label: 'Latest Gross Margin %', format: (years) => percent(lastYear(years)?.grossMarginPct) },
      { key: 'years', label: 'Latest EBIT Margin %', format: (years) => percent(lastYear(years)?.ebitMarginPct) },
      { key: 'years', label: 'Latest Net Income', format: (years) => currency(lastYear(years)?.netIncome) },
    ],
    tables: [
      {
        rowsKey: 'years',
        columns: [
          { key: 'year', label: 'Year', type: 'text' },
          { key: 'grossProfit', label: 'Gross Profit', type: 'currency' },
          { key: 'grossMarginPct', label: 'Gross Margin %', type: 'percent' },
          { key: 'ebit', label: 'EBIT', type: 'currency' },
          { key: 'ebitMarginPct', label: 'EBIT Margin %', type: 'percent' },
          { key: 'netIncome', label: 'Net Income', type: 'currency' },
          { key: 'trend.revenueYoYPct', label: 'Revenue YoY %', type: 'percent' },
          { key: 'trend.netIncomeYoYPct', label: 'Net Income YoY %', type: 'percent' },
        ],
      },
    ],
    notesKey: 'warnings',
  },
  history: {},
};

export default config;
