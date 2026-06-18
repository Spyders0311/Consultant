import { formatCurrency, formatPercent, formatRatio } from '../hub/formatters.js';

/** @type {Record<string, { notStarted: string, inProgress: string, unlocks: string }>} */
export const WORKSHEET_ANALYSIS_GAPS = {
  'basic-client-info': {
    notStarted: 'Add the client profile so reports show accurate company and industry context.',
    inProgress: 'Finish Basic Client Info — partial intake limits executive summary context.',
    unlocks: 'company profile on reports',
  },
  'current-financial-information': {
    notStarted: 'Save Current Financial Information to refine KPI cards and working-capital estimates.',
    inProgress: 'Complete Current Financial Information — a saved run unlocks richer KPI sourcing.',
    unlocks: 'KPI cards and working capital',
  },
  'p-l-comparisons': {
    notStarted: 'Save P&L Comparisons to populate revenue, margin KPIs, trends, and expense breakdown.',
    inProgress: 'Finish P&L Comparisons — expense detail and multi-year history drive most of this dashboard.',
    unlocks: 'revenue KPIs, trends, and opex breakdown',
  },
  'balance-sht-comparisons': {
    notStarted: 'Save Balance Sheet Comparisons to unlock current ratio and liquidity insights.',
    inProgress: 'Finish Balance Sheet Comparisons — ratio cards and liquidity flags need a saved run.',
    unlocks: 'current ratio KPI and liquidity ratios',
  },
  'breakeven-analysis': {
    notStarted: 'Run Breakeven Analysis to add profit-threshold insights against latest revenue.',
    inProgress: 'Complete Breakeven Analysis — save a run to compare breakeven revenue to actuals.',
    unlocks: 'breakeven vs revenue insights',
  },
  'working-capital-analysis': {
    notStarted: 'Save Working Capital Analysis for a dedicated net working capital KPI.',
    inProgress: 'Complete Working Capital Analysis — save a run to replace CFI estimates on the NWC KPI.',
    unlocks: 'net working capital KPI',
  },
  '5-year-projections': {
    notStarted: 'Save 5-Year Projections to populate the long-range outlook panel.',
    inProgress: 'Finish 5-Year Projections — save a run to show year-5 revenue and EBITDA here.',
    unlocks: 'five-year outlook panel',
  },
};

/**
 * @param {import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry} item
 */
export function buildWorksheetGapReason(item) {
  const gap = WORKSHEET_ANALYSIS_GAPS[item.worksheetKey];
  if (gap) {
    if (item.status === 'not_started') return gap.notStarted;
    if (item.status === 'in_progress') {
      if (typeof item.progressPercent === 'number' && item.progressPercent > 0) {
        return `${gap.inProgress} (${item.progressPercent}% complete in draft.)`;
      }
      return gap.inProgress;
    }
  }

  if (item.status === 'not_started') {
    return item.description
      ? `Core worksheet not started — unlocks ${item.description.toLowerCase()}.`
      : 'Core worksheet has no saved run yet.';
  }

  return item.description
    ? `Worksheet in progress — finish to unlock ${item.description.toLowerCase()}.`
    : 'Worksheet is in progress — finish and save a run.';
}

/**
 * @param {{
 *   plTrend: Array<{ year: string, revenue: number, netIncome: number, grossMarginPct: number|null }>,
 *   bsLatest: Record<string, unknown>|null,
 *   ratios: Record<string, number|null>,
 *   breakeven: Record<string, unknown>|null,
 *   hubSummary: { coreComplete: number, coreTotal: number },
 *   fiveYearSummary: Record<string, unknown>|null,
 *   dataCoverage?: { isEmpty?: boolean },
 * }} input
 */
