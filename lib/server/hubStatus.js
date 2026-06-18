import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import { getRunSelectForTable, RUN_TABLES } from '@/lib/worksheets/worksheetRunRegistry';
import {
  buildHubStatusItem,
  buildHubStatusSummary,
  indexRowsByWorksheetKey,
} from '@/lib/worksheets/hubStatusAggregation';
import { getFinancialSnapshot } from '@/lib/server/financialSnapshot';

function isMissingWorksheetDraftsTableError(error) {
  const message = error?.message || '';
  return message.includes('client_worksheet_drafts') && message.includes('Could not find the table');
}

export {
  buildHubStatusItem,
  buildHubStatusSummary,
  pickLatestRunRow,
  resolveDerivedRunSignals,
} from '@/lib/worksheets/hubStatusAggregation';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} clientId
 */
/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} clientId
 * @returns {Promise<Map<string, Record<string, unknown>>>}
 */
export async function fetchWorksheetDraftsByKey(supabase, clientId) {
  const { data, error } = await supabase
    .from('client_worksheet_drafts')
    .select('worksheet_key, draft_json')
    .eq('client_id', clientId);

  if (error) {
    if (isMissingWorksheetDraftsTableError(error)) {
      return new Map();
    }
    throw new Error(error.message || 'Failed to load worksheet drafts.');
  }

  /** @type {Map<string, Record<string, unknown>>} */
  const draftsByKey = new Map();
  for (const row of data || []) {
    if (row?.worksheet_key && row.draft_json && typeof row.draft_json === 'object') {
      draftsByKey.set(row.worksheet_key, row.draft_json);
    }
  }

  return draftsByKey;
}

export async function fetchLatestRunsByWorksheetKey(supabase, clientId) {
  /** @type {Map<string, import('@/lib/worksheets/hubStatusAggregation.js').LatestRunRow|null>} */
  const latestRunsByKey = new Map();

  const results = await Promise.all(
    RUN_TABLES.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select(getRunSelectForTable(table))
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(error.message || `Failed to load ${table}.`);
      }

      return { table, rows: data || [] };
    }),
  );

  for (const { table, rows } of results) {
    const keyed = indexRowsByWorksheetKey(table, rows);
    for (const [worksheetKey, run] of keyed.entries()) {
      latestRunsByKey.set(worksheetKey, run);
    }
  }

  return latestRunsByKey;
}

/**
 * @param {string} clientId
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function getClientHubStatus(clientId, supabase) {
  const [snapshotData, latestRunsByKey, draftsByKey] = await Promise.all([
    getFinancialSnapshot(clientId),
    fetchLatestRunsByWorksheetKey(supabase, clientId),
    fetchWorksheetDraftsByKey(supabase, clientId),
  ]);

  const provenance = snapshotData.provenance || {};
  const items = worksheetCatalog.map((catalogEntry) =>
    buildHubStatusItem(catalogEntry, clientId, latestRunsByKey, provenance, draftsByKey),
  );
  const summary = buildHubStatusSummary(items, snapshotData.updated_at || null);

  return {
    ok: true,
    clientId,
    items,
    summary,
  };
}

/**
 * Hub status for a single worksheet page (shell initial status).
 * @param {string} clientId
 * @param {string} worksheetKey
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function getHubStatusItemForWorksheet(clientId, worksheetKey, supabase) {
  const catalogEntry = worksheetCatalog.find((entry) => entry.key === worksheetKey);
  if (!catalogEntry) {
    return null;
  }

  const [snapshotData, latestRunsByKey, draftsByKey, statusResult] = await Promise.all([
    getFinancialSnapshot(clientId),
    fetchLatestRunsByWorksheetKey(supabase, clientId),
    fetchWorksheetDraftsByKey(supabase, clientId),
    supabase
      .from('client_worksheet_status')
      .select('status')
      .eq('client_id', clientId)
      .eq('worksheet_key', worksheetKey)
      .maybeSingle(),
  ]);

  const item = buildHubStatusItem(
    catalogEntry,
    clientId,
    latestRunsByKey,
    snapshotData.provenance || {},
    draftsByKey,
  );

  if (statusResult.data?.status === 'complete') {
    return { ...item, status: 'complete' };
  }

  return item;
}
