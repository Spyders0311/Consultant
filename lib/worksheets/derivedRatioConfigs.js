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
  'quick-ratio': {
    title: 'Quick Ratio',
    description: 'Acid-test liquidity from cash and receivables over current liabilities.',
    focusKeys: ['quickRatio', 'currentRatio'],
  },
  'return-on-assets': {
    title: 'Return on Assets',
    description: 'Net income relative to total assets.',
    focusKeys: ['returnOnAssetsPct'],
  },
  'return-on-equity': {
    title: 'Return on Equity',
    description: 'Net income relative to equity.',
    focusKeys: ['returnOnEquityPct', 'debtToEquity'],
  },
  'times-interest-earned-ratio': {
    title: 'Times Interest Earned Ratio',
    description: 'Operating income coverage of interest expense.',
    focusKeys: ['timesInterestEarned'],
  },
  'z-score-private-light-assets': {
    title: 'Z SCORE - PRIVATE & LIGHT ASSETS',
    description: 'Altman-style distress score for light-asset private companies.',
    focusKeys: ['zScorePrivateLightAssets', 'zScoreZone'],
  },
  'z-score-private-heavy-assets': {
    title: 'Z SCORE - PRIVATE & HEAVY ASSETS',
    description: 'Altman-style distress score adjusted for heavy fixed assets.',
    focusKeys: ['zScorePrivateHeavyAssets', 'zScoreZone'],
  },
  'ratios-introduction': {
    title: 'Ratios Introduction',
    description: 'Overview of ratio categories computed from saved financial statements.',
    focusKeys: ['currentRatio', 'grossProfitMarginPct', 'returnOnEquityPct'],
    staticIntro: true,
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
  quickRatio: 'Quick Ratio',
  returnOnAssetsPct: 'Return on Assets',
  returnOnEquityPct: 'Return on Equity',
  timesInterestEarned: 'Times Interest Earned',
  zScorePrivateLightAssets: 'Z-Score (Light Assets)',
  zScorePrivateHeavyAssets: 'Z-Score (Heavy Assets)',
  zScoreZone: 'Z-Score Zone',
};
