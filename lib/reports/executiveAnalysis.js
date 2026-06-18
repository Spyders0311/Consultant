import 'server-only';

import { getFinancialSnapshot } from '@/lib/server/financialSnapshot';
import { getClientHubStatus } from '@/lib/server/hubStatus';
import { callEngineCalculate } from '@/lib/server/pythonEngineProxy';
import { DERIVED_RATIO_LABELS } from '@/lib/worksheets/derivedRatioConfigs';
import { normalizePLYearRow, pickLatestYearRow } from '@/lib/worksheets/worksheetPullHelpers';
import { buildExecutiveInsights, buildRecommendedActions } from '@/lib/reports/executiveAnalysisRules';
import {
  buildDataCoverage,
  buildExecutiveKpis,
  buildOpexBreakdown,
  buildPanelEmptyStates,
  buildPlTrend,
  yearsFromRunOutputs,
} from '@/lib/reports/executiveAnalysisModel';
import { formatPercent, formatRatio } from '@/lib/hub/formatters';

const CLIENT_SELECT = 'id, company_name, industry';

/**
 * @typedef {Object} ExecutiveAnalysisReport
 * @property {string} clientId
 * @property {string} companyName
 * @property {string|null} industry
 * @property {string} generatedAt
 * @property {Array<{ label: string, value: string, hint?: string }>} kpis
 * @property {Array<{ year: string, revenue: number, netIncome: number, grossMarginPct: number|null }>} plTrend
 * @property {Array<{ label: string, amount: number, percentOfRevenue: number|null }>} opexBreakdown
 * @property {Array<{ key: string, label: string, value: string }>} ratioCards
 * @property {Record<string, unknown>|null} fiveYearSummary
 * @property {Array<{ year: string, revenue: number, netIncome: number, ebitda: number }>} fiveYearYears
 * @property {Array<{ severity: 'info'|'warn'|'critical', title: string, detail: string }>} insights
 * @property {Array<{ worksheetKey: string, sheetName: string, status: string, href: string|null, coreRank: number, priority: string, reason: string, unlocks: string|null }>} recommendedActions
 * @property {{ complete: number, total: number, percent: number }} coreProgress
 * @property {Record<string, string|null>} dataSources
 * @property {boolean} hasMultiYearTrend
 * @property {ReturnType<typeof buildDataCoverage>} dataCoverage
 * @property {ReturnType<typeof buildPanelEmptyStates>} panelEmptyStates
 */

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} clientId
 * @param {string} table
 */
async function loadLatestRun(supabase, clientId, table) {
  const { data, error } = await supabase
    .from(table)
    .select('id, created_at, inputs, outputs')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || `Failed to load ${table}.`);
  }

  return data;
}

/**
 * @param {Record<string, unknown>|null} plRun
 * @param {Record<string, unknown>|null} bsRun
 */
