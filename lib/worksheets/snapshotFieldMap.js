/** Maps worksheet form fields to client_financial_snapshots keys. */
export const SNAPSHOT_FIELD_MAP = {
  'breakeven-analysis': [
    { formField: 'annualRevenue', snapshotKey: 'annualRevenue' },
    { formField: 'cogsAmount', snapshotKey: 'annualCogs' },
    { formField: 'laborAmount', snapshotKey: 'laborAmount' },
    { formField: 'indirectCostsAmount', snapshotKey: 'indirectCostsAmount' },
    { formField: 'generalAdministrativeCostsAmount', snapshotKey: 'generalAdministrativeCostsAmount' },
    { formField: 'fixedExpensesAmount', snapshotKey: 'annualFixedExpenses' },
  ],
  'working-capital-analysis': [
    { formField: 'annualRevenue', snapshotKey: 'annualRevenue' },
    { formField: 'annualCogs', snapshotKey: 'annualCogs' },
    { formField: 'daysSalesOutstanding', snapshotKey: 'daysSalesOutstanding' },
    { formField: 'daysInventoryOnHand', snapshotKey: 'daysInventoryOnHand' },
    { formField: 'daysPayablesOutstanding', snapshotKey: 'daysPayablesOutstanding' },
    { formField: 'revenueGrowthPercent', snapshotKey: 'revenueGrowthPercent' },
  ],
  'current-financial-information': [
    { formField: 'annualRevenue', snapshotKey: 'annualRevenue' },
    { formField: 'annualCogs', snapshotKey: 'annualCogs' },
    { formField: 'annualFixedExpenses', snapshotKey: 'annualFixedExpenses' },
    { formField: 'laborAmount', snapshotKey: 'laborAmount' },
    { formField: 'indirectCostsAmount', snapshotKey: 'indirectCostsAmount' },
    { formField: 'generalAdministrativeCostsAmount', snapshotKey: 'generalAdministrativeCostsAmount' },
    { formField: 'daysSalesOutstanding', snapshotKey: 'daysSalesOutstanding' },
    { formField: 'daysInventoryOnHand', snapshotKey: 'daysInventoryOnHand' },
    { formField: 'daysPayablesOutstanding', snapshotKey: 'daysPayablesOutstanding' },
  ],
  '5-year-projections': [
    { formField: 'baseRevenue', snapshotKey: 'annualRevenue' },
    { formField: 'baseCogsPercent', snapshotKey: 'cogsPercent' },
    { formField: 'revenueGrowthPercent', snapshotKey: 'revenueGrowthPercent' },
    { formField: 'fixedPayroll', snapshotKey: 'fixedPayroll' },
    { formField: 'fixedRentUtilities', snapshotKey: 'fixedRentUtilities' },
    { formField: 'fixedOther', snapshotKey: 'fixedOther' },
    { formField: 'taxRatePercent', snapshotKey: 'taxRatePercent' },
    { formField: 'marketGrowthPercent', snapshotKey: 'marketGrowthPercent' },
    { formField: 'discountRatePercent', snapshotKey: 'discountRatePercent' },
  ],
};

export const SNAPSHOT_PL_YEAR_FIELDS = [
  { formField: 'revenue', snapshotKey: 'annualRevenue' },
  { formField: 'cogs', snapshotKey: 'annualCogs' },
  { formField: 'operatingExpenses', snapshotKey: 'annualOperatingExpenses' },
  { formField: 'otherExpenses', snapshotKey: 'annualOtherExpenses' },
];
