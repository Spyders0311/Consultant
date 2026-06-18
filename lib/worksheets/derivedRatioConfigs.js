export const DERIVED_RATIO_CONFIGS = {
  'comparative-activity-ratios': {
    title: 'COMPARATIVE ACTIVITY RATIOS',
    description: 'Activity ratios derived from latest P&L and balance sheet runs.',
    focusKeys: ['arTurnover', 'avgCollectionPeriodDays', 'inventoryTurnover', 'inventoryTurnoverDays'],
  },
  'gross-profit-margin': {
    title: 'GROSS PROFIT MARGIN',
    description: 'Gross profit margin from latest P&L year.',
    focusKeys: ['grossProfitMarginPct'],
  },
  'net-profit-margin': {
    title: 'NET PROFIT MARGIN',
    description: 'Net profit margin from latest P&L year.',
    focusKeys: ['netProfitMarginPct', 'operatingMarginPct'],
  },
  'current-ratio': {
    title: 'CURRENT RATIO',
    description: 'Current ratio from latest balance sheet year.',
    focusKeys: ['currentRatio'],
  },
  'debt-ratio': {
    title: 'DEBT RATIO',
    description: 'Debt ratio from latest balance sheet year.',
    focusKeys: ['debtRatio', 'debtToEquity'],
  },
  'equity-ratio': {
    title: 'EQUITY RATIO',
    description: 'Equity ratio from latest balance sheet year.',
    focusKeys: ['equityRatio'],
  },
  'inventory-turnover-ratio': {
    title: 'INVENTORY TURNOVER RATIO',
    description: 'Inventory turnover from P&L COGS and balance sheet inventory.',
    focusKeys: ['inventoryTurnover', 'inventoryTurnoverDays'],
  },
  'average-collection-period': {
    title: 'Average Collection Period',
    description: 'Average collection period from P&L revenue and balance sheet A/R.',
    focusKeys: ['avgCollectionPeriodDays', 'arTurnover'],
  },
};

export const DERIVED_RATIO_LABELS = {
  grossProfitMarginPct: 'Gross Profit Margin',
  netProfitMarginPct: 'Net Profit Margin',
  operatingMarginPct: 'Operating Margin',
  currentRatio: 'Current Ratio',
  debtRatio: 'Debt Ratio',
  equityRatio: 'Equity Ratio',
  debtToEquity: 'Debt to Equity',
  inventoryTurnover: 'Inventory Turnover',
  inventoryTurnoverDays: 'Days Inventory Held',
  avgCollectionPeriodDays: 'Avg Collection Period (days)',
  arTurnover: 'A/R Turnover',
  workingCapital: 'Working Capital',
};
