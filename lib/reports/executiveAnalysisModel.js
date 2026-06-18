import { formatCurrency, formatPercent, formatRatio } from '../hub/formatters.js';

/**
 * @param {unknown} outputs
 */
export function yearsFromRunOutputs(outputs) {
  const years = outputs?.years;
  if (!Array.isArray(years)) return [];
  return years
    .filter((row) => row && row.year != null)
    .sort((a, b) => Number(a.year) - Number(b.year));
}

/**
 * @param {Array<Record<string, unknown>>} plYears
 */
export function buildPlTrend(plYears) {
  return plYears.map((row) => ({
    year: String(row.year),
    revenue: Number(row.revenue) || 0,
    netIncome: Number(row.netIncome) || 0,
    grossMarginPct: row.grossMarginPct != null ? Number(row.grossMarginPct) : null,
    revenueYoYPct: row.trend?.revenueYoYPct != null ? Number(row.trend.revenueYoYPct) : null,
  }));
}

/**
 * @param {Record<string, unknown>|null|undefined} plRow
 */
export function buildOpexBreakdown(plRow) {
  if (!plRow) return [];

  const revenue = Number(plRow.revenue) || 0;
  const buckets = [
    { label: 'COGS', amount: Number(plRow.cogs) || 0 },
    { label: 'Operating expenses', amount: Number(plRow.operatingExpenses) || 0 },
    { label: 'Other expenses', amount: Number(plRow.otherExpenses) || 0 },
    { label: 'Direct labor', amount: Number(plRow.laborAmount) || 0 },
    { label: 'Indirect costs', amount: Number(plRow.indirectCostsAmount) || 0 },
    { label: 'G&A', amount: Number(plRow.generalAdministrativeCostsAmount) || 0 },
  ].filter((bucket) => bucket.amount > 0);

  return buckets.map((bucket) => ({
    ...bucket,
    percentOfRevenue: revenue > 0 ? (bucket.amount / revenue) * 100 : null,
  }));
}

/**
 * @param {{
 *   latestPl: { year?: string, revenue?: number, netIncome?: number, grossMarginPct?: number|null }|null,
 *   bsLatest: Record<string, unknown>|null,
 *   snapshot: Record<string, unknown>,
 *   workingCapitalRun: Record<string, unknown>|null,
 *   cfiRun: Record<string, unknown>|null,
 * }} input
 */
export function buildExecutiveKpis(input) {
  const { latestPl, bsLatest, snapshot, workingCapitalRun, cfiRun } = input;

  return [
    {
      label: 'Annual Revenue',
      value: formatCurrency(latestPl?.revenue ?? snapshot.annualRevenue),
      hint: latestPl?.year ? `P&L ${latestPl.year}` : snapshot.annualRevenue != null ? 'From snapshot' : undefined,
    },
    {
      label: 'Net Income',
      value: formatCurrency(latestPl?.netIncome),
      hint: latestPl?.year ? `P&L ${latestPl.year}` : undefined,
    },
    {
      label: 'Gross Margin',
      value: formatPercent(latestPl?.grossMarginPct),
      hint: latestPl?.year ? `P&L ${latestPl.year}` : undefined,
    },
    {
      label: 'Current Ratio',
      value: formatRatio(bsLatest?.currentRatio),
      hint: bsLatest?.year ? `Balance sheet ${bsLatest.year}` : undefined,
    },
    {
      label: 'Net Working Capital',
      value: formatCurrency(workingCapitalRun?.outputs?.netWorkingCapital ?? cfiRun?.outputs?.netWorkingCapital),
      hint: workingCapitalRun ? 'Working capital run' : cfiRun ? 'CFI run' : undefined,
    },
  ];
}

/**
 * @param {{
 *   plRun: Record<string, unknown>|null,
 *   bsRun: Record<string, unknown>|null,
 *   cfiRun: Record<string, unknown>|null,
 *   fiveYearRun: Record<string, unknown>|null,
 *   workingCapitalRun: Record<string, unknown>|null,
 *   plTrend: Array<unknown>,
 *   ratioCards: Array<unknown>,
 *   opexBreakdown: Array<unknown>,
 *   coreProgress: { complete: number, total: number },
 * }} input
 */
