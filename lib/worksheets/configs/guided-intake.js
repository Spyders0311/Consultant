function pick(value, fallback) {
  return value === null || value === undefined ? fallback : value;
}

const config = {
  key: 'guided-intake',
  kicker: 'Analyst Wizard',
  title: 'Guided Financial Intake',
  description:
    'Analyst worksheet. Answer one section at a time. The backend handles the protected math logic and sends back projections.',
  source: null,
  api: {
    calculate: '/api/analyst-wizard/calculate',
    runs: null,
  },
  pdf: {
    model: 'analyst-wizard',
    filename: 'bms-analyst-wizard-report.pdf',
    buildResult: (result) => result,
  },
  submitLabel: 'Run Secure Calculation',
  // Defaults mirror the legacy AnalystWizard; the page passes the client row
  // so intake starts from this client's saved baseline assumptions.
  initialOverrides: (client) => ({
    companyName: pick(client.company_name, ''),
    industry: pick(client.industry, ''),
    horizonYears: pick(client.horizon_years, 5),
    currentAnnualRevenue: pick(client.current_annual_revenue, 2500000),
    cogsPercent: pick(client.cogs_percent, 52),
    revenueGrowthPercent: pick(client.revenue_growth_percent, 9),
    fixedPayroll: pick(client.fixed_payroll, 420000),
    fixedRentUtilities: pick(client.fixed_rent_utilities, 95000),
    fixedOther: pick(client.fixed_other, 130000),
    fixedExpenseGrowthPercent: pick(client.fixed_expense_growth_percent, 3),
    marketGrowthPercent: pick(client.market_growth_percent, 4),
    targetMarketSharePercent: pick(client.target_market_share_percent, 2.5),
    inflationPercent: pick(client.inflation_percent, 2.5),
    taxRatePercent: pick(client.tax_rate_percent, 25),
    discountRatePercent: pick(client.discount_rate_percent, 12),
  }),
  fields: {
    companyName: { label: 'Company Name', type: 'text', default: '' },
    industry: { label: 'Industry', type: 'text', default: '' },
    horizonYears: { label: 'Forecast Horizon (Years)', type: 'number', min: 3, max: 10, default: 5 },
    currentAnnualRevenue: { label: 'Current Annual Revenue', type: 'number', min: 0, default: 2500000 },
    cogsPercent: { label: 'COGS (% of Revenue)', type: 'number', min: 0, max: 100, step: 0.1, default: 52 },
    revenueGrowthPercent: {
      label: 'Internal Revenue Growth (%)',
      type: 'number',
      min: -50,
      max: 100,
      step: 0.1,
      default: 9,
    },
    fixedPayroll: { label: 'Annual Payroll', type: 'number', min: 0, default: 420000 },
    fixedRentUtilities: { label: 'Annual Rent + Utilities', type: 'number', min: 0, default: 95000 },
    fixedOther: { label: 'Other Fixed Operating Costs', type: 'number', min: 0, default: 130000 },
    fixedExpenseGrowthPercent: {
      label: 'Fixed Expense Growth (%)',
      type: 'number',
      min: -20,
      max: 30,
      step: 0.1,
      default: 3,
    },
    marketGrowthPercent: { label: 'Market Growth (%)', type: 'number', min: -20, max: 40, step: 0.1, default: 4 },
    targetMarketSharePercent: {
      label: 'Target Market Share Improvement (%)',
      type: 'number',
      min: 0,
      max: 30,
      step: 0.1,
      default: 2.5,
    },
    inflationPercent: { label: 'Inflation (%)', type: 'number', min: -5, max: 20, step: 0.1, default: 2.5 },
    taxRatePercent: { label: 'Effective Tax Rate (%)', type: 'number', min: 0, max: 60, step: 0.1, default: 25 },
    discountRatePercent: { label: 'Discount Rate (%)', type: 'number', min: 1, max: 40, step: 0.1, default: 12 },
  },
  steps: [
    {
      id: 'company',
      title: 'Company Info',
      hint: 'Basic profile details for report context.',
      fieldNames: ['companyName', 'industry', 'horizonYears'],
      validate: (form) => String(form.companyName || '').trim().length > 0 && String(form.industry || '').trim().length > 0,
    },
    {
      id: 'revenue',
      title: 'Revenue & COGS',
      hint: 'Top-line assumptions and cost of goods sold.',
      fieldNames: ['currentAnnualRevenue', 'cogsPercent', 'revenueGrowthPercent'],
      validate: (form, { num }) => num(form.currentAnnualRevenue) > 0,
    },
    {
      id: 'fixed',
      title: 'Fixed Expenses',
      hint: 'Recurring operating costs to carry each year.',
      fieldNames: ['fixedPayroll', 'fixedRentUtilities', 'fixedOther', 'fixedExpenseGrowthPercent'],
      validate: (form, { num }) => num(form.fixedPayroll) >= 0,
    },
    {
      id: 'market',
      title: 'Market Assumptions',
      hint: 'Macroeconomic and risk assumptions.',
      fieldNames: [
        'marketGrowthPercent',
        'targetMarketSharePercent',
        'inflationPercent',
        'taxRatePercent',
        'discountRatePercent',
      ],
      validate: (form, { num }) => num(form.discountRatePercent) > 0,
    },
  ],
  payload: (form, { num }) => ({
    companyName: String(form.companyName || '').trim(),
    industry: String(form.industry || '').trim(),
    horizonYears: num(form.horizonYears),
    revenue: {
      currentAnnualRevenue: num(form.currentAnnualRevenue),
      cogsPercent: num(form.cogsPercent),
      revenueGrowthPercent: num(form.revenueGrowthPercent),
    },
    fixedExpenses: {
      payroll: num(form.fixedPayroll),
      rentUtilities: num(form.fixedRentUtilities),
      other: num(form.fixedOther),
      fixedExpenseGrowthPercent: num(form.fixedExpenseGrowthPercent),
    },
    marketAssumptions: {
      marketGrowthPercent: num(form.marketGrowthPercent),
      targetMarketSharePercent: num(form.targetMarketSharePercent),
      inflationPercent: num(form.inflationPercent),
      taxRatePercent: num(form.taxRatePercent),
      discountRatePercent: num(form.discountRatePercent),
    },
  }),
  results: {
    kpis: [
      { key: 'summary.enterpriseValueNpv', label: 'Enterprise Value (NPV)', type: 'currency' },
      { key: 'summary.yearOneEbitdaMarginPercent', label: 'Year 1 EBITDA Margin', type: 'percent' },
      { key: 'summary.cumulativeFreeCashFlow', label: 'Cumulative Free Cash Flow', type: 'currency' },
      { key: 'summary.blendedGrowthRatePercent', label: 'Blended Growth Rate', type: 'percent' },
    ],
    tables: [
      {
        rowsKey: 'projections',
        columns: [
          { key: 'year', label: 'Year', type: 'text' },
          { key: 'revenue', label: 'Revenue', type: 'currency' },
          { key: 'grossProfit', label: 'Gross Profit', type: 'currency' },
          { key: 'ebitda', label: 'EBITDA', type: 'currency' },
          { key: 'freeCashFlow', label: 'Free Cash Flow', type: 'currency' },
        ],
      },
    ],
    meta: [
      { key: 'engineVersion', label: 'Engine' },
      {
        key: 'workbook.sha256',
        label: 'Workbook fingerprint',
        format: (value) => `${String(value).slice(0, 12)}...`,
      },
    ],
    notesKey: 'warnings',
  },
  history: {},
};

export default config;
