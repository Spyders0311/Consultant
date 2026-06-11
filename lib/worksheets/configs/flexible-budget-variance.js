const config = {
  key: 'flexible-budget-variance',
  kicker: 'Financial Tools',
  title: 'Flexible Budget / Variance',
  description:
    'Initial app port of the F-700d flexible budget workbook. Compare static budget, flexible budget, and actual performance for the selected period.',
  source: null,
  api: {
    calculate: '/api/worksheets/flexible-budget-variance/calculate',
    runs: '/api/worksheets/flexible-budget-variance/runs',
  },
  pdf: null,
  submitLabel: 'Calculate & Save',
  fields: {
    periodLabel: { label: 'Period Label', type: 'text', placeholder: 'January 2026' },
    budgetRevenue: { label: 'Budget Revenue', type: 'number', min: 0 },
    actualRevenue: { label: 'Actual Revenue', type: 'number', min: 0 },
    budgetCogsPercent: { label: 'Budget COGS %', type: 'number', min: 0, max: 100, step: 0.1 },
    actualCogs: { label: 'Actual COGS', type: 'number', min: 0 },
    budgetVariableExpensePercent: {
      label: 'Budget Variable Expense %',
      type: 'number',
      min: 0,
      max: 100,
      step: 0.1,
    },
    actualVariableExpenses: { label: 'Actual Variable Expenses', type: 'number', min: 0 },
    budgetFixedExpenses: { label: 'Budget Fixed Expenses', type: 'number', min: 0 },
    actualFixedExpenses: { label: 'Actual Fixed Expenses', type: 'number', min: 0 },
    notes: {
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Optional period notes, assumptions, or unusual items.',
      fullWidth: true,
    },
  },
  steps: [
    {
      id: 'inputs',
      fieldNames: [
        'periodLabel',
        'budgetRevenue',
        'actualRevenue',
        'budgetCogsPercent',
        'actualCogs',
        'budgetVariableExpensePercent',
        'actualVariableExpenses',
        'budgetFixedExpenses',
        'actualFixedExpenses',
        'notes',
      ],
    },
  ],
  canRun: (form, { num }) =>
    String(form.periodLabel || '').trim().length > 0 &&
    num(form.budgetRevenue) > 0 &&
    num(form.actualRevenue) >= 0,
  results: {
    title: 'Variance Summary',
    kpis: [
      { key: 'flexibleBudgetOperatingIncome', label: 'Flexible Budget OI', type: 'currency' },
      { key: 'actualOperatingIncome', label: 'Actual OI', type: 'currency' },
      { key: 'operatingIncomeVariance', label: 'OI Variance', type: 'currency' },
      { key: 'salesVolumeVariance', label: 'Sales Volume Variance', type: 'currency' },
    ],
    tables: [
      {
        rowsKey: 'rows',
        columns: [
          { key: 'lineItem', label: 'Line Item', type: 'text' },
          { key: 'staticBudget', label: 'Static Budget', type: 'currency' },
          { key: 'flexibleBudget', label: 'Flexible Budget', type: 'currency' },
          { key: 'actual', label: 'Actual', type: 'currency' },
          { key: 'variance', label: 'Variance', type: 'currency' },
          { key: 'variancePercent', label: 'Variance %', type: 'percent' },
          {
            key: 'favorable',
            label: 'Status',
            type: 'text',
            format: (value) => (value ? 'Favorable' : 'Unfavorable'),
          },
        ],
      },
    ],
    notesKey: 'warnings',
  },
  history: {
    metric: { key: 'actualOperatingIncome', label: 'actual operating income', type: 'currency' },
  },
};

export default config;