export function buildDataCoverage(input) {
  const hasPlRun = Boolean(input.plRun);
  const hasBsRun = Boolean(input.bsRun);
  const plTrendYears = input.plTrend.length;
  const hasOpexDetail = input.opexBreakdown.length > 0;
  const hasRatios = input.ratioCards.length > 0;
  const hasFiveYear = Boolean(input.fiveYearRun);
  const hasWorkingCapital = Boolean(input.workingCapitalRun || input.cfiRun);

  const missingBlocks = [];
  if (!hasPlRun) missingBlocks.push('P&L Comparisons');
  if (!hasBsRun) missingBlocks.push('Balance Sheet Comparisons');
  if (plTrendYears < 2) missingBlocks.push('multi-year P&L trend');
  if (!hasRatios) missingBlocks.push('financial ratios');
  if (!hasFiveYear) missingBlocks.push('five-year outlook');

  return {
    hasPlRun,
    hasBsRun,
    plTrendYears,
    hasOpexDetail,
    hasRatios,
    hasFiveYear,
    hasWorkingCapital,
    missingBlocks,
    isSparse: !hasPlRun || !hasBsRun || input.coreProgress.complete < input.coreProgress.total,
    isEmpty: !hasPlRun && !hasBsRun && !hasWorkingCapital && !hasFiveYear,
  };
}

/**
 * @param {ReturnType<typeof buildDataCoverage>} coverage
 * @param {string} clientId
 */
export function buildPanelEmptyStates(coverage, clientId) {
  const sheetHref = (worksheetKey) => `/workspace/${clientId}/analyst-wizard/sheets/${worksheetKey}`;

  return {
    banner: coverage.isEmpty
      ? {
          severity: 'info',
          title: 'No saved financial runs yet',
          message:
            'This dashboard reads from saved worksheet runs. Start with P&L Comparisons and Balance Sheet Comparisons, then return here for KPIs, trends, and insights.',
          actionLabel: 'Open worksheet hub',
          actionHref: `/workspace/${clientId}/analyst-wizard`,
        }
      : coverage.isSparse
        ? {
            severity: 'warn',
            title: 'Executive analysis is partially populated',
            message: `Missing: ${coverage.missingBlocks.slice(0, 4).join(', ')}${coverage.missingBlocks.length > 4 ? ', …' : ''}. Complete the highlighted worksheets below to fill KPI gaps.`,
            actionLabel: 'View recommended actions',
            actionHref: '#executive-analysis-actions',
          }
        : null,
    trend:
      coverage.plTrendYears >= 2
        ? null
        : {
            message:
              coverage.plTrendYears === 1
                ? 'One P&L year saved. Add a prior year in P&L Comparisons to compare revenue and net income year over year.'
                : 'Save at least two years in P&L Comparisons to see revenue and net income trends.',
            actionLabel: coverage.plTrendYears === 0 ? 'Open P&L Comparisons' : 'Add another P&L year',
            actionHref: sheetHref('p-l-comparisons'),
          },
    opex: coverage.hasOpexDetail
      ? null
      : {
          message: coverage.hasPlRun
            ? 'The latest P&L run has no expense line detail. Re-save P&L Comparisons with COGS and operating expense amounts.'
            : 'Save a P&L Comparisons run with revenue and expense detail to populate this breakdown.',
          actionLabel: 'Open P&L Comparisons',
          actionHref: sheetHref('p-l-comparisons'),
        },
    ratios: coverage.hasRatios
      ? null
      : {
          message:
            coverage.hasPlRun && !coverage.hasBsRun
              ? 'Balance sheet data is missing. Save Balance Sheet Comparisons to unlock liquidity and leverage ratios.'
              : coverage.hasBsRun && !coverage.hasPlRun
                ? 'P&L data is missing. Save P&L Comparisons to unlock profitability ratios.'
                : 'Save P&L and balance sheet runs to populate ratio cards.',
          actionLabel:
            !coverage.hasBsRun ? 'Open Balance Sheet Comparisons' : !coverage.hasPlRun ? 'Open P&L Comparisons' : 'Open worksheet hub',
          actionHref: !coverage.hasBsRun
            ? sheetHref('balance-sht-comparisons')
            : !coverage.hasPlRun
              ? sheetHref('p-l-comparisons')
              : `/workspace/${clientId}/analyst-wizard`,
        },
    fiveYear: coverage.hasFiveYear
      ? null
      : {
          message: 'Save a 5-Year Projections run to show the long-range revenue and EBITDA outlook on this dashboard.',
          actionLabel: 'Open 5-Year Projections',
          actionHref: sheetHref('5-year-projections'),
        },
  };
}

/**
 * @param {Record<string, unknown>} report
 */
export function validateExecutiveAnalysisPdfPayload(report) {
  if (!report || typeof report !== 'object') {
    throw new Error('Missing executive analysis payload.');
  }
  if (!report.companyName) {
    throw new Error('Missing company name in executive analysis payload.');
  }
  if (!Array.isArray(report.kpis)) {
    throw new Error('Executive analysis payload must include kpis array.');
  }
  if (!report.coreProgress || typeof report.coreProgress !== 'object') {
    throw new Error('Executive analysis payload must include coreProgress.');
  }
  return true;
}
