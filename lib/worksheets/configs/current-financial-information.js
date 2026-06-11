import { parseNumber } from '@/lib/format';

const config = {
  key: 'current-financial-information',
  kicker: 'Analyst Program',
  title: 'Current Financial Information',
  description: 'Capture baseline margin, breakeven load, and working capital posture in one intake run.',
  source: null,
  api: {
    calculate: '/api/worksheets/current-financial-information/calculate',
    runs: '/api/worksheets/current-financial-information/runs',
  },
  pdf: {
    model: 'current-financial-information',
    filename: 'bms-current-financial-information-report.pdf',
    buildResult: (result, { clientId, runId, form }) => ({
      ...result,
      assumptions: {
        annualRevenue: parseNumber(form.annualRevenue),
        annualCogs: parseNumber(form.annualCogs),
        annualFixedExpenses: parseNumber(form.annualFixedExpenses),
        daysSalesOutstanding: parseNumber(form.daysSalesOutstanding),
        daysInventoryOnHand: parseNumber(form.daysInventoryOnHand),
        daysPayablesOutstanding: parseNumber(form.daysPayablesOutstanding),
        workDaysPerYear: parseNumber(form.workDaysPerYear),
        workHoursPerDay: parseNumber(form.workHoursPerDay),
        optionalNotes: String(form.optionalNotes || '').trim(),
      },
      clientId,
      runId,
    }),
  },
  submitLabel: 'Calculate + Save',
  fields: {
    annualRevenue: { label: 'Annual Revenue', type: 'number', min: 0, placeholder: 'e.g. 1250000' },
    annualCogs: { label: 'Annual COGS', type: 'number', min: 0, placeholder: 'e.g. 700000' },
    annualFixedExpenses: { label: 'Annual Fixed Expenses', type: 'number', min: 0, placeholder: 'e.g. 320000' },
    daysSalesOutstanding: { label: 'Days Sales Outstanding (DSO)', type: 'number', min: 0, placeholder: 'e.g. 45' },
    daysInventoryOnHand: { label: 'Days Inventory On Hand (DIO)', type: 'number', min: 0, placeholder: 'e.g. 38' },
    daysPayablesOutstanding: { label: 'Days Payables Outstanding (DPO)', type: 'number', min: 0, placeholder: 'e.g. 30' },
    workDaysPerYear: { label: 'Work Days Per Year', type: 'number', min: 1, placeholder: 'e.g. 250' },
    workHoursPerDay: { label: 'Work Hours Per Day', type: 'number', min: 1, placeholder: 'e.g. 8' },
    optionalNotes: {
      label: 'Optional Notes',
      type: 'textarea',
      rows: 5,
      placeholder: 'Context for assumptions or known outliers.',
    },
  },
  steps: [
    {
      id: 'revenue-margin',
      title: 'Revenue / Margin',
      hint: 'Enter annual revenue and COGS.',
      fieldNames: ['annualRevenue', 'annualCogs'],
      validate: (form, { num }) => num(form.annualRevenue) >= 0 && num(form.annualCogs) >= 0,
    },
    {
      id: 'fixed-expenses',
      title: 'Fixed Expenses',
      hint: 'Set annual fixed overhead burden.',
      fieldNames: ['annualFixedExpenses', 'optionalNotes'],
      validate: (form, { num }) => num(form.annualFixedExpenses) >= 0,
    },
    {
      id: 'working-capital',
      title: 'Working Capital Drivers',
      hint: 'Set DSO, DIO, and DPO assumptions.',
      fieldNames: ['daysSalesOutstanding', 'daysInventoryOnHand', 'daysPayablesOutstanding'],
      validate: (form, { num }) =>
        num(form.daysSalesOutstanding) >= 0 &&
        num(form.daysInventoryOnHand) >= 0 &&
        num(form.daysPayablesOutstanding) >= 0,
    },
    {
      id: 'capacity',
      title: 'Capacity',
      hint: 'Set work days and work hours assumptions.',
      fieldNames: ['workDaysPerYear', 'workHoursPerDay'],
      validate: (form, { num }) => num(form.workDaysPerYear) > 0 && num(form.workHoursPerDay) > 0,
    },
    {
      id: 'review',
      title: 'Review & Run',
      hint: 'Validate assumptions and run baseline intake.',
      review: true,
    },
  ],
  review: (form, { currency, formatNumber, num }, { runId }) => [
    { label: 'Annual Revenue', value: currency(form.annualRevenue) },
    { label: 'Annual COGS', value: currency(form.annualCogs) },
    { label: 'Annual Fixed Expenses', value: currency(form.annualFixedExpenses) },
    {
      label: 'Cycle Days',
      value: `DSO ${formatNumber(form.daysSalesOutstanding)} + DIO ${formatNumber(form.daysInventoryOnHand)} - DPO ${formatNumber(form.daysPayablesOutstanding)}`,
    },
    { label: 'Capacity', value: `${num(form.workDaysPerYear)} days x ${num(form.workHoursPerDay)} hrs` },
    { label: 'Current Run', value: runId ? `Loaded run ${runId.slice(0, 8)}...` : 'New run (unsaved)' },
  ],
  results: {
    kpis: [
      { key: 'grossMarginAmount', label: 'Gross Margin Amount', type: 'currency' },
      { key: 'grossMarginPercent', label: 'Gross Margin Percent', type: 'percent' },
      { key: 'breakevenRevenue', label: 'Breakeven Revenue', type: 'currency' },
      { key: 'netWorkingCapital', label: 'Net Working Capital', type: 'currency' },
      { key: 'arInvestment', label: 'A/R Investment', type: 'currency' },
      { key: 'inventoryInvestment', label: 'Inventory Investment', type: 'currency' },
      { key: 'apFinancing', label: 'A/P Financing', type: 'currency' },
      {
        key: 'cashConversionCycle',
        label: 'Cash Conversion Cycle',
        format: (value) =>
          value === null || value === undefined || Number.isNaN(Number(value))
            ? 'n/a'
            : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value))} days`,
      },
      { key: 'breakevenDaily', label: 'Breakeven Daily', type: 'currency' },
      { key: 'breakevenWeekly', label: 'Breakeven Weekly', type: 'currency' },
      { key: 'breakevenMonthly', label: 'Breakeven Monthly', type: 'currency' },
      { key: 'breakevenHourly', label: 'Breakeven Hourly', type: 'currency' },
    ],
    notesKey: 'warnings',
  },
  history: {},
};

export default config;