async function loadFinancialRatios(plRun, bsRun) {
  const plYear = normalizePLYearRow(pickLatestYearRow(plRun?.inputs?.years));
  const bsYear = pickLatestYearRow(bsRun?.inputs?.years);
  const bsComputed = pickLatestYearRow(bsRun?.outputs?.years) || {};

  if (!plYear && !bsYear) {
    return null;
  }

  try {
    const result = await callEngineCalculate('/api/v1/worksheets/financial-ratios/calculate', {
      plYear: plYear
        ? {
            year: plYear.year,
            revenue: plYear.revenue,
            cogs: plYear.cogs,
            operatingExpenses: plYear.operatingExpenses,
            otherExpenses: plYear.otherExpenses,
          }
        : null,
      bsYear: bsYear || null,
      bsComputed,
    });
    return result?.ratios || null;
  } catch {
    return null;
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} clientId
 * @returns {Promise<ExecutiveAnalysisReport>}
 */
export async function buildExecutiveAnalysis(supabase, clientId) {
  const [
    clientResult,
    snapshotData,
    plRun,
    bsRun,
    cfiRun,
    breakevenRun,
    workingCapitalRun,
    fiveYearRun,
    hubStatus,
  ] = await Promise.all([
    supabase.from('clients').select(CLIENT_SELECT).eq('id', clientId).maybeSingle(),
    getFinancialSnapshot(clientId),
    loadLatestRun(supabase, clientId, 'client_pl_comparisons_runs'),
    loadLatestRun(supabase, clientId, 'client_balance_sheet_comparisons_runs'),
    loadLatestRun(supabase, clientId, 'client_current_financial_information_runs'),
    loadLatestRun(supabase, clientId, 'client_breakeven_runs'),
    loadLatestRun(supabase, clientId, 'client_working_capital_runs'),
    loadLatestRun(supabase, clientId, 'client_five_year_projections_runs'),
    getClientHubStatus(clientId, supabase),
  ]);

  const client = clientResult.data;
  const snapshot = snapshotData.snapshot || {};
  const plYears = yearsFromRunOutputs(plRun?.outputs);
  const plTrend = buildPlTrend(plYears);
  const latestPl = plTrend[plTrend.length - 1] || null;
  const bsYears = yearsFromRunOutputs(bsRun?.outputs);
  const bsLatest = bsYears[bsYears.length - 1] || null;
  const plInputLatest = normalizePLYearRow(pickLatestYearRow(plRun?.inputs?.years));
  const ratios = await loadFinancialRatios(plRun, bsRun);
  const opexBreakdown = buildOpexBreakdown(plInputLatest);

  const fiveYearYears = Array.isArray(fiveYearRun?.outputs?.years) ? fiveYearRun.outputs.years : [];
  const fiveYearLatest = fiveYearYears[fiveYearYears.length - 1] || null;
  const fiveYearSummary = fiveYearLatest
    ? {
        baseYear: fiveYearYears[0]?.year ?? null,
        year5: fiveYearLatest.year ?? null,
        year5Revenue: fiveYearLatest.revenue ?? null,
        year5NetIncome: fiveYearLatest.netIncome ?? null,
        year5Ebitda: fiveYearLatest.ebitda ?? null,
      }
    : null;

  const kpis = buildExecutiveKpis({
    latestPl,
    bsLatest,
    snapshot,
    workingCapitalRun,
    cfiRun,
  });

  const ratioCards = ratios
    ? Object.entries(DERIVED_RATIO_LABELS)
        .slice(0, 6)
        .map(([key, label]) => ({
          key,
          label,
          value:
            key.toLowerCase().includes('pct') || key.toLowerCase().includes('margin')
              ? formatPercent(ratios[key])
              : key.toLowerCase().includes('days')
                ? `${formatRatio(ratios[key])} days`
                : formatRatio(ratios[key]),
        }))
        .filter((card) => ratios[card.key] != null)
    : [];

  const coreProgress = {
    complete: hubStatus.summary.coreComplete,
    total: hubStatus.summary.coreTotal,
    percent:
      hubStatus.summary.coreTotal > 0
        ? Math.round((hubStatus.summary.coreComplete / hubStatus.summary.coreTotal) * 100)
        : 0,
  };

  const dataCoverage = buildDataCoverage({
    plRun,
    bsRun,
    cfiRun,
    fiveYearRun,
    workingCapitalRun,
    plTrend,
    ratioCards,
    opexBreakdown,
    coreProgress,
  });

  const insights = buildExecutiveInsights({
    plTrend,
    bsLatest,
    ratios: ratios || {},
    breakeven: breakevenRun?.outputs || null,
    hubSummary: hubStatus.summary,
    fiveYearSummary,
    dataCoverage,
  });

  const recommendedActions = buildRecommendedActions(hubStatus.items);
  const panelEmptyStates = buildPanelEmptyStates(dataCoverage, clientId);

  return {
    clientId,
    companyName: client?.company_name || 'Untitled client',
    industry: client?.industry || null,
    generatedAt: new Date().toISOString(),
    kpis,
    plTrend,
    opexBreakdown,
    ratioCards,
    fiveYearSummary,
    fiveYearYears: fiveYearYears.map((row) => ({
      year: String(row.year),
      revenue: Number(row.revenue) || 0,
      netIncome: Number(row.netIncome) || 0,
      ebitda: Number(row.ebitda) || 0,
    })),
    insights,
    recommendedActions,
    coreProgress,
    dataCoverage,
    panelEmptyStates,
    dataSources: {
      plRunAt: plRun?.created_at || null,
      bsRunAt: bsRun?.created_at || null,
      cfiRunAt: cfiRun?.created_at || null,
      breakevenRunAt: breakevenRun?.created_at || null,
      fiveYearRunAt: fiveYearRun?.created_at || null,
      snapshotAt: snapshotData.updated_at || null,
    },
    hasMultiYearTrend: plTrend.length >= 2,
  };
}
