import { mapClientRowToBasicClientInfoForm } from '@/lib/worksheets/clientProfile';

export function mapClientRowToProfile(client) {
  return mapClientRowToBasicClientInfoForm(client);
}

export function mapClientRowToFiveYearBaseline(client) {
  if (!client) return null;
  const fixedTotal =
    Number(client.fixed_payroll || 0) + Number(client.fixed_rent_utilities || 0) + Number(client.fixed_other || 0);

  return {
    horizonYears: client.horizon_years || 5,
    baseRevenue: client.current_annual_revenue ?? '',
    revenueGrowthPercent: client.revenue_growth_percent ?? '',
    baseCogsPercent: client.cogs_percent ?? '',
    baseFixedExpenses: fixedTotal || '',
    fixedPayroll: client.fixed_payroll ?? '',
    fixedRentUtilities: client.fixed_rent_utilities ?? '',
    fixedOther: client.fixed_other ?? '',
    fixedExpenseGrowthPercent: client.fixed_expense_growth_percent ?? '',
    taxRatePercent: client.tax_rate_percent ?? '',
    marketGrowthPercent: client.market_growth_percent ?? '',
    inflationPercent: client.inflation_percent ?? '',
    discountRatePercent: client.discount_rate_percent ?? '',
  };
}

export function mapClientRowToApiClient(client) {
  if (!client) return {};
  return {
    currentAnnualRevenue: client.current_annual_revenue,
    cogsPercent: client.cogs_percent,
    revenueGrowthPercent: client.revenue_growth_percent,
    fixedPayroll: client.fixed_payroll,
    fixedRentUtilities: client.fixed_rent_utilities,
    fixedOther: client.fixed_other,
    horizonYears: client.horizon_years,
  };
}
