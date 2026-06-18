/** Build snapshot patch payloads when worksheets save runs. */
import { rollupPLLineItems } from '@/lib/worksheets/plRollup';

export function buildSnapshotPatch(worksheetKey, inputs, outputs) {
  switch (worksheetKey) {
    case 'p-l-comparisons': {
      const latest = inputs?.years?.[inputs.years.length - 1];
      if (!latest) return {};
      const rolled =
        latest.lineItems?.length > 0
          ? rollupPLLineItems(latest.lineItems)
          : {
              revenue: latest.revenue,
              cogs: latest.cogs,
              operatingExpenses: latest.operatingExpenses,
              otherExpenses: latest.otherExpenses,
              laborAmount: latest.laborAmount,
              indirectCostsAmount: latest.indirectCostsAmount,
              generalAdministrativeCostsAmount: latest.generalAdministrativeCostsAmount,
            };
      return {
        annualRevenue: rolled.revenue ?? latest.revenue,
        annualCogs: rolled.cogs ?? latest.cogs,
        annualOperatingExpenses: rolled.operatingExpenses ?? latest.operatingExpenses,
        annualOtherExpenses: rolled.otherExpenses ?? latest.otherExpenses,
        laborAmount: rolled.laborAmount,
        indirectCostsAmount: rolled.indirectCostsAmount,
        generalAdministrativeCostsAmount: rolled.generalAdministrativeCostsAmount,
      };
    }
    case 'balance-sht-comparisons': {
      const latest = inputs?.years?.[inputs.years.length - 1];
      if (!latest) return {};
      const currentAssets =
        Number(latest.cash || 0) +
        Number(latest.ar || 0) +
        Number(latest.inventory || 0) +
        Number(latest.otherCurrentAssets || 0);
      const currentLiabilities =
        Number(latest.ap || 0) +
        Number(latest.currentPortionLtd || 0) +
        Number(latest.otherCurrentLiabilities || 0);
      return {
        latestYear: latest.year,
        totalCurrentAssets: currentAssets,
        totalCurrentLiabilities: currentLiabilities,
        totalEquity: latest.equity,
      };
    }
    case 'breakeven-analysis':
      return {
        annualRevenue: inputs?.annualRevenue,
        annualCogs: inputs?.cogsAmount,
        laborAmount: inputs?.laborAmount,
        indirectCostsAmount: inputs?.indirectCostsAmount,
        generalAdministrativeCostsAmount: inputs?.generalAdministrativeCostsAmount,
        annualFixedExpenses: inputs?.fixedExpensesAmount,
        breakevenRevenue: outputs?.breakevenRevenue,
      };
    case 'working-capital-analysis':
      return {
        annualRevenue: inputs?.annualRevenue,
        annualCogs: inputs?.annualCogs,
        daysSalesOutstanding: inputs?.daysSalesOutstanding,
        daysInventoryOnHand: inputs?.daysInventoryOnHand,
        daysPayablesOutstanding: inputs?.daysPayablesOutstanding,
        revenueGrowthPercent: inputs?.revenueGrowthPercent,
        netWorkingCapital: outputs?.netWorkingCapital,
        cashConversionCycle: outputs?.cashConversionCycle,
      };
    case 'current-financial-information':
      return {
        annualRevenue: inputs?.annualRevenue,
        annualCogs: inputs?.annualCogs,
        annualFixedExpenses: inputs?.annualFixedExpenses,
        laborAmount: inputs?.laborAmount,
        indirectCostsAmount: inputs?.indirectCostsAmount,
        generalAdministrativeCostsAmount: inputs?.generalAdministrativeCostsAmount,
        daysSalesOutstanding: inputs?.daysSalesOutstanding,
        daysInventoryOnHand: inputs?.daysInventoryOnHand,
        daysPayablesOutstanding: inputs?.daysPayablesOutstanding,
        netWorkingCapital: outputs?.netWorkingCapital,
        breakevenRevenue: outputs?.breakevenRevenue,
      };
    case '5-year-projections':
      return {
        annualRevenue: inputs?.baseRevenue,
        revenueGrowthPercent: inputs?.revenueGrowthPercent,
        cogsPercent: inputs?.baseCogsPercent,
        fixedPayroll: inputs?.fixedPayroll,
        fixedRentUtilities: inputs?.fixedRentUtilities,
        fixedOther: inputs?.fixedOther,
        taxRatePercent: inputs?.taxRatePercent,
        marketGrowthPercent: inputs?.marketGrowthPercent,
        discountRatePercent: inputs?.discountRatePercent,
        enterpriseValueNpv: outputs?.summary?.enterpriseValueNpv,
      };
    default:
      return {};
  }
}
