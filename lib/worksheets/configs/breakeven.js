import { isFiniteNumber, pickLatestYearRow } from './prefill-helpers';

const config = {
  key: 'breakeven-analysis',
  kicker: 'Analyst Program',
  title: 'Breakeven Analysis',
  description:
    'Source-aligned BMS breakeven workflow. The app rebuilds the workbook formulas server-side and keeps the original spreadsheets as provenance.',
  source: null,
  api: {
    calculate: '/api/worksheets/breakeven/calculate',
    runs: '/api/worksheets/breakeven/runs',
  },
  pdf: { model: 'breakeven', filename: 'bms-breakeven-analysis-report.pdf' },
  submitLabel: 'Run Breakeven Analysis',
  fields: {
    annualRevenue: { label: 'Annual Revenue', type: 'number', min: 0, placeholder: 'e.g. 1250000' },
    cogsAmount: { label: 'COGS Amount', type: 'number', min: 0, placeholder: 'e.g. 700000' },
    profitAmount: {
      label: 'Net Profit',
      type: 'number',
      min: 0,
      placeholder: 'Optional, from BMS standalone breakeven',
      optional: true,
    },
    laborAmount: { label: 'Direct Labor', type: 'number', min: 0, placeholder: 'Optional direct labor', optional: true },
    fixedExpensesAmount: {
      label: 'Fixed Expenses',
      type: 'number',
      min: 0,
      placeholder: 'Standalone fixed cost bucket',
    },
    indirectCostsAmount: {
      label: 'Indirect Costs',
      type: 'number',
      min: 0,
      placeholder: 'Analyst Program L3',
      optional: true,
    },
    generalAdministrativeCostsAmount: {
      label: 'General & Administrative Costs',
      type: 'number',
      min: 0,
      placeholder: 'Analyst Program L4',
      optional: true,
    },
    monthsInPeriod: { label: 'Months In Period', type: 'number', min: 1, placeholder: 'e.g. 12', default: '12', optional: true },
    workDaysPerYear: { label: 'Work Days Per Year', type: 'number', min: 1, placeholder: 'e.g. 250', default: '250' },
    workHoursPerDay: { label: 'Work Hours Per Day', type: 'number', min: 1, placeholder: 'e.g. 8', default: '8' },
  },
  steps: [
    {
      id: 'revenue',
      title: 'Revenue & Direct Costs',
      hint: 'Define sales, COGS, labor, and profit.',
      fieldNames: ['annualRevenue', 'cogsAmount', 'profitAmount', 'laborAmount'],
      validate: (form, { num }) => num(form.annualRevenue) > 0,
    },
    {
      id: 'fixed',
      title: 'Fixed & Indirect Costs',
      hint: 'Split costs the way the BMS workbook does.',
      fieldNames: ['fixedExpensesAmount', 'indirectCostsAmount', 'generalAdministrativeCostsAmount'],
      validate: (form, { num }) =>
        num(form.fixedExpensesAmount) >= 0 ||
        num(form.indirectCostsAmount) >= 0 ||
        num(form.generalAdministrativeCostsAmount) >= 0,
    },
    {
      id: 'capacity',
      title: 'Period & Capacity',
      hint: 'Convert breakeven into period, daily, and hourly targets.',
      fieldNames: ['monthsInPeriod', 'workDaysPerYear', 'workHoursPerDay'],
      validate: (form, { num }) => num(form.workDaysPerYear) > 0 && num(form.workHoursPerDay) > 0,
    },
    {
      id: 'review',
      title: 'Review & Run',
      hint: 'Confirm assumptions and run calculation.',
      review: true,
    },
  ],
  review: (form, { currency, num }) => [
    { label: 'Annual Revenue', value: currency(form.annualRevenue) },
    { label: 'COGS', value: currency(form.cogsAmount) },
    { label: 'Fixed Expenses', value: currency(form.fixedExpensesAmount) },
    {
      label: 'Indirect / G&A',
      value: `${currency(form.indirectCostsAmount)} / ${currency(form.generalAdministrativeCostsAmount)}`,
    },
    {
      label: 'Work Capacity',
      value: `${num(form.monthsInPeriod)} months · ${num(form.workDaysPerYear)} days x ${num(form.workHoursPerDay)} hrs`,
    },
  ],
  results: {
    kpis: [
      { key: 'grossMarginAmount', label: 'Gross Margin ($)', type: 'currency' },
      { key: 'grossMarginPercent', label: 'Gross Margin (%)', type: 'percent' },
      { key: 'breakevenRevenue', label: 'Breakeven Revenue', type: 'currency' },
      { key: 'breakevenPercent', label: 'Breakeven % of Current Revenue', type: 'percent' },
      { key: 'netProfitAmount', label: 'Net Profit', type: 'currency' },
      { key: 'variableCostsAmount', label: 'Variable Costs', type: 'currency' },
      { key: 'fixedCostsAmount', label: 'Fixed Costs', type: 'currency' },
      {
        key: 'breakevenDays',
        label: 'Breakeven Days',
        format: (value) => (value === null || value === undefined ? 'n/a' : Number(value).toFixed(1)),
      },
      { key: 'breakevenMonthly', label: 'Breakeven Monthly', type: 'currency' },
      { key: 'breakevenWeekly', label: 'Breakeven Weekly', type: 'currency' },
      { key: 'breakevenDaily', label: 'Breakeven Daily', type: 'currency' },
      { key: 'breakevenHourly', label: 'Breakeven Hourly', type: 'currency' },
    ],
    meta: [{ key: 'formulaBasis', label: 'Formula basis' }],
    notesKey: 'notes',
  },
  history: {},
  prefill: [
    {
      id: 'pl-comparisons',
      label: 'Pull from P&L Comparisons',
      sourceLabel: 'P&L Comparisons',
      endpoint: '/api/worksheets/pl-comparisons/runs',
      map: (sourceRun) => {
        const latestYear = pickLatestYearRow(sourceRun?.inputs?.years);
        if (!latestYear) {
          throw new Error('Latest P&L run has no 4-year input grid to map from.');
        }

        const patch = {};
        const missingFields = [];

        if (isFiniteNumber(latestYear.revenue)) {
          patch.annualRevenue = Number(latestYear.revenue);
        } else {
          missingFields.push('Annual Revenue');
        }

        if (isFiniteNumber(latestYear.cogs)) {
          patch.cogsAmount = Number(latestYear.cogs);
        } else {
          missingFields.push('COGS Amount');
        }

        if (isFiniteNumber(latestYear.operatingExpenses) && isFiniteNumber(latestYear.otherExpenses)) {
          patch.indirectCostsAmount = Number(latestYear.operatingExpenses);
          patch.generalAdministrativeCostsAmount = Number(latestYear.otherExpenses);
          patch.fixedExpensesAmount = Number(latestYear.otherExpenses);
        } else {
          missingFields.push('Indirect and G&A costs');
        }

        if (isFiniteNumber(latestYear.netProfit)) {
          patch.profitAmount = Number(latestYear.netProfit);
        }

        return { patch, missingFields };
      },
    },
  ],
};

export default config;
