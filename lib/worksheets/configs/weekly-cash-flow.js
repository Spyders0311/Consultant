function defaultWeeks() {
  return Array.from({ length: 6 }, (_, index) => ({
    weekLabel: `Week ${index + 1}`,
    cashReceipts: '',
    newSales: '',
    payroll: '',
    materials: '',
    rentUtilities: '',
    loanPayments: '',
    creditCardPayments: '',
    otherDisbursements: '',
  }));
}

const WEEK_NUMBER_FIELDS = [
  'cashReceipts',
  'newSales',
  'payroll',
  'materials',
  'rentUtilities',
  'loanPayments',
  'creditCardPayments',
  'otherDisbursements',
];

const config = {
  key: 'weekly-cash-flow',
  kicker: 'Financial Tools',
  title: 'Weekly Cash Flow Forecast',
  description:
    'Initial app port of the F-900b cash flow workbook. Forecast receipts, disbursements, cash reserve shortfalls, and line-of-credit usage by week.',
  source: null,
  api: {
    calculate: '/api/worksheets/weekly-cash-flow/calculate',
    runs: '/api/worksheets/weekly-cash-flow/runs',
  },
  pdf: null,
  submitLabel: 'Calculate & Save',
  fields: {
    beginningCash: { label: 'Beginning Cash', type: 'number', min: 0 },
    lineOfCreditLimit: { label: 'Line of Credit Limit', type: 'number', min: 0 },
    beginningLineOfCreditBalance: { label: 'Beginning LOC Balance', type: 'number', min: 0 },
    minimumCashReserve: { label: 'Minimum Cash Reserve', type: 'number', min: 0 },
    notes: {
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Optional assumptions, timing notes, or collection concerns.',
      fullWidth: true,
    },
  },
  collections: {
    weeks: {
      label: 'Weeks',
      rowLabel: 'Week',
      maxRows: 13,
      defaultRows: defaultWeeks(),
      fields: [
        { name: 'weekLabel', label: 'Week', type: 'text' },
        { name: 'cashReceipts', label: 'Receipts', type: 'number', min: 0 },
        { name: 'newSales', label: 'New Sales', type: 'number', min: 0 },
        { name: 'payroll', label: 'Payroll', type: 'number', min: 0 },
        { name: 'materials', label: 'Materials', type: 'number', min: 0 },
        { name: 'rentUtilities', label: 'Rent/Utilities', type: 'number', min: 0 },
        { name: 'loanPayments', label: 'Loans', type: 'number', min: 0 },
        { name: 'creditCardPayments', label: 'Cards', type: 'number', min: 0 },
        { name: 'otherDisbursements', label: 'Other', type: 'number', min: 0 },
      ],
    },
  },
  steps: [
    {
      id: 'inputs',
      fieldNames: [
        'beginningCash',
        'lineOfCreditLimit',
        'beginningLineOfCreditBalance',
        'minimumCashReserve',
        'notes',
      ],
      collections: ['weeks'],
    },
  ],
  canRun: (form, { num }) =>
    (form.weeks || []).some((week) => WEEK_NUMBER_FIELDS.some((field) => num(week[field]) > 0)),
  results: {
    title: 'Cash Flow Summary',
    kpis: [
      { key: 'endingCash', label: 'Ending Cash', type: 'currency' },
      { key: 'endingLineOfCreditBalance', label: 'Ending LOC Balance', type: 'currency' },
      { key: 'lowestCashBalance', label: 'Lowest Cash', type: 'currency' },
      { key: 'peakLineOfCreditUse', label: 'Peak LOC Use', type: 'currency' },
    ],
    tables: [
      {
        rowsKey: 'weeks',
        columns: [
          { key: 'weekLabel', label: 'Week', type: 'text' },
          { key: 'cashReceipts', label: 'Receipts', type: 'currency' },
          { key: 'totalDisbursements', label: 'Disbursements', type: 'currency' },
          { key: 'netCashFlow', label: 'Net Cash', type: 'currency' },
          { key: 'lineOfCreditDraw', label: 'LOC Draw', type: 'currency' },
          { key: 'lineOfCreditRepayment', label: 'LOC Repay', type: 'currency' },
          { key: 'endingCash', label: 'Ending Cash', type: 'currency' },
        ],
      },
    ],
    notesKey: 'warnings',
  },
  history: {
    metric: { key: 'endingCash', label: 'ending cash', type: 'currency' },
  },
};

export default config;
