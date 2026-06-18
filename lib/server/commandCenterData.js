import 'server-only';

import { formatCurrency, formatPercent, formatRatio } from '@/lib/hub/formatters';
import { getFinancialSnapshot } from '@/lib/server/financialSnapshot';
import { getClientHubStatus } from '@/lib/server/hubStatus';

const COMMAND_CENTER_CLIENT_SELECT =
  'id, company_name, industry, primary_contact_name, primary_contact_email, primary_contact_phone, location_city, location_state, created_at';

/**
 * @param {unknown} outputs
 */
function latestPlYear(outputs) {
  const years = outputs?.years;
  if (!Array.isArray(years) || years.length === 0) return null;
  return years[years.length - 1];
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} clientId
 */
async function loadLatestStatementRuns(supabase, clientId) {
  const [plResult, bsResult] = await Promise.all([
    supabase
      .from('client_pl_comparisons_runs')
      .select('id, created_at, outputs')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('client_balance_sheet_comparisons_runs')
      .select('id, created_at, outputs')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    plRun: plResult.data || null,
    bsRun: bsResult.data || null,
  };
}

/**
 * @param {{ snapshot?: Record<string, unknown> }} snapshotData
 * @param {{ outputs?: Record<string, unknown> }|null} plRun
 * @param {{ outputs?: Record<string, unknown> }|null} bsRun
 */
function buildCommandCenterKpis(snapshotData, plRun, bsRun) {
  const snapshot = snapshotData.snapshot || {};
  const plLatest = latestPlYear(plRun?.outputs);
  const bsLatest = latestPlYear(bsRun?.outputs);

  const revenue = plLatest?.revenue ?? snapshot.annualRevenue;
  const netIncome = plLatest?.netIncome;
  const grossMarginPct = plLatest?.grossMarginPct;
  const totalAssets = bsLatest?.totalAssets;
  const currentRatio = bsLatest?.currentRatio;

  return [
    {
      label: 'Annual Revenue',
      value: formatCurrency(revenue),
      hint: plLatest?.year ? `P&L ${plLatest.year}` : snapshot.annualRevenue != null ? 'From snapshot' : undefined,
    },
    {
      label: 'Net Income',
      value: formatCurrency(netIncome),
      hint: plLatest?.year ? `Latest P&L year` : undefined,
    },
    {
      label: 'Gross Margin',
      value: formatPercent(grossMarginPct),
      hint: plLatest?.year ? `P&L ${plLatest.year}` : undefined,
    },
    {
      label: 'Total Assets',
      value: formatCurrency(totalAssets),
      hint: bsLatest?.year ? `Balance sheet ${bsLatest.year}` : undefined,
    },
    {
      label: 'Current Ratio',
      value: formatRatio(currentRatio),
      hint: bsLatest?.year ? `Balance sheet ${bsLatest.year}` : undefined,
    },
  ];
}

/**
 * @param {import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[]} items
 */
function pickRecentItems(items) {
  return items
    .filter((item) => item.integrationStatus !== 'planned' && item.lastUpdatedAt)
    .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
    .slice(0, 8);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} clientId
 */
export async function getCommandCenterData(supabase, clientId) {
  const [clientResult, snapshotData, statementRuns, hubStatus] = await Promise.all([
    supabase.from('clients').select(COMMAND_CENTER_CLIENT_SELECT).eq('id', clientId).maybeSingle(),
    getFinancialSnapshot(clientId),
    loadLatestStatementRuns(supabase, clientId),
    getClientHubStatus(clientId, supabase),
  ]);

  const client = clientResult.data;
  const coreItems = hubStatus.items
    .filter((item) => typeof item.coreRank === 'number')
    .sort((a, b) => (a.coreRank || 0) - (b.coreRank || 0));
  const progressPercent =
    hubStatus.summary.coreTotal > 0
      ? Math.round((hubStatus.summary.coreComplete / hubStatus.summary.coreTotal) * 100)
      : 0;

  return {
    client,
    kpis: buildCommandCenterKpis(snapshotData, statementRuns.plRun, statementRuns.bsRun),
    hubStatus,
    coreItems,
    progressPercent,
    recentItems: pickRecentItems(hubStatus.items),
  };
}