export function buildExecutiveInsights(input) {
  /** @type {Array<{ severity: 'info'|'warn'|'critical', title: string, detail: string }>} */
  const insights = [];
  const latestPl = input.plTrend[input.plTrend.length - 1];
  const previousPl = input.plTrend.length >= 2 ? input.plTrend[input.plTrend.length - 2] : null;

  if (input.dataCoverage?.isEmpty) {
    insights.push({
      severity: 'info',
      title: 'No financial runs saved yet',
      detail: 'Start with P&L Comparisons and Balance Sheet Comparisons, then revisit this page for KPIs and insights.',
    });
    return insights;
  }

  if (input.hubSummary.coreComplete < input.hubSummary.coreTotal) {    const remaining = input.hubSummary.coreTotal - input.hubSummary.coreComplete;
    insights.push({
      severity: 'info',
      title: 'Core analyst worksheets incomplete',
      detail: `${remaining} of ${input.hubSummary.coreTotal} core worksheets still need a saved run.`,
    });
  }

  if (latestPl && latestPl.netIncome < 0) {
    insights.push({
      severity: 'warn',
      title: 'Latest year shows a net loss',
      detail: `Net income for ${latestPl.year} is ${formatCurrency(latestPl.netIncome)}.`,
    });
  }

  if (previousPl && latestPl && latestPl.revenue < previousPl.revenue) {
    insights.push({
      severity: 'warn',
      title: 'Revenue declined year over year',
      detail: `Revenue fell from ${formatCurrency(previousPl.revenue)} (${previousPl.year}) to ${formatCurrency(latestPl.revenue)} (${latestPl.year}).`,
    });
  }

  if (latestPl?.grossMarginPct != null && latestPl.grossMarginPct < 20) {
    insights.push({
      severity: 'warn',
      title: 'Gross margin below 20%',
      detail: `Latest gross margin is ${formatPercent(latestPl.grossMarginPct)}.`,
    });
  }

  if (input.bsLatest?.currentRatio != null && Number(input.bsLatest.currentRatio) < 1) {
    insights.push({
      severity: 'critical',
      title: 'Current ratio below 1.0',
      detail: `Latest current ratio is ${formatRatio(input.bsLatest.currentRatio)} — short-term liquidity may be strained.`,
    });
  }

  if (input.breakeven?.breakevenRevenue != null && latestPl?.revenue != null) {
    const breakevenRevenue = Number(input.breakeven.breakevenRevenue);
    if (breakevenRevenue > latestPl.revenue) {
      insights.push({
        severity: 'critical',
        title: 'Operating above breakeven threshold',
        detail: `Breakeven revenue (${formatCurrency(breakevenRevenue)}) exceeds latest annual revenue (${formatCurrency(latestPl.revenue)}).`,
      });
    }
  }

  if (input.fiveYearSummary?.year5Revenue != null && latestPl?.revenue != null) {
    const growth =
      latestPl.revenue > 0
        ? ((Number(input.fiveYearSummary.year5Revenue) - latestPl.revenue) / latestPl.revenue) * 100
        : null;
    if (growth != null && growth > 0) {
      insights.push({
        severity: 'info',
        title: 'Five-year outlook shows revenue growth',
        detail: `Projected year-5 revenue implies roughly ${growth.toFixed(1)}% growth from the latest P&L year.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      severity: 'info',
      title: 'No critical flags detected',
      detail: 'Saved runs look stable based on current thresholds. Continue filling core worksheets for a fuller picture.',
    });
  }

  return insights;
}

/**
 * @param {import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[]} hubItems
 */
export function buildRecommendedActions(hubItems) {
  return hubItems
    .filter(
      (item) =>
        typeof item.coreRank === 'number' &&
        item.integrationStatus !== 'planned' &&
        item.status !== 'complete' &&
        item.href,
    )
    .sort((a, b) => {
      const priority = { not_started: 0, in_progress: 1 };
      const rankDiff = (a.coreRank || 0) - (b.coreRank || 0);
      if (rankDiff !== 0) return rankDiff;
      return (priority[a.status] ?? 2) - (priority[b.status] ?? 2);
    })
    .map((item) => ({
      worksheetKey: item.worksheetKey,
      sheetName: item.sheetName,
      status: item.status,
      href: item.href,
      coreRank: item.coreRank,
      priority: item.status === 'not_started' ? 'high' : 'medium',
      unlocks: WORKSHEET_ANALYSIS_GAPS[item.worksheetKey]?.unlocks || null,
      reason: buildWorksheetGapReason(item),
    }));
}