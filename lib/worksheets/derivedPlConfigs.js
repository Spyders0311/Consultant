export const DERIVED_PL_CONFIGS = {
  'p-l-comparisons-min-max': {
    title: 'P&L COMPARISONS MIN MAX',
    description: 'Minimum, maximum, and spread across saved P&L comparison years.',
    analysisType: 'min-max',
    endpoint: '/api/worksheets/pl-analysis/calculate',
  },
  'cost-of-business-yr1-vs-yr2': {
    title: 'Cost of Business YR1 Vs. YR2',
    description: 'Year-over-year cost and margin change between years 1 and 2.',
    analysisType: 'yr1-vs-yr2',
    endpoint: '/api/worksheets/pl-analysis/calculate',
  },
  'cost-of-business-yr3-vs-yr4': {
    title: 'Cost of Business YR3 Vs. YR4',
    description: 'Year-over-year cost and margin change between years 3 and 4.',
    analysisType: 'yr3-vs-yr4',
    endpoint: '/api/worksheets/pl-analysis/calculate',
  },
  '4-yr-pie': {
    title: '4 YR PIE',
    description: 'Four-year revenue share breakdown from P&L comparisons.',
    analysisType: 'four-year-pie',
    endpoint: '/api/worksheets/pl-analysis/calculate',
  },
};
