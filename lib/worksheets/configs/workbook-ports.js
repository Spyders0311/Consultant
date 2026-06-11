/**
 * The nine workbook-port configs. PORT_DEFINITIONS is the exact data the
 * pre-overhaul WorkbookPortWizard carried inline (scalarFields, collections,
 * summaryFields, tableFields, historyMetric); buildConfig() maps it onto the
 * unified wizard schema so payload keys and outputs stay identical.
 */
const PORT_DEFINITIONS = {
  'bms-marketing-forecast': {
    kicker: 'Marketing',
    title: 'BMS Marketing Forecast',
    source: 'BMS Marketing Forecast.xlsx',
    description:
      'Front-end sales forecast rebuilt from the five FE Sales workbook tabs with revenue, sales team cost, commission, and operating income outputs.',
    scalarFields: [
      { name: 'surveyFee', label: 'Survey Fee', type: 'number', min: 0, defaultValue: 29850 },
      { name: 'cashCollectPerSale', label: 'Cash Collect Per Sale', type: 'number', min: 0, defaultValue: 708000 },
      { name: 'averageHoursPerGo', label: 'Avg Hrs Per Go', type: 'number', min: 0, defaultValue: 160 },
      { name: 'averageRatePerHour', label: 'Avg Rate Per Hr', type: 'number', min: 0, defaultValue: 295 },
      { name: 'commissionPercent', label: 'Commission %', type: 'number', min: 0, max: 100, step: 0.1, defaultValue: 2.5 },
      { name: 'salaryPerHead', label: 'Annual Salary Per Head', type: 'number', min: 0, defaultValue: 39000 },
    ],
    collections: [
      {
        key: 'forecastYears',
        label: 'Forecast Years',
        rowLabel: 'Year',
        maxRows: 5,
        defaultRows: [
          { period: 'Year 1', salesHeadcount: 10, surveyStarts: 12, cashCollectJobs: 12, marketingSpend: 60000 },
          { period: 'Year 2', salesHeadcount: 12, surveyStarts: 18, cashCollectJobs: 18, marketingSpend: 75000 },
          { period: 'Year 3', salesHeadcount: 16, surveyStarts: 24, cashCollectJobs: 24, marketingSpend: 90000 },
          { period: 'Year 4', salesHeadcount: 24, surveyStarts: 36, cashCollectJobs: 36, marketingSpend: 120000 },
          { period: 'Year 5', salesHeadcount: 32, surveyStarts: 48, cashCollectJobs: 48, marketingSpend: 150000 },
        ],
        fields: [
          { name: 'period', label: 'Period', type: 'text' },
          { name: 'salesHeadcount', label: 'Head Count', type: 'number', min: 0 },
          { name: 'surveyStarts', label: 'Survey Starts', type: 'number', min: 0 },
          { name: 'cashCollectJobs', label: 'Cash Collect Jobs', type: 'number', min: 0 },
          { name: 'marketingSpend', label: 'Marketing Spend', type: 'number', min: 0 },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalRevenue', label: 'Total Revenue', type: 'currency' },
      { key: 'totalOperatingIncome', label: 'Operating Income', type: 'currency' },
      { key: 'peakHeadcount', label: 'Peak Head Count', type: 'number' },
      { key: 'averageMarginPct', label: 'Avg Margin', type: 'percent' },
    ],
    tableFields: [
      { key: 'period', label: 'Period', type: 'text' },
      { key: 'salesHeadcount', label: 'Head Count', type: 'number' },
      { key: 'surveyFees', label: 'Survey Fees', type: 'currency' },
      { key: 'cashCollections', label: 'Cash Collect', type: 'currency' },
      { key: 'totalRevenue', label: 'Revenue', type: 'currency' },
      { key: 'totalCost', label: 'Cost', type: 'currency' },
      { key: 'operatingIncome', label: 'Operating Income', type: 'currency' },
      { key: 'marginPct', label: 'Margin', type: 'percent' },
    ],
    historyMetric: { key: 'summary.totalOperatingIncome', label: 'operating income', type: 'currency' },
  },
  'dashboard-gantt-chart': {
    kicker: 'Analysis',
    title: 'Dashboard Gantt Chart',
    source: 'F-1600d Dashboard Gantt-Chart.xlsx',
    description:
      'Task, progress, and issue tracker rebuilt from the Data, Gantt Chart, Calculations, and Issues workbook tabs.',
    scalarFields: [
      { name: 'projectName', label: 'Project Name', type: 'text', defaultValue: 'Client Implementation' },
      { name: 'reportDate', label: 'Report Date', type: 'date', defaultValue: '2026-06-09' },
      { name: 'openIssues', label: 'Open Issues', type: 'number', min: 0, defaultValue: 4 },
      { name: 'highPriorityIssues', label: 'High Priority Issues', type: 'number', min: 0, defaultValue: 1 },
    ],
    collections: [
      {
        key: 'tasks',
        label: 'Tasks',
        rowLabel: 'Task',
        maxRows: 40,
        defaultRows: [
          { category: 'Requirements', activity: 'Discovery', person: 'Owner', startDate: '2026-06-01', endDate: '2026-06-05', percentDone: 100 },
          { category: 'Design', activity: 'Workflow Map', person: 'Analyst', startDate: '2026-06-06', endDate: '2026-06-12', percentDone: 80 },
          { category: 'Development', activity: 'Worksheet Port', person: 'Developer', startDate: '2026-06-10', endDate: '2026-06-21', percentDone: 45 },
          { category: 'Testing', activity: 'Client Review', person: 'Consultant', startDate: '2026-06-22', endDate: '2026-06-26', percentDone: 0 },
          { category: 'Deployment', activity: 'Release', person: 'Consultant', startDate: '2026-06-27', endDate: '2026-06-28', percentDone: 0 },
        ],
        fields: [
          { name: 'category', label: 'Category', type: 'text' },
          { name: 'activity', label: 'Activity', type: 'text' },
          { name: 'person', label: 'Person', type: 'text' },
          { name: 'startDate', label: 'Start', type: 'date' },
          { name: 'endDate', label: 'End', type: 'date' },
          { name: 'percentDone', label: '% Done', type: 'number', min: 0, max: 100, step: 1 },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalTasks', label: 'Tasks', type: 'number' },
      { key: 'completedTasks', label: 'Complete', type: 'number' },
      { key: 'averageProgressPct', label: 'Avg Progress', type: 'percent' },
      { key: 'overdueTasks', label: 'Overdue', type: 'number' },
    ],
    tableFields: [
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'activity', label: 'Activity', type: 'text' },
      { key: 'person', label: 'Person', type: 'text' },
      { key: 'startDate', label: 'Start', type: 'text' },
      { key: 'endDate', label: 'End', type: 'text' },
      { key: 'durationDays', label: 'Days', type: 'number' },
      { key: 'percentDone', label: '% Done', type: 'percent' },
      { key: 'status', label: 'Status', type: 'text' },
    ],
    historyMetric: { key: 'summary.averageProgressPct', label: 'average progress', type: 'percent' },
  },
  'flex-budget-worksheet': {
    kicker: 'Analysis',
    title: 'Flex Budget Worksheet',
    source: 'F-700a - Flex Budget Worksheet.xlsx',
    description:
      'Annual and monthly budget worksheet rebuilt from the Annual Budget and Monthly Budget source tabs.',
    scalarFields: [
      { name: 'budgetYear', label: 'Budget Year', type: 'number', min: 1900, max: 3000, defaultValue: 2026 },
      { name: 'incomeTaxRatePercent', label: 'Income Tax Rate %', type: 'number', min: 0, max: 100, step: 0.1, defaultValue: 22 },
      { name: 'monthsInBudget', label: 'Months In Budget', type: 'number', min: 1, max: 12, defaultValue: 12 },
      { name: 'businessDaysInYear', label: 'Business Days In Year', type: 'number', min: 1, defaultValue: 260 },
    ],
    collections: [
      {
        key: 'budgetLines',
        label: 'Budget Lines',
        rowLabel: 'Line',
        maxRows: 40,
        defaultRows: [
          { category: 'revenue', lineItem: 'Lubbock Sales', currentAnnual: 9340605, growthPct: 6 },
          { category: 'revenue', lineItem: 'Amarillo Sales', currentAnnual: 2600802, growthPct: 6 },
          { category: 'revenue', lineItem: 'Hereford Sales', currentAnnual: 2112185, growthPct: 6 },
          { category: 'variable-cost', lineItem: 'Variable Costs', currentAnnual: 12888123, growthPct: 5 },
          { category: 'fixed-cost', lineItem: 'Fixed Costs', currentAnnual: 1945839, growthPct: 2 },
        ],
        fields: [
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            options: [
              { value: 'revenue', label: 'Revenue' },
              { value: 'variable-cost', label: 'Variable Cost' },
              { value: 'fixed-cost', label: 'Fixed Cost' },
            ],
          },
          { name: 'lineItem', label: 'Line Item', type: 'text' },
          { name: 'currentAnnual', label: 'Current Annual', type: 'number', min: 0 },
          { name: 'growthPct', label: 'Growth %', type: 'number', step: 0.1 },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalRevenue', label: 'Revenue', type: 'currency' },
      { key: 'totalVariableCosts', label: 'Variable Costs', type: 'currency' },
      { key: 'totalFixedCosts', label: 'Fixed Costs', type: 'currency' },
      { key: 'operatingIncome', label: 'Operating Income', type: 'currency' },
    ],
    tableFields: [
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'lineItem', label: 'Line Item', type: 'text' },
      { key: 'currentAnnual', label: 'Current Annual', type: 'currency' },
      { key: 'budgetedAnnual', label: 'Budgeted Annual', type: 'currency' },
      { key: 'monthlyAverage', label: 'Monthly', type: 'currency' },
      { key: 'weeklyAverage', label: 'Weekly', type: 'currency' },
    ],
    historyMetric: { key: 'summary.operatingIncome', label: 'operating income', type: 'currency' },
  },
  'sales-pipeline-forecast': {
    kicker: 'Marketing',
    title: 'Sales Pipeline Forecast',
    source: 'F-700e Sales Pipeline Forecast form.xlsx',
    description:
      'Eight-product sales revenue and order forecast rebuilt from the Product 1 through Product 8 workbook tabs.',
    scalarFields: [
      { name: 'defaultRevenueIncreasePct', label: 'Default Revenue Increase %', type: 'number', step: 0.1, defaultValue: 5 },
      { name: 'defaultOrderIncreasePct', label: 'Default Order Increase %', type: 'number', step: 0.1, defaultValue: 7 },
    ],
    collections: [
      {
        key: 'products',
        label: 'Products',
        rowLabel: 'Product',
        maxRows: 8,
        defaultRows: [
          { productName: 'Product 1', actualRevenue: 100000, actualOrders: 50, revenueIncreasePct: '', orderIncreasePct: '' },
          { productName: 'Product 2', actualRevenue: 125000, actualOrders: 62, revenueIncreasePct: '', orderIncreasePct: '' },
          { productName: 'Product 3', actualRevenue: 90000, actualOrders: 45, revenueIncreasePct: '', orderIncreasePct: '' },
          { productName: 'Product 4', actualRevenue: 150000, actualOrders: 70, revenueIncreasePct: '', orderIncreasePct: '' },
        ],
        fields: [
          { name: 'productName', label: 'Product', type: 'text' },
          { name: 'actualRevenue', label: 'Actual Revenue', type: 'number', min: 0 },
          { name: 'actualOrders', label: 'Actual Orders', type: 'number', min: 0 },
          { name: 'revenueIncreasePct', label: 'Revenue Increase %', type: 'number', step: 0.1 },
          { name: 'orderIncreasePct', label: 'Order Increase %', type: 'number', step: 0.1 },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalActualRevenue', label: 'Actual Revenue', type: 'currency' },
      { key: 'totalForecastRevenue', label: 'Forecast Revenue', type: 'currency' },
      { key: 'revenueLift', label: 'Revenue Lift', type: 'currency' },
      { key: 'forecastOrders', label: 'Forecast Orders', type: 'number' },
    ],
    tableFields: [
      { key: 'productName', label: 'Product', type: 'text' },
      { key: 'actualRevenue', label: 'Actual Revenue', type: 'currency' },
      { key: 'forecastRevenue', label: 'Forecast Revenue', type: 'currency' },
      { key: 'revenueLift', label: 'Lift', type: 'currency' },
      { key: 'actualOrders', label: 'Actual Orders', type: 'number' },
      { key: 'forecastOrders', label: 'Forecast Orders', type: 'number' },
      { key: 'averageOrderValue', label: 'Avg Order Value', type: 'currency' },
    ],
    historyMetric: { key: 'summary.totalForecastRevenue', label: 'forecast revenue', type: 'currency' },
  },
  'cash-flow-forecast-worksheet': {
    kicker: 'Analysis',
    title: 'Cash Flow Forecast Worksheet',
    source: 'F-900a Cash Flow Forecast worksheet.xls',
    description:
      'Projected cash activity rebuilt from the Accounts Receivable, Accounts Payable, and Projected Cash Activity workbook tabs.',
    scalarFields: [
      { name: 'beginningCash', label: 'Beginning Bank Balance', type: 'number', min: 0, defaultValue: 0 },
      { name: 'minimumCashReserve', label: 'Minimum Cash Reserve', type: 'number', min: 0, defaultValue: 0 },
    ],
    collections: [
      {
        key: 'weeks',
        label: 'Weeks',
        rowLabel: 'Week',
        maxRows: 26,
        defaultRows: Array.from({ length: 9 }, (_, index) => ({
          weekLabel: `Week ${index + 1}`,
          arCollections: '',
          deposits: '',
          apPayments: '',
          payroll: '',
          rent: '',
          utilities: '',
          otherPayments: '',
        })),
        fields: [
          { name: 'weekLabel', label: 'Week', type: 'text' },
          { name: 'arCollections', label: 'A/R Collections', type: 'number', min: 0 },
          { name: 'deposits', label: 'Deposits', type: 'number', min: 0 },
          { name: 'apPayments', label: 'A/P Payments', type: 'number', min: 0 },
          { name: 'payroll', label: 'Payroll', type: 'number', min: 0 },
          { name: 'rent', label: 'Rent', type: 'number', min: 0 },
          { name: 'utilities', label: 'Utilities', type: 'number', min: 0 },
          { name: 'otherPayments', label: 'Other Payments', type: 'number', min: 0 },
        ],
      },
    ],
    summaryFields: [
      { key: 'totalReceipts', label: 'Receipts', type: 'currency' },
      { key: 'totalPayments', label: 'Payments', type: 'currency' },
      { key: 'endingCash', label: 'Ending Cash', type: 'currency' },
      { key: 'lowestCashBalance', label: 'Lowest Cash', type: 'currency' },
    ],
    tableFields: [
      { key: 'weekLabel', label: 'Week', type: 'text' },
      { key: 'beginningCash', label: 'Beginning Cash', type: 'currency' },
      { key: 'totalCashAvailable', label: 'Cash Available', type: 'currency' },
      { key: 'totalPayments', label: 'Payments', type: 'currency' },
      { key: 'netCashFlow', label: 'Net Cash', type: 'currency' },
      { key: 'endingCash', label: 'Ending Cash', type: 'currency' },
      { key: 'reserveShortfall', label: 'Reserve Shortfall', type: 'currency' },
    ],
    historyMetric: { key: 'summary.endingCash', label: 'ending cash', type: 'currency' },
  },
  'f-1200-ar-turns': {
    kicker: 'Analysis',
    title: 'F-1200 AR Turns Worksheet',
    source: 'F-1200 AR Turns Worksheet.xls',
    description:
      'Accounts receivable turnover and average collection period rebuilt from the AR Turns and Balance Calculation worksheet.',
    scalarFields: [
      { name: 'daysPerYear', label: 'Days Per Year', type: 'number', min: 1, defaultValue: 365 },
      { name: 'annualCreditSales', label: 'Annual Sales (Credit)', type: 'number', min: 0, defaultValue: 1200000 },
      { name: 'beginningArBalance', label: 'Beginning A/R Balance', type: 'number', min: 0, defaultValue: 180000 },
      { name: 'endingArBalance', label: 'Ending A/R Balance', type: 'number', min: 0, defaultValue: 220000 },
      { name: 'averageArBalance', label: 'Average A/R Balance (override)', type: 'number', min: 0, defaultValue: '' },
    ],
    summaryFields: [
      { key: 'arTurns', label: 'AR Turns', type: 'number' },
      { key: 'avgCollectionPeriodDays', label: 'Avg Collection Period', type: 'number' },
      { key: 'averageArBalance', label: 'Average A/R', type: 'currency' },
      { key: 'arPctOfSales', label: 'A/R % of Sales', type: 'percent' },
    ],
    tableFields: [
      { key: 'scenario', label: 'Scenario', type: 'text' },
      { key: 'annualCreditSales', label: 'Annual Credit Sales', type: 'currency' },
      { key: 'averageArBalance', label: 'Average A/R', type: 'currency' },
      { key: 'arTurns', label: 'AR Turns', type: 'number' },
      { key: 'avgCollectionPeriodDays', label: 'Collection Days', type: 'number' },
    ],
    historyMetric: { key: 'summary.arTurns', label: 'AR turns', type: 'number' },
  },
  'inventory-turn-calculation': {
    kicker: 'Analysis',
    title: 'Inventory Turn Calculation',
    source: 'Inventory Turn calculation.xls',
    description:
      'Inventory turns per year and average days inventory is held, rebuilt from the BMS inventory turn worksheet.',
    scalarFields: [
      { name: 'daysPerYear', label: 'Days Per Year', type: 'number', min: 1, defaultValue: 365 },
      { name: 'costOfSales', label: 'Cost of Sales', type: 'number', min: 0, defaultValue: 850000 },
      { name: 'beginningInventory', label: 'Beginning Inventory', type: 'number', min: 0, defaultValue: 95000 },
      { name: 'endingInventory', label: 'Ending Inventory', type: 'number', min: 0, defaultValue: 105000 },
      { name: 'averageInventory', label: 'Average Inventory (override)', type: 'number', min: 0, defaultValue: '' },
    ],
    summaryFields: [
      { key: 'inventoryTurnsPerYear', label: 'Inventory Turns', type: 'number' },
      { key: 'averageDaysHeld', label: 'Avg Days Held', type: 'number' },
      { key: 'averageInventory', label: 'Average Inventory', type: 'currency' },
      { key: 'inventoryPctOfCogs', label: 'Inventory % of COGS', type: 'percent' },
    ],
    tableFields: [
      { key: 'scenario', label: 'Scenario', type: 'text' },
      { key: 'costOfSales', label: 'Cost of Sales', type: 'currency' },
      { key: 'averageInventory', label: 'Average Inventory', type: 'currency' },
      { key: 'inventoryTurnsPerYear', label: 'Turns / Year', type: 'number' },
      { key: 'averageDaysHeld', label: 'Days Held', type: 'number' },
    ],
    historyMetric: { key: 'summary.inventoryTurnsPerYear', label: 'inventory turns', type: 'number' },
  },
  'cost-vs-sales-increase': {
    kicker: 'Analysis',
    title: 'Cost vs Sales Increase',
    source: 'Cost vs Sales Increase.xls',
    description:
      'Shows how profit responds when sales increase but variable costs rise with revenue while fixed expenses stay flat.',
    scalarFields: [
      { name: 'currentSales', label: 'Current Annual Sales', type: 'number', min: 0, defaultValue: 1000000 },
      { name: 'salesIncreasePercent', label: 'Sales Increase %', type: 'number', step: 0.1, defaultValue: 10 },
      { name: 'variableCostPercent', label: 'Variable Cost % of Sales', type: 'number', min: 0, max: 100, step: 0.1, defaultValue: 65 },
      { name: 'fixedExpenses', label: 'Annual Fixed Expenses', type: 'number', min: 0, defaultValue: 250000 },
      { name: 'monthlyFixedExpenses', label: 'Monthly Fixed Expenses (optional)', type: 'number', min: 0, defaultValue: '' },
    ],
    summaryFields: [
      { key: 'newSales', label: 'New Sales', type: 'currency' },
      { key: 'newProfit', label: 'New Profit', type: 'currency' },
      { key: 'profitChange', label: 'Profit Change', type: 'currency' },
      { key: 'profitChangePct', label: 'Profit Change %', type: 'percent' },
    ],
    tableFields: [
      { key: 'salesIncreasePct', label: 'Sales Increase %', type: 'percent' },
      { key: 'newSales', label: 'New Sales', type: 'currency' },
      { key: 'newProfit', label: 'New Profit', type: 'currency' },
      { key: 'profitChange', label: 'Profit Change', type: 'currency' },
      { key: 'profitChangePct', label: 'Profit Change %', type: 'percent' },
    ],
    historyMetric: { key: 'summary.profitChange', label: 'profit change', type: 'currency' },
  },
  'f-300a-overhead-calcs': {
    kicker: 'Analysis',
    title: 'F-300a Overhead Calcs',
    source: 'F-300a Overhead Calcs.xls',
    description:
      'Overhead factoring rates based on annual revenue, fixed overhead, material costs, and direct labor.',
    scalarFields: [
      { name: 'totalRevenue', label: 'Total Revenue', type: 'number', min: 0, defaultValue: 2500000 },
      { name: 'totalOverhead', label: 'Total Overhead (Fixed Costs)', type: 'number', min: 0, defaultValue: 450000 },
      { name: 'totalMaterialCosts', label: 'Total Material Costs', type: 'number', min: 0, defaultValue: 700000 },
      { name: 'totalDirectLaborCosts', label: 'Total Direct Labor Costs', type: 'number', min: 0, defaultValue: 550000 },
    ],
    summaryFields: [
      { key: 'overheadFactorOnDirect', label: 'Overhead Factor on Direct', type: 'number' },
      { key: 'overheadPctOfRevenue', label: 'Overhead % of Revenue', type: 'percent' },
      { key: 'burdenedDirectCost', label: 'Burdened Direct Cost', type: 'currency' },
      { key: 'grossProfit', label: 'Gross Profit', type: 'currency' },
    ],
    tableFields: [
      { key: 'metric', label: 'Metric', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'pctOfRevenue', label: '% of Revenue', type: 'percent' },
    ],
    historyMetric: { key: 'summary.overheadFactorOnDirect', label: 'overhead factor', type: 'number' },
  },
};

function buildConfig(workbookKey, definition) {
  return {
    key: workbookKey,
    kicker: definition.kicker,
    title: definition.title,
    description: definition.description,
    source: definition.source,
    api: {
      calculate: '/api/worksheets/workbook-ports/calculate',
      runs: '/api/worksheets/workbook-ports/runs',
      runParams: { workbook_key: workbookKey },
      buildRequestBody: (payload) => ({ workbookKey, inputs: payload }),
    },
    pdf: null,
    submitLabel: 'Calculate & Save',
    fields: Object.fromEntries(
      (definition.scalarFields || []).map((field) => [
        field.name,
        {
          label: field.label,
          type: field.type,
          min: field.min,
          max: field.max,
          step: field.step,
          default: field.defaultValue ?? '',
        },
      ]),
    ),
    collections: Object.fromEntries(
      (definition.collections || []).map((collection) => [
        collection.key,
        {
          label: collection.label,
          rowLabel: collection.rowLabel,
          maxRows: collection.maxRows,
          defaultRows: collection.defaultRows,
          fields: collection.fields,
        },
      ]),
    ),
    steps: [
      {
        id: 'inputs',
        fieldNames: (definition.scalarFields || []).map((field) => field.name),
        collections: (definition.collections || []).map((collection) => collection.key),
      },
    ],
    results: {
      title: 'Workbook Summary',
      kpis: (definition.summaryFields || []).map((field) => ({
        key: `summary.${field.key}`,
        label: field.label,
        type: field.type,
      })),
      tables: [
        {
          rowsKey: 'rows',
          columns: definition.tableFields || [],
        },
      ],
      notesKey: 'warnings',
    },
    history: { metric: definition.historyMetric },
  };
}

const WORKBOOK_PORT_CONFIGS = Object.fromEntries(
  Object.entries(PORT_DEFINITIONS).map(([workbookKey, definition]) => [
    workbookKey,
    buildConfig(workbookKey, definition),
  ]),
);

export default WORKBOOK_PORT_CONFIGS;
