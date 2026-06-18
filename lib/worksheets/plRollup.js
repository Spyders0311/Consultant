import { PL_LINE_CATEGORIES } from '@/lib/worksheets/plCategories';

const COGS_CATEGORIES = new Set(['cogs', 'cogs_labor', 'cogs_material', 'cogs_subcontract']);
const OPEX_CATEGORIES = new Set(['opex', 'opex_payroll', 'opex_rent', 'opex_utilities']);
const LABOR_CATEGORIES = new Set(['cogs_labor', 'opex_payroll', 'labor']);

export function rollupPLLineItems(lineItems) {
  const totals = {
    revenue: 0,
    cogs: 0,
    operatingExpenses: 0,
    otherExpenses: 0,
    laborAmount: 0,
    indirectCostsAmount: 0,
    generalAdministrativeCostsAmount: 0,
  };

  if (!Array.isArray(lineItems)) return totals;

  for (const item of lineItems) {
    const category = String(item?.category || '').toLowerCase();
    const amount = Number(item?.amount) || 0;

    if (category === 'revenue') {
      totals.revenue += amount;
    } else if (COGS_CATEGORIES.has(category)) {
      totals.cogs += amount;
      if (LABOR_CATEGORIES.has(category)) totals.laborAmount += amount;
    } else if (OPEX_CATEGORIES.has(category)) {
      totals.operatingExpenses += amount;
      if (LABOR_CATEGORIES.has(category)) totals.laborAmount += amount;
    } else if (category === 'indirect') {
      totals.indirectCostsAmount += amount;
      totals.operatingExpenses += amount;
    } else if (category === 'general_administrative') {
      totals.generalAdministrativeCostsAmount += amount;
      totals.operatingExpenses += amount;
    } else if (category === 'other') {
      totals.otherExpenses += amount;
    } else {
      totals.otherExpenses += amount;
    }
  }

  return totals;
}

export { PL_LINE_CATEGORIES };
