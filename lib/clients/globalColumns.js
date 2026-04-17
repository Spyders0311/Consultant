export const clientGlobalFields = [
  { key: 'company_name', label: 'Company Name', type: 'text', required: true },
  { key: 'industry', label: 'Industry', type: 'text', required: true },
  { key: 'horizon_years', label: 'Forecast Horizon (Years)', type: 'number', min: 1, max: 50, step: 1, required: true },
  { key: 'current_annual_revenue', label: 'Current Annual Revenue', type: 'number', min: 0, step: 1, required: true },
  { key: 'cogs_percent', label: 'COGS (% of Revenue)', type: 'number', min: 0, max: 100, step: 0.1, required: true },
  { key: 'revenue_growth_percent', label: 'Revenue Growth (%)', type: 'number', min: -100, max: 500, step: 0.1, required: true },
  { key: 'fixed_payroll', label: 'Annual Payroll', type: 'number', min: 0, step: 1, required: true },
  { key: 'fixed_rent_utilities', label: 'Annual Rent + Utilities', type: 'number', min: 0, step: 1, required: true },
  { key: 'fixed_other', label: 'Other Fixed Operating Costs', type: 'number', min: 0, step: 1, required: true },
  { key: 'fixed_expense_growth_percent', label: 'Fixed Expense Growth (%)', type: 'number', min: -100, max: 500, step: 0.1, required: true },
  { key: 'market_growth_percent', label: 'Market Growth (%)', type: 'number', min: -100, max: 500, step: 0.1, required: true },
  { key: 'target_market_share_percent', label: 'Target Market Share Improvement (%)', type: 'number', min: 0, max: 100, step: 0.1, required: true },
  { key: 'inflation_percent', label: 'Inflation (%)', type: 'number', min: -100, max: 500, step: 0.1, required: true },
  { key: 'tax_rate_percent', label: 'Effective Tax Rate (%)', type: 'number', min: 0, max: 100, step: 0.1, required: true },
  { key: 'discount_rate_percent', label: 'Discount Rate (%)', type: 'number', min: 0, max: 100, step: 0.1, required: true },
];

export const clientWizardDefaults = {
  company_name: '',
  industry: '',
  horizon_years: 5,
  current_annual_revenue: 2500000,
  cogs_percent: 52,
  revenue_growth_percent: 9,
  fixed_payroll: 420000,
  fixed_rent_utilities: 95000,
  fixed_other: 130000,
  fixed_expense_growth_percent: 3,
  market_growth_percent: 4,
  target_market_share_percent: 2.5,
  inflation_percent: 2.5,
  tax_rate_percent: 25,
  discount_rate_percent: 12,
};

const numericFieldKeys = new Set(
  clientGlobalFields.filter((field) => field.type === 'number').map((field) => field.key),
);

export function normalizeClientPayload(raw, options = {}) {
  const { partial = false } = options;
  const normalized = {};
  for (const field of clientGlobalFields) {
    const value = raw?.[field.key];

    if (partial && value == null) {
      continue;
    }

    if (field.type === 'text') {
      const text = typeof value === 'string' ? value.trim() : '';
      if (field.required && !text) {
        throw new Error(`${field.label} is required.`);
      }
      normalized[field.key] = text;
      continue;
    }

    if (numericFieldKeys.has(field.key)) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        throw new Error(`${field.label} must be a valid number.`);
      }
      if (field.min != null && parsed < field.min) {
        throw new Error(`${field.label} must be at least ${field.min}.`);
      }
      if (field.max != null && parsed > field.max) {
        throw new Error(`${field.label} must be at most ${field.max}.`);
      }
      normalized[field.key] = parsed;
    }
  }

  return normalized;
}
