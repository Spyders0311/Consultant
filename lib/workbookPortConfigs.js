const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const BUDGET_CATEGORY_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'variable-cost', label: 'Variable Cost' },
  { value: 'fixed-cost', label: 'Fixed Cost' },
];

const PL_CATEGORY_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'cogs', label: 'COGS' },
  { value: 'opex', label: 'Operating Expense' },
];

const ESTIMATE_COST_TYPE_OPTIONS = [
  { value: 'labor', label: 'Labor' },
  { value: 'material', label: 'Material' },
  { value: 'subcontract', label: 'Subcontract' },
  { value: 'equipment', label: 'Equipment' },
];

const JOB_COST_CATEGORY_OPTIONS = [
  { value: 'Labor', label: 'Labor' },
  { value: 'Material', label: 'Material' },
  { value: 'Subcontract', label: 'Subcontract' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Overhead', label: 'Overhead' },
];

export const WORKBOOK_PORT_CONFIGS = {
  'bms-marketing-forecast': {
    kicker: 'Marketing Workbook',
    title: 'BMS Marketing Forecast',
    source: 'BMS Marketing Forecast',
    description: 'Model survey fees, cash collections, staffing, and marketing spend across forecast years.',
    scalarFields: [
      { name: 'surveyFee', label: 'Survey Fee', type: 'number', placeholder: 'e.g. 2500' },
      { name: 'cashCollectPerSale', label: 'Cash Collect Per Sale', type: 'number', placeholder: 'e.g. 12000' },
      { name: 'averageHoursPerGo', label: 'Average Hours Per Job', type: 'number', placeholder: 'e.g. 6' },
      { name: 'averageRatePerHour', label: 'Average Rate Per Hour', type: 'number', placeholder: 'e.g. 85' },
      { name: 'commissionPercent', label: 'Commission %', type: 'percent', placeholder: 'e.g. 10' },
      { name: 'salaryPerHead', label: 'Salary Per Sales Head', type: 'number', placeholder: 'e.g. 65000' },
    ],
    collections: [
      {
        key: 'forecastYears',
        title: 'Forecast Years',
        rowLabel: 'Year',
        minRows: 1,
        maxRows: 5,
        defaultRowCount: 3,
        fields: [
          { name: 'period', label: 'Period', type: 'text' },
          { name: 'salesHeadcount', label: 'Sales Headcount', type: 'number' },
          { name: 'surveyStarts', label: 'Survey Starts', type: 'number' },
          { name: 'cashCollectJobs', label: 'Cash Collect Jobs', type: 'number' },
          { name: 'marketingSpend', label: 'Marketing Spend', type: 'number' },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalRevenue', label: 'Total Revenue', format: 'currency' },
      { key: 'totalCost', label: 'Total Cost', format: 'currency' },
      { key: 'totalOperatingIncome', label: 'Operating Income', format: 'currency' },
      { key: 'peakHeadcount', label: 'Peak Headcount', format: 'number' },
      { key: 'averageMarginPct', label: 'Average Margin', format: 'percent' },
    ],
    tableFields: [
      { key: 'period', label: 'Period', format: 'text' },
      { key: 'totalRevenue', label: 'Revenue', format: 'currency' },
      { key: 'totalCost', label: 'Cost', format: 'currency' },
      { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
      { key: 'marginPct', label: 'Margin %', format: 'percent' },
    ],
    historyMetric: { key: 'totalOperatingIncome', label: 'Operating Income', format: 'currency' },
  },

  'dashboard-gantt-chart': {
    kicker: 'Project Dashboard',
    title: 'Dashboard Gantt Chart',
    source: 'Dashboard Gantt Chart',
    description: 'Track task schedules, progress, and overdue status for a project dashboard.',
    scalarFields: [
      { name: 'projectName', label: 'Project Name', type: 'text', placeholder: 'e.g. Q3 Implementation' },
      { name: 'reportDate', label: 'Report Date', type: 'date' },
    ],
    collections: [
      {
        key: 'tasks',
        title: 'Tasks',
        rowLabel: 'Task',
        minRows: 1,
        maxRows: 40,
        defaultRowCount: 3,
        fields: [
          { name: 'category', label: 'Category', type: 'text' },
          { name: 'activity', label: 'Activity', type: 'text' },
          { name: 'person', label: 'Person', type: 'text' },
          { name: 'startDate', label: 'Start Date', type: 'date' },
          { name: 'endDate', label: 'End Date', type: 'date' },
          { name: 'percentDone', label: '% Done', type: 'percent' },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalTasks', label: 'Total Tasks', format: 'number' },
      { key: 'completedTasks', label: 'Completed', format: 'number' },
      { key: 'averageProgressPct', label: 'Weighted Progress', format: 'percent' },
      { key: 'overdueTasks', label: 'Overdue Tasks', format: 'number' },
    ],
    tableFields: [
      { key: 'activity', label: 'Activity', format: 'text' },
      { key: 'person', label: 'Person', format: 'text' },
      { key: 'startDate', label: 'Start', format: 'text' },
      { key: 'endDate', label: 'End', format: 'text' },
      { key: 'percentDone', label: '% Done', format: 'percent' },
      { key: 'status', label: 'Status', format: 'text' },
    ],
    historyMetric: { key: 'averageProgressPct', label: 'Progress', format: 'percent' },
  },

  'flex-budget-worksheet': {
    kicker: 'Budget Planning',
    title: 'Flex Budget Worksheet',
    source: 'Flex Budget Worksheet',
    description: 'Build a flexible annual budget with contribution margin and breakeven targets.',
    scalarFields: [
      { name: 'monthsInBudget', label: 'Months in Budget', type: 'number', placeholder: '12', defaultValue: '12' },
      { name: 'businessDaysInYear', label: 'Business Days in Year', type: 'number', placeholder: '260', defaultValue: '260' },
      { name: 'incomeTaxRatePercent', label: 'Income Tax Rate %', type: 'percent', placeholder: 'e.g. 25' },
    ],
    collections: [
      {
        key: 'budgetLines',
        title: 'Budget Lines',
        rowLabel: 'Line',
        minRows: 1,
        maxRows: 40,
        defaultRowCount: 4,
        fields: [
          { name: 'category', label: 'Category', type: 'select', options: BUDGET_CATEGORY_OPTIONS },
          { name: 'lineItem', label: 'Line Item', type: 'text' },
          { name: 'currentAnnual', label: 'Current Annual', type: 'number' },
          { name: 'growthPct', label: 'Growth %', type: 'percent' },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalRevenue', label: 'Total Revenue', format: 'currency' },
      { key: 'contributionMarginPct', label: 'Contribution Margin', format: 'percent' },
      { key: 'breakevenSales', label: 'Breakeven Sales', format: 'currency' },
      { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
      { key: 'netIncome', label: 'Net Income', format: 'currency' },
    ],
    tableFields: [
      { key: 'lineItem', label: 'Line Item', format: 'text' },
      { key: 'category', label: 'Category', format: 'text' },
      { key: 'budgetedAnnual', label: 'Budgeted Annual', format: 'currency' },
      { key: 'monthlyAverage', label: 'Monthly Avg', format: 'currency' },
    ],
    historyMetric: { key: 'netIncome', label: 'Net Income', format: 'currency' },
  },

  'sales-pipeline-forecast': {
    kicker: 'Sales Forecast',
    title: 'Sales Pipeline Forecast',
    source: 'Sales Pipeline Forecast',
    description: 'Forecast revenue and order volume by product using growth assumptions.',
    scalarFields: [
      { name: 'defaultRevenueIncreasePct', label: 'Default Revenue Increase %', type: 'percent', placeholder: 'e.g. 10' },
      { name: 'defaultOrderIncreasePct', label: 'Default Order Increase %', type: 'percent', placeholder: 'e.g. 5' },
    ],
    collections: [
      {
        key: 'products',
        title: 'Products',
        rowLabel: 'Product',
        minRows: 1,
        maxRows: 30,
        defaultRowCount: 3,
        fields: [
          { name: 'productName', label: 'Product Name', type: 'text' },
          { name: 'actualRevenue', label: 'Actual Revenue', type: 'number' },
          { name: 'actualOrders', label: 'Actual Orders', type: 'number' },
          { name: 'revenueIncreasePct', label: 'Revenue Increase %', type: 'percent' },
          { name: 'orderIncreasePct', label: 'Order Increase %', type: 'percent' },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalActualRevenue', label: 'Actual Revenue', format: 'currency' },
      { key: 'totalForecastRevenue', label: 'Forecast Revenue', format: 'currency' },
      { key: 'revenueLift', label: 'Revenue Lift', format: 'currency' },
      { key: 'averageRevenueLiftPct', label: 'Lift %', format: 'percent' },
    ],
    tableFields: [
      { key: 'productName', label: 'Product', format: 'text' },
      { key: 'actualRevenue', label: 'Actual Revenue', format: 'currency' },
      { key: 'forecastRevenue', label: 'Forecast Revenue', format: 'currency' },
      { key: 'revenueLift', label: 'Lift', format: 'currency' },
    ],
    historyMetric: { key: 'revenueLift', label: 'Revenue Lift', format: 'currency' },
  },

  'cash-flow-forecast-worksheet': {
    kicker: 'Cash Flow',
    title: 'Cash Flow Forecast Worksheet',
    source: 'Cash Flow Forecast Worksheet',
    description: 'Project weekly cash receipts, payments, and reserve shortfalls.',
    scalarFields: [
      { name: 'beginningCash', label: 'Beginning Cash', type: 'number', placeholder: 'e.g. 50000' },
      { name: 'minimumCashReserve', label: 'Minimum Cash Reserve', type: 'number', placeholder: 'e.g. 25000' },
    ],
    collections: [
      {
        key: 'weeks',
        title: 'Weekly Cash Flow',
        rowLabel: 'Week',
        minRows: 1,
        maxRows: 26,
        defaultRowCount: 4,
        fields: [
          { name: 'weekLabel', label: 'Week', type: 'text' },
          { name: 'arCollections', label: 'A/R Collections', type: 'number' },
          { name: 'deposits', label: 'Deposits', type: 'number' },
          { name: 'apPayments', label: 'A/P Payments', type: 'number' },
          { name: 'payroll', label: 'Payroll', type: 'number' },
          { name: 'rent', label: 'Rent', type: 'number' },
          { name: 'utilities', label: 'Utilities', type: 'number' },
          { name: 'otherPayments', label: 'Other Payments', type: 'number' },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalReceipts', label: 'Total Receipts', format: 'currency' },
      { key: 'totalPayments', label: 'Total Payments', format: 'currency' },
      { key: 'endingCash', label: 'Ending Cash', format: 'currency' },
      { key: 'lowestCashBalance', label: 'Lowest Balance', format: 'currency' },
      { key: 'reserveShortfall', label: 'Reserve Shortfall', format: 'currency' },
    ],
    tableFields: [
      { key: 'weekLabel', label: 'Week', format: 'text' },
      { key: 'netCashFlow', label: 'Net Cash Flow', format: 'currency' },
      { key: 'endingCash', label: 'Ending Cash', format: 'currency' },
      { key: 'reserveShortfall', label: 'Reserve Shortfall', format: 'currency' },
    ],
    historyMetric: { key: 'endingCash', label: 'Ending Cash', format: 'currency' },
  },

  'f-1200-ar-turns': {
    kicker: 'Activity Ratios',
    title: 'F-1200 A/R Turns',
    source: 'F-1200 A/R Turns',
    description: 'Calculate accounts receivable turnover and average collection period.',
    scalarFields: [
      { name: 'daysPerYear', label: 'Days Per Year', type: 'number', placeholder: '365', defaultValue: '365' },
      { name: 'annualCreditSales', label: 'Annual Credit Sales', type: 'number', placeholder: 'e.g. 1200000' },
      { name: 'beginningArBalance', label: 'Beginning A/R Balance', type: 'number', placeholder: 'e.g. 95000' },
      { name: 'endingArBalance', label: 'Ending A/R Balance', type: 'number', placeholder: 'e.g. 110000' },
      { name: 'averageArBalance', label: 'Average A/R Balance (optional)', type: 'number', placeholder: 'Leave blank to average' },
    ],
    collections: [],
    summaryFields: [
      { key: 'annualCreditSales', label: 'Credit Sales', format: 'currency' },
      { key: 'averageArBalance', label: 'Average A/R', format: 'currency' },
      { key: 'arTurns', label: 'A/R Turns', format: 'number' },
      { key: 'avgCollectionPeriodDays', label: 'Collection Period (days)', format: 'number' },
      { key: 'arPctOfSales', label: 'A/R % of Sales', format: 'percent' },
    ],
    tableFields: [
      { key: 'scenario', label: 'Scenario', format: 'text' },
      { key: 'arTurns', label: 'A/R Turns', format: 'number' },
      { key: 'avgCollectionPeriodDays', label: 'Collection Days', format: 'number' },
    ],
    historyMetric: { key: 'arTurns', label: 'A/R Turns', format: 'number' },
  },

  'inventory-turn-calculation': {
    kicker: 'Activity Ratios',
    title: 'Inventory Turn Calculation',
    source: 'Inventory Turn Calculation',
    description: 'Calculate inventory turnover and average days inventory is held.',
    scalarFields: [
      { name: 'daysPerYear', label: 'Days Per Year', type: 'number', placeholder: '365', defaultValue: '365' },
      { name: 'costOfSales', label: 'Cost of Sales', type: 'number', placeholder: 'e.g. 800000' },
      { name: 'beginningInventory', label: 'Beginning Inventory', type: 'number', placeholder: 'e.g. 120000' },
      { name: 'endingInventory', label: 'Ending Inventory', type: 'number', placeholder: 'e.g. 140000' },
      { name: 'averageInventory', label: 'Average Inventory (optional)', type: 'number', placeholder: 'Leave blank to average' },
    ],
    collections: [],
    summaryFields: [
      { key: 'costOfSales', label: 'Cost of Sales', format: 'currency' },
      { key: 'averageInventory', label: 'Average Inventory', format: 'currency' },
      { key: 'inventoryTurnsPerYear', label: 'Inventory Turns', format: 'number' },
      { key: 'averageDaysHeld', label: 'Days Held', format: 'number' },
      { key: 'inventoryPctOfCogs', label: 'Inventory % of COGS', format: 'percent' },
    ],
    tableFields: [
      { key: 'scenario', label: 'Scenario', format: 'text' },
      { key: 'inventoryTurnsPerYear', label: 'Turns', format: 'number' },
      { key: 'averageDaysHeld', label: 'Days Held', format: 'number' },
    ],
    historyMetric: { key: 'inventoryTurnsPerYear', label: 'Inventory Turns', format: 'number' },
  },

  'cost-vs-sales-increase': {
    kicker: 'Profit Impact',
    title: 'Cost vs Sales Increase',
    source: 'Cost vs Sales Increase',
    description: 'Model how sales growth affects profit under variable and fixed cost assumptions.',
    scalarFields: [
      { name: 'currentSales', label: 'Current Sales', type: 'number', placeholder: 'e.g. 1000000' },
      { name: 'salesIncreasePercent', label: 'Sales Increase %', type: 'percent', placeholder: 'e.g. 10' },
      { name: 'variableCostPercent', label: 'Variable Cost %', type: 'percent', placeholder: 'e.g. 60' },
      { name: 'fixedExpenses', label: 'Fixed Expenses (annual)', type: 'number', placeholder: 'e.g. 300000' },
      { name: 'monthlyFixedExpenses', label: 'Monthly Fixed Expenses (optional)', type: 'number', placeholder: 'Used if annual is blank' },
    ],
    collections: [],
    summaryFields: [
      { key: 'newSales', label: 'New Sales', format: 'currency' },
      { key: 'newProfit', label: 'New Profit', format: 'currency' },
      { key: 'profitChange', label: 'Profit Change', format: 'currency' },
      { key: 'profitChangePct', label: 'Profit Change %', format: 'percent' },
    ],
    tableFields: [
      { key: 'salesIncreasePct', label: 'Sales Increase %', format: 'percent' },
      { key: 'newSales', label: 'New Sales', format: 'currency' },
      { key: 'newProfit', label: 'New Profit', format: 'currency' },
      { key: 'profitChange', label: 'Profit Change', format: 'currency' },
    ],
    historyMetric: { key: 'profitChange', label: 'Profit Change', format: 'currency' },
  },

  'f-300a-overhead-calcs': {
    kicker: 'Overhead Analysis',
    title: 'F-300A Overhead Calcs',
    source: 'F-300A Overhead Calcs',
    description: 'Analyze overhead burden on direct costs, markup, and gross profit.',
    scalarFields: [
      { name: 'totalRevenue', label: 'Total Revenue', type: 'number', placeholder: 'e.g. 2000000' },
      { name: 'totalOverhead', label: 'Total Overhead', type: 'number', placeholder: 'e.g. 450000' },
      { name: 'totalMaterialCosts', label: 'Material Costs', type: 'number', placeholder: 'e.g. 600000' },
      { name: 'totalDirectLaborCosts', label: 'Direct Labor', type: 'number', placeholder: 'e.g. 500000' },
      { name: 'factoringRate', label: 'Factoring Rate %', type: 'percent', placeholder: 'e.g. 2' },
    ],
    collections: [],
    summaryFields: [
      { key: 'overheadFactorOnDirect', label: 'Overhead Factor on Direct', format: 'number' },
      { key: 'burdenedDirectCost', label: 'Burdened Direct Cost', format: 'currency' },
      { key: 'grossProfit', label: 'Gross Profit', format: 'currency' },
      { key: 'grossMarginPct', label: 'Gross Margin %', format: 'percent' },
    ],
    tableFields: [
      { key: 'metric', label: 'Metric', format: 'text' },
      { key: 'amount', label: 'Amount', format: 'currency' },
      { key: 'pctOfRevenue', label: '% of Revenue', format: 'percent' },
    ],
    historyMetric: { key: 'grossProfit', label: 'Gross Profit', format: 'currency' },
  },

  'f-500b-bid-calculation': {
    kicker: 'Bid Worksheet',
    title: 'F-500B Bid Calculation',
    source: 'F-500B Bid Calculation',
    description: 'Build bid line items with labor, materials, and markup.',
    scalarFields: [],
    collections: [
      {
        key: 'bidLines',
        title: 'Bid Lines',
        rowLabel: 'Line',
        minRows: 1,
        maxRows: 50,
        defaultRowCount: 3,
        fields: [
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'laborHours', label: 'Labor Hours', type: 'number' },
          { name: 'laborRate', label: 'Labor Rate', type: 'number' },
          { name: 'materialCost', label: 'Material Cost', type: 'number' },
          { name: 'markupPct', label: 'Markup %', type: 'percent' },
        ],
      },
    ],
    summaryFields: [
      { key: 'bidTotal', label: 'Bid Total', format: 'currency' },
      { key: 'lineCount', label: 'Line Count', format: 'number' },
    ],
    tableFields: [
      { key: 'description', label: 'Description', format: 'text' },
      { key: 'directCost', label: 'Direct Cost', format: 'currency' },
      { key: 'markupPct', label: 'Markup %', format: 'percent' },
      { key: 'lineTotal', label: 'Line Total', format: 'currency' },
    ],
    historyMetric: { key: 'bidTotal', label: 'Bid Total', format: 'currency' },
  },

  'super-profit': {
    kicker: 'Profit Planning',
    title: 'Super Profit',
    source: 'Super Profit',
    description: 'Determine required sales to reach a target profit increase.',
    scalarFields: [
      { name: 'currentSales', label: 'Current Sales', type: 'number', placeholder: 'e.g. 1000000' },
      { name: 'currentProfit', label: 'Current Profit', type: 'number', placeholder: 'e.g. 120000' },
      { name: 'targetProfitIncrease', label: 'Target Profit Increase', type: 'number', placeholder: 'e.g. 50000' },
      { name: 'variableCostPct', label: 'Variable Cost %', type: 'percent', placeholder: 'e.g. 55' },
      { name: 'fixedExpenses', label: 'Fixed Expenses', type: 'number', placeholder: 'e.g. 280000' },
    ],
    collections: [],
    summaryFields: [
      { key: 'targetProfit', label: 'Target Profit', format: 'currency' },
      { key: 'requiredSales', label: 'Required Sales', format: 'currency' },
      { key: 'salesIncrease', label: 'Sales Increase', format: 'currency' },
      { key: 'salesIncreasePct', label: 'Sales Increase %', format: 'percent' },
    ],
    tableFields: [
      { key: 'metric', label: 'Metric', format: 'text' },
      { key: 'amount', label: 'Amount', format: 'currency' },
    ],
    historyMetric: { key: 'salesIncreasePct', label: 'Sales Increase %', format: 'percent' },
  },

  'bms-expense-report': {
    kicker: 'Expense Tracking',
    title: 'BMS Expense Report',
    source: 'BMS Expense Report',
    description: 'Summarize expenses by category and date.',
    scalarFields: [],
    collections: [
      {
        key: 'expenses',
        title: 'Expenses',
        rowLabel: 'Expense',
        minRows: 1,
        maxRows: 100,
        defaultRowCount: 3,
        fields: [
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'category', label: 'Category', type: 'text' },
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'amount', label: 'Amount', type: 'number' },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalExpenses', label: 'Total Expenses', format: 'currency' },
      { key: 'expenseCount', label: 'Expense Count', format: 'number' },
    ],
    tableFields: [
      { key: 'date', label: 'Date', format: 'text' },
      { key: 'category', label: 'Category', format: 'text' },
      { key: 'description', label: 'Description', format: 'text' },
      { key: 'amount', label: 'Amount', format: 'currency' },
    ],
    historyMetric: { key: 'totalExpenses', label: 'Total Expenses', format: 'currency' },
  },

  'f-100b-breakeven-sample': {
    kicker: 'Breakeven Tools',
    title: 'F-100B Breakeven Sample',
    source: 'F-100B Breakeven Sample',
    description: 'Office-tool breakeven analysis with revenue, COGS, labor, and fixed expenses.',
    scalarFields: [
      { name: 'annualRevenue', label: 'Annual Revenue', type: 'number', placeholder: 'e.g. 1250000' },
      { name: 'cogs', label: 'COGS', type: 'number', placeholder: 'e.g. 700000' },
      { name: 'labor', label: 'Labor', type: 'number', placeholder: 'e.g. 250000' },
      { name: 'fixedExpenses', label: 'Fixed Expenses', type: 'number', placeholder: 'e.g. 200000' },
      { name: 'profit', label: 'Profit', type: 'number', placeholder: 'e.g. 100000' },
      { name: 'workDaysPerYear', label: 'Work Days Per Year', type: 'number', placeholder: '365', defaultValue: '365' },
    ],
    collections: [],
    summaryFields: [
      { key: 'grossMarginAmount', label: 'Gross Margin', format: 'currency' },
      { key: 'grossMarginPercent', label: 'Gross Margin %', format: 'percent' },
      { key: 'breakevenRevenue', label: 'Breakeven Revenue', format: 'currency' },
      { key: 'breakevenPercent', label: 'Breakeven %', format: 'percent' },
      { key: 'breakevenDays', label: 'Breakeven Days', format: 'number' },
    ],
    tableFields: [],
    historyMetric: { key: 'breakevenRevenue', label: 'Breakeven Revenue', format: 'currency' },
  },

  'f-100d-break-even-tool': {
    kicker: 'Breakeven Tools',
    title: 'F-100D Break Even Tool',
    source: 'F-100D Break Even Tool',
    description: 'Contribution margin breakeven with sales scenario chart.',
    scalarFields: [
      { name: 'annualRevenue', label: 'Annual Revenue', type: 'number', placeholder: 'e.g. 1250000' },
      { name: 'variableCostPct', label: 'Variable Cost %', type: 'percent', placeholder: 'e.g. 65' },
      { name: 'fixedCosts', label: 'Fixed Costs', type: 'number', placeholder: 'e.g. 320000' },
    ],
    collections: [],
    summaryFields: [
      { key: 'contributionMargin', label: 'Contribution Margin', format: 'currency' },
      { key: 'contributionMarginPct', label: 'Contribution Margin %', format: 'percent' },
      { key: 'breakevenSales', label: 'Breakeven Sales', format: 'currency' },
      { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
    ],
    tableFields: [
      { key: 'salesPct', label: 'Sales %', format: 'percent' },
      { key: 'sales', label: 'Sales', format: 'currency' },
      { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
      { key: 'operatingMarginPct', label: 'Operating Margin %', format: 'percent' },
    ],
    historyMetric: { key: 'breakevenSales', label: 'Breakeven Sales', format: 'currency' },
  },

  'breakeven-tool-advanced': {
    kicker: 'Breakeven Tools',
    title: 'Breakeven Tool Advanced',
    source: 'Breakeven Tool Advanced',
    description: 'Seasonal breakeven analysis with monthly revenue flex adjustments.',
    scalarFields: [
      { name: 'annualBaseRevenue', label: 'Annual Base Revenue', type: 'number', placeholder: 'e.g. 1200000' },
      { name: 'fixedCosts', label: 'Fixed Costs', type: 'number', placeholder: 'e.g. 300000' },
      { name: 'variableCostPct', label: 'Variable Cost %', type: 'percent', placeholder: 'e.g. 60' },
    ],
    collections: [
      {
        key: 'seasonality',
        title: 'Monthly Seasonality',
        rowLabel: 'Month',
        minRows: 12,
        maxRows: 12,
        defaultRowCount: 12,
        fields: [
          { name: 'month', label: 'Month', type: 'text' },
          { name: 'flexPct', label: 'Flex %', type: 'percent' },
        ],
        buildDefaultRow: (index) => ({
          month: MONTH_NAMES[index] || `Month ${index + 1}`,
          flexPct: '0',
        }),
      },
    ],
    summaryFields: [
      { key: 'annualBaseRevenue', label: 'Base Revenue', format: 'currency' },
      { key: 'adjustedRevenue', label: 'Adjusted Revenue', format: 'currency' },
      { key: 'contributionMarginPct', label: 'Contribution Margin %', format: 'percent' },
      { key: 'breakevenSales', label: 'Breakeven Sales', format: 'currency' },
      { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
    ],
    tableFields: [
      { key: 'month', label: 'Month', format: 'text' },
      { key: 'flexPct', label: 'Flex %', format: 'percent' },
      { key: 'adjustedMonthRevenue', label: 'Adjusted Revenue', format: 'currency' },
    ],
    historyMetric: { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
  },

  'f-1000-pl': {
    kicker: 'P&L Builder',
    title: 'F-1000 P&L',
    source: 'F-1000 P&L',
    description: 'Build a profit and loss statement from categorized line items.',
    scalarFields: [],
    collections: [
      {
        key: 'plLines',
        title: 'P&L Lines',
        rowLabel: 'Line',
        minRows: 1,
        maxRows: 60,
        defaultRowCount: 5,
        fields: [
          { name: 'category', label: 'Category', type: 'select', options: PL_CATEGORY_OPTIONS },
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'amount', label: 'Amount', type: 'number' },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalRevenue', label: 'Total Revenue', format: 'currency' },
      { key: 'totalCogs', label: 'Total COGS', format: 'currency' },
      { key: 'grossProfit', label: 'Gross Profit', format: 'currency' },
      { key: 'grossMarginPct', label: 'Gross Margin %', format: 'percent' },
      { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
      { key: 'netMarginPct', label: 'Net Margin %', format: 'percent' },
    ],
    tableFields: [
      { key: 'category', label: 'Category', format: 'text' },
      { key: 'description', label: 'Description', format: 'text' },
      { key: 'amount', label: 'Amount', format: 'currency' },
    ],
    historyMetric: { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
  },

  'f-200b-fully-burdened-labor': {
    kicker: 'Labor Burden',
    title: 'F-200B Fully Burdened Labor',
    source: 'F-200b Fully Burdened Labor Calculator',
    description: 'Calculate fully burdened labor cost for a single employee including payroll taxes and benefits.',
    scalarFields: [
      { name: 'employeeName', label: 'Employee Name', type: 'text', defaultValue: 'Employee 1' },
      { name: 'annualSalary', label: 'Annual Salary', type: 'number', placeholder: 'e.g. 52000' },
      { name: 'hourlyWage', label: 'Hourly Wage (optional)', type: 'number', placeholder: 'e.g. 25' },
      { name: 'hoursPerYear', label: 'Hours Per Year', type: 'number', defaultValue: 2080 },
      { name: 'ficaPct', label: 'FICA %', type: 'percent', defaultValue: 7.65 },
      { name: 'unemploymentPct', label: 'Unemployment %', type: 'percent', defaultValue: 1 },
      { name: 'workersCompPct', label: 'Workers Comp %', type: 'percent', defaultValue: 3 },
      { name: 'healthInsuranceAnnual', label: 'Health Insurance (annual)', type: 'number', defaultValue: 6000 },
      { name: 'retirementPct', label: 'Retirement %', type: 'percent', defaultValue: 3 },
      { name: 'otherBenefitsAnnual', label: 'Other Benefits (annual)', type: 'number', defaultValue: 1200 },
    ],
    collections: [],
    summaryFields: [
      { key: 'fullyBurdenedAnnual', label: 'Fully Burdened Annual', format: 'currency' },
      { key: 'fullyBurdenedHourly', label: 'Fully Burdened Hourly', format: 'currency' },
      { key: 'totalBurden', label: 'Total Burden', format: 'currency' },
      { key: 'burdenPct', label: 'Burden %', format: 'percent' },
    ],
    tableFields: [
      { key: 'employeeName', label: 'Employee', format: 'text' },
      { key: 'annualSalary', label: 'Salary', format: 'currency' },
      { key: 'totalBurden', label: 'Burden', format: 'currency' },
      { key: 'fullyBurdenedAnnual', label: 'Fully Burdened', format: 'currency' },
      { key: 'fullyBurdenedHourly', label: 'Hourly Rate', format: 'currency' },
    ],
    historyMetric: { key: 'fullyBurdenedHourly', label: 'Fully Burdened Hourly', format: 'currency' },
  },

  'f-200a-labor-burden': {
    kicker: 'Labor Burden',
    title: 'F-200A Labor Burden',
    source: 'F-200a Labor Burden',
    description: 'Calculate fully burdened labor costs across up to ten employees.',
    scalarFields: [],
    collections: [
      {
        key: 'employees',
        title: 'Employees',
        rowLabel: 'Employee',
        minRows: 1,
        maxRows: 10,
        defaultRowCount: 3,
        fields: [
          { name: 'employeeName', label: 'Name', type: 'text' },
          { name: 'annualSalary', label: 'Annual Salary', type: 'number' },
          { name: 'hourlyWage', label: 'Hourly Wage', type: 'number' },
          { name: 'hoursPerYear', label: 'Hours / Year', type: 'number' },
          { name: 'ficaPct', label: 'FICA %', type: 'percent' },
          { name: 'unemploymentPct', label: 'Unemployment %', type: 'percent' },
          { name: 'workersCompPct', label: 'Workers Comp %', type: 'percent' },
          { name: 'healthInsuranceAnnual', label: 'Health Ins.', type: 'number' },
          { name: 'retirementPct', label: 'Retirement %', type: 'percent' },
          { name: 'otherBenefitsAnnual', label: 'Other Benefits', type: 'number' },
        ],
        buildDefaultRow: (index) => ({
          employeeName: `Employee ${index + 1}`,
          annualSalary: '',
          hourlyWage: '',
          hoursPerYear: 2080,
          ficaPct: 7.65,
          unemploymentPct: 1,
          workersCompPct: 3,
          healthInsuranceAnnual: 6000,
          retirementPct: 3,
          otherBenefitsAnnual: 1200,
        }),
      },
    ],
    summaryFields: [
      { key: 'employeeCount', label: 'Employees', format: 'number' },
      { key: 'totalFullyBurdenedAnnual', label: 'Total Fully Burdened', format: 'currency' },
      { key: 'averageBurdenPct', label: 'Avg Burden %', format: 'percent' },
      { key: 'averageFullyBurdenedHourly', label: 'Avg Burdened Hourly', format: 'currency' },
    ],
    tableFields: [
      { key: 'employeeName', label: 'Employee', format: 'text' },
      { key: 'annualSalary', label: 'Salary', format: 'currency' },
      { key: 'totalBurden', label: 'Burden', format: 'currency' },
      { key: 'burdenPct', label: 'Burden %', format: 'percent' },
      { key: 'fullyBurdenedHourly', label: 'Hourly', format: 'currency' },
    ],
    historyMetric: { key: 'totalFullyBurdenedAnnual', label: 'Total Fully Burdened', format: 'currency' },
  },

  'f-700c-annual-budget': {
    kicker: 'Budgeting',
    title: 'F-700C Annual Budget',
    source: 'F-700c Annual Budget worksheet template',
    description: 'Annual budget lines with monthly spread, contribution margin, and net income.',
    scalarFields: [
      { name: 'incomeTaxRatePercent', label: 'Income Tax Rate %', type: 'percent', defaultValue: 25 },
    ],
    collections: [
      {
        key: 'budgetLines',
        title: 'Budget Lines',
        rowLabel: 'Line',
        minRows: 1,
        maxRows: 80,
        defaultRowCount: 6,
        fields: [
          { name: 'lineItem', label: 'Line Item', type: 'text' },
          { name: 'category', label: 'Category', type: 'select', options: BUDGET_CATEGORY_OPTIONS },
          { name: 'annualAmount', label: 'Annual Amount', type: 'number' },
          { name: 'growthPct', label: 'Growth %', type: 'percent' },
        ],
        buildDefaultRow: (index) => ({
          lineItem: `Line ${index + 1}`,
          category: index === 0 ? 'revenue' : index < 3 ? 'variable-cost' : 'fixed-cost',
          annualAmount: '',
          growthPct: 0,
        }),
      },
    ],
    summaryFields: [
      { key: 'totalRevenue', label: 'Total Revenue', format: 'currency' },
      { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
      { key: 'netIncome', label: 'Net Income', format: 'currency' },
      { key: 'netMarginPct', label: 'Net Margin %', format: 'percent' },
    ],
    tableFields: [
      { key: 'month', label: 'Month', format: 'text' },
      { key: 'revenue', label: 'Revenue', format: 'currency' },
      { key: 'variableCosts', label: 'Variable', format: 'currency' },
      { key: 'fixedCosts', label: 'Fixed', format: 'currency' },
      { key: 'netIncome', label: 'Net Income', format: 'currency' },
    ],
    historyMetric: { key: 'netIncome', label: 'Net Income', format: 'currency' },
  },

  'job-estimating-master': {
    kicker: 'Job Estimating',
    title: 'Job Estimating Master',
    source: 'Job Estimating MASTER',
    description: 'Build a job estimate with direct costs, overhead, and profit.',
    scalarFields: [
      { name: 'clientName', label: 'Client', type: 'text', defaultValue: '' },
      { name: 'jobNumber', label: 'Job #', type: 'text', defaultValue: '' },
      { name: 'jobOverheadPct', label: 'Job Overhead %', type: 'percent', defaultValue: 15 },
      { name: 'profitPct', label: 'Profit %', type: 'percent', defaultValue: 10 },
    ],
    collections: [
      {
        key: 'estimateLines',
        title: 'Estimate Lines',
        rowLabel: 'Item',
        minRows: 1,
        maxRows: 60,
        defaultRowCount: 5,
        fields: [
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'costType', label: 'Type', type: 'select', options: ESTIMATE_COST_TYPE_OPTIONS },
          { name: 'quantity', label: 'Qty', type: 'number' },
          { name: 'unitCost', label: 'Unit Cost', type: 'number' },
        ],
      },
    ],
    summaryFields: [
      { key: 'directTotal', label: 'Direct Total', format: 'currency' },
      { key: 'overhead', label: 'Overhead', format: 'currency' },
      { key: 'profit', label: 'Profit', format: 'currency' },
      { key: 'bidTotal', label: 'Bid Total', format: 'currency' },
    ],
    tableFields: [
      { key: 'description', label: 'Description', format: 'text' },
      { key: 'costType', label: 'Type', format: 'text' },
      { key: 'quantity', label: 'Qty', format: 'number' },
      { key: 'extendedCost', label: 'Extended', format: 'currency' },
    ],
    historyMetric: { key: 'bidTotal', label: 'Bid Total', format: 'currency' },
  },

  'f-500a-example-bid-worksheet': {
    kicker: 'Bid Worksheet',
    title: 'F-500A Example Bid Worksheet',
    source: 'F-500a Example Bid Worksheet',
    description: 'Detailed bid worksheet with labor, materials, equipment, subcontract, overhead, and profit.',
    scalarFields: [
      { name: 'defaultOverheadPct', label: 'Default Overhead %', type: 'percent', defaultValue: 12 },
      { name: 'defaultProfitPct', label: 'Default Profit %', type: 'percent', defaultValue: 8 },
    ],
    collections: [
      {
        key: 'bidLines',
        title: 'Bid Lines',
        rowLabel: 'Line',
        minRows: 1,
        maxRows: 60,
        defaultRowCount: 4,
        fields: [
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'laborHours', label: 'Labor Hrs', type: 'number' },
          { name: 'laborRate', label: 'Labor Rate', type: 'number' },
          { name: 'materialCost', label: 'Material', type: 'number' },
          { name: 'equipmentCost', label: 'Equipment', type: 'number' },
          { name: 'subcontractCost', label: 'Subcontract', type: 'number' },
          { name: 'overheadPct', label: 'OH %', type: 'percent' },
          { name: 'profitPct', label: 'Profit %', type: 'percent' },
        ],
      },
    ],
    summaryFields: [
      { key: 'directTotal', label: 'Direct Total', format: 'currency' },
      { key: 'bidTotal', label: 'Bid Total', format: 'currency' },
      { key: 'lineCount', label: 'Lines', format: 'number' },
    ],
    tableFields: [
      { key: 'description', label: 'Description', format: 'text' },
      { key: 'directCost', label: 'Direct', format: 'currency' },
      { key: 'overhead', label: 'Overhead', format: 'currency' },
      { key: 'profit', label: 'Profit', format: 'currency' },
      { key: 'lineTotal', label: 'Total', format: 'currency' },
    ],
    historyMetric: { key: 'bidTotal', label: 'Bid Total', format: 'currency' },
  },

  'f-500c-job-costing-template': {
    kicker: 'Job Costing',
    title: 'F-500C Job Costing Template',
    source: 'F-500c Job Costing Template',
    description: 'Compare estimated versus actual job costs with variance analysis.',
    scalarFields: [
      { name: 'jobName', label: 'Job Name', type: 'text', defaultValue: '' },
    ],
    collections: [
      {
        key: 'costLines',
        title: 'Cost Lines',
        rowLabel: 'Line',
        minRows: 1,
        maxRows: 60,
        defaultRowCount: 5,
        fields: [
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'category', label: 'Category', type: 'select', options: JOB_COST_CATEGORY_OPTIONS },
          { name: 'estimatedCost', label: 'Estimated', type: 'number' },
          { name: 'actualCost', label: 'Actual', type: 'number' },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalEstimated', label: 'Total Estimated', format: 'currency' },
      { key: 'totalActual', label: 'Total Actual', format: 'currency' },
      { key: 'totalVariance', label: 'Variance', format: 'currency' },
      { key: 'variancePct', label: 'Variance %', format: 'percent' },
    ],
    tableFields: [
      { key: 'description', label: 'Description', format: 'text' },
      { key: 'category', label: 'Category', format: 'text' },
      { key: 'estimatedCost', label: 'Estimated', format: 'currency' },
      { key: 'actualCost', label: 'Actual', format: 'currency' },
      { key: 'variance', label: 'Variance', format: 'currency' },
      { key: 'status', label: 'Status', format: 'text' },
    ],
    historyMetric: { key: 'totalVariance', label: 'Variance', format: 'currency' },
  },

  '4-year-comp-pl-optimal': {
    kicker: 'P&L Analysis',
    title: '4 Year Comp P&L Optimal',
    source: '4 Year Comp P&L Optimal',
    description: 'Compare up to four P&L years and highlight the optimal margin year.',
    scalarFields: [],
    collections: [
      {
        key: 'years',
        title: 'P&L Years',
        rowLabel: 'Year',
        minRows: 1,
        maxRows: 4,
        defaultRowCount: 4,
        fields: [
          { name: 'year', label: 'Year', type: 'text' },
          { name: 'revenue', label: 'Revenue', type: 'number' },
          { name: 'cogs', label: 'COGS', type: 'number' },
          { name: 'operatingExpenses', label: 'Operating Expenses', type: 'number' },
        ],
      },
    ],
    summaryFields: [
      { key: 'optimalYear', label: 'Optimal Year', format: 'text' },
      { key: 'optimalNetMarginPct', label: 'Best Net Margin', format: 'percent' },
    ],
    tableFields: [
      { key: 'year', label: 'Year', format: 'text' },
      { key: 'revenue', label: 'Revenue', format: 'currency' },
      { key: 'netIncome', label: 'Net Income', format: 'currency' },
      { key: 'netMarginPct', label: 'Net Margin', format: 'percent' },
    ],
    historyMetric: { key: 'optimalNetMarginPct', label: 'Best Margin', format: 'percent' },
  },

  'f-700b-budget-planning': {
    kicker: 'Budget Planning',
    title: 'F-700b Budget Planning',
    source: 'F-700b Budget Planning Worksheet',
    description: 'Annual budget planning by category with growth assumptions.',
    scalarFields: [
      { name: 'annualRevenue', label: 'Annual Revenue', type: 'number' },
      { name: 'growthPercent', label: 'Growth %', type: 'percent', placeholder: '5' },
    ],
    collections: [
      {
        key: 'categories',
        title: 'Budget Categories',
        rowLabel: 'Category',
        minRows: 1,
        maxRows: 24,
        defaultRowCount: 4,
        fields: [
          { name: 'category', label: 'Category', type: 'text' },
          { name: 'annualAmount', label: 'Annual Amount', type: 'number' },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalBudget', label: 'Total Budget', format: 'currency' },
      { key: 'budgetToRevenuePct', label: 'Budget / Revenue', format: 'percent' },
    ],
    tableFields: [
      { key: 'category', label: 'Category', format: 'text' },
      { key: 'budgetAmount', label: 'Budget', format: 'currency' },
    ],
    historyMetric: { key: 'totalBudget', label: 'Total Budget', format: 'currency' },
  },

  'employee-productivity': {
    kicker: 'Labor Productivity',
    title: 'Employee Productivity',
    source: 'Employee Productivity',
    description: 'Revenue per employee and per labor hour benchmarks.',
    scalarFields: [
      { name: 'annualRevenue', label: 'Annual Revenue', type: 'number' },
      { name: 'employeeCount', label: 'Employee Count', type: 'number' },
      { name: 'hoursPerEmployee', label: 'Hours Per Employee', type: 'number', placeholder: '2080' },
    ],
    collections: [],
    summaryFields: [
      { key: 'revenuePerEmployee', label: 'Revenue / Employee', format: 'currency' },
      { key: 'revenuePerHour', label: 'Revenue / Hour', format: 'currency' },
    ],
    tableFields: [
      { key: 'metric', label: 'Metric', format: 'text' },
      { key: 'value', label: 'Value', format: 'currency' },
    ],
    historyMetric: { key: 'revenuePerEmployee', label: 'Rev / Employee', format: 'currency' },
  },

  '6-wk-cash-flow-wa': {
    kicker: 'Cash Flow',
    title: '6 Wk Cash Flow WA',
    source: '6 Wk Cash Flow WA',
    description: 'Six-week cash flow forecast with weekly inflows and outflows.',
    scalarFields: [{ name: 'openingCash', label: 'Opening Cash', type: 'number' }],
    collections: [
      {
        key: 'weeks',
        title: 'Weekly Cash Flow',
        rowLabel: 'Week',
        minRows: 6,
        maxRows: 6,
        defaultRowCount: 6,
        fields: [
          { name: 'label', label: 'Week', type: 'text' },
          { name: 'inflow', label: 'Inflow', type: 'number' },
          { name: 'outflow', label: 'Outflow', type: 'number' },
        ],
      },
    ],
    summaryFields: [
      { key: 'endingCash', label: 'Ending Cash', format: 'currency' },
      { key: 'netChange', label: 'Net Change', format: 'currency' },
    ],
    tableFields: [
      { key: 'week', label: 'Week', format: 'text' },
      { key: 'inflow', label: 'Inflow', format: 'currency' },
      { key: 'outflow', label: 'Outflow', format: 'currency' },
      { key: 'endingCash', label: 'Ending Cash', format: 'currency' },
    ],
    historyMetric: { key: 'endingCash', label: 'Ending Cash', format: 'currency' },
  },
};

export function buildDefaultFormState(config) {
  if (!config) return {};

  const form = {};

  for (const field of config.scalarFields || []) {
    form[field.name] = field.defaultValue ?? '';
  }

  for (const collection of config.collections || []) {
    const rowCount = collection.defaultRowCount ?? collection.minRows ?? 1;
    form[collection.key] = Array.from({ length: rowCount }, (_, index) => {
      if (typeof collection.buildDefaultRow === 'function') {
        return collection.buildDefaultRow(index);
      }

      const row = {};
      for (const field of collection.fields) {
        if (field.type === 'select') {
          row[field.name] = field.options?.[0]?.value || '';
        } else if (field.name === 'weekLabel' || field.name === 'period') {
          row[field.name] = `${collection.rowLabel} ${index + 1}`;
        } else {
          row[field.name] = '';
        }
      }
      return row;
    });
  }

  return form;
}
