import { currency, parseNumber } from '@/lib/format';
import ReviewTable from './ReviewTable';

const LINE_ITEMS = [
  { key: 'cash', label: 'Cash' },
  { key: 'ar', label: 'Accounts Receivable' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'otherCurrentAssets', label: 'Other Current Assets' },
  { key: 'fixedAssets', label: 'Fixed Assets' },
  { key: 'otherAssets', label: 'Other Assets' },
  { key: 'ap', label: 'Accounts Payable' },
  { key: 'otherCurrentLiabilities', label: 'Other Current Liabilities' },
  { key: 'longTermDebt', label: 'Long-Term Debt' },
  { key: 'otherLiabilities', label: 'Other Liabilities' },
  { key: 'equity', label: 'Equity' },
];

function makeDefaultYears() {
  return Array.from({ length: 4 }, () => ({
    year: '',
    ...Object.fromEntries(LINE_ITEMS.map((item) => [item.key, ''])),
  }));
}

function ratio(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return Number(value).toFixed(2);
}

function lastYear(years) {
  return Array.isArray(years) && years.length ? years[years.length - 1] : null;
}

const config = {
  key: 'balance-sht-comparisons',
  kicker: 'Analyst Program',
  title: 'Balance Sheet Comparisons',
  description:
    'Enter four years of key balance sheet lines, run backend checks, and export a consultant-ready PDF.',
  source: null,
  api: {
    calculate: '/api/worksheets/balance-sheet-comparisons/calculate',
    runs: '/api/worksheets/balance-sheet-comparisons/runs',
  },
  pdf: { model: 'balance-sheet-comparisons', filename: 'bms-balance-sheet-comparisons-report.pdf' },
  submitLabel: 'Run Balance Sheet Comparison',
  fields: {},
  collections: {
    years: {
      label: '4-Year Balance Sheet Grid',
      rowLabel: 'Year',
      fixedRows: true,
      maxRows: 4,
      defaultRows: makeDefaultYears(),
      fields: [
        { name: 'year', label: 'Year', type: 'number', min: 1900, placeholder: 'e.g. 2026' },
        ...LINE_ITEMS.map((item) => ({
          name: item.key,
          label: item.label,
          type: 'number',
          min: 0,
          placeholder: 'e.g. 250000',
        })),
      ],
    },
  },
  steps: [
    {
      id: 'grid',
      title: 'Enter 4 Years',
      hint: 'Input the core balance sheet lines by year.',
      collections: ['years'],
      validate: (form, { num }) =>
        (form.years || []).length === 4 && form.years.every((row) => num(row.year) > 1900),
    },
    {
      id: 'review',
      title: 'Review & Run',
      hint: 'Validate assumptions and run calculations.',
      render: ({ form }) => (
        <ReviewTable
          rows={form.years || []}
          columns={[
            { key: 'year', label: 'Year', format: (value) => parseNumber(value) },
            ...LINE_ITEMS.map((item) => ({ key: item.key, label: item.label, format: currency })),
          ]}
        />
      ),
    },
  ],
  results: {
    kpis: [
      { key: 'years', label: 'Latest Year', format: (years) => lastYear(years)?.year || 'n/a' },
      { key: 'years', label: 'Latest Total Assets', format: (years) => currency(lastYear(years)?.totalAssets) },
      { key: 'years', label: 'Latest Current Ratio', format: (years) => ratio(lastYear(years)?.currentRatio) },
      { key: 'years', label: 'Latest Debt to Equity', format: (years) => ratio(lastYear(years)?.debtToEquity) },
    ],
    tables: [
      {
        rowsKey: 'years',
        columns: [
          { key: 'year', label: 'Year', type: 'text' },
          { key: 'totalCurrentAssets', label: 'Total Current Assets', type: 'currency' },
          { key: 'totalAssets', label: 'Total Assets', type: 'currency' },
          { key: 'totalCurrentLiabilities', label: 'Total Current Liabilities', type: 'currency' },
          { key: 'totalLiabilities', label: 'Total Liabilities', type: 'currency' },
          { key: 'workingCapital', label: 'Working Capital', type: 'currency' },
          { key: 'currentRatio', label: 'Current Ratio', format: ratio },
          { key: 'debtToEquity', label: 'Debt to Equity', format: ratio },
          { key: 'checks.balanceDifference', label: 'Balance Difference', type: 'currency' },
          {
            key: 'warnings',
            label: 'Warnings',
            type: 'text',
            format: (value) => (Array.isArray(value) && value.length > 0 ? value.join(' ') : 'None'),
          },
        ],
      },
    ],
    notesKey: 'warnings',
  },
  history: {},
};

export default config;
