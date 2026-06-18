import { buildWorksheetHubStatusEntry } from './hubStatus.js';
import { resolveProgressPercentFromDraft } from './stepWizardProgress.js';
import {
  getWorksheetRunRegistryEntry,
  isDerivedRegistryEntry,
  isTableRegistryEntry,
  WORKSHEET_RUN_REGISTRY,
} from './worksheetRunRegistry.js';

/**
 * @typedef {{ id: string, created_at: string, updated_at?: string, analysis_type?: string }} LatestRunRow
 */

/**
 * @param {LatestRunRow[]} rows
 * @returns {LatestRunRow|null}
 */
export function pickLatestRunRow(rows) {
  if (!rows?.length) return null;
  return rows.reduce((latest, row) => {
    if (!latest) return row;
    const latestAt = latest.updated_at || latest.created_at;
    const rowAt = row.updated_at || row.created_at;
    return rowAt > latestAt ? row : latest;
  }, null);
}

/**
 * @param {Map<string, LatestRunRow|null>} latestRunsByKey
 * @param {string[]} sourceRuns
 */
export function resolveDerivedRunSignals(latestRunsByKey, sourceRuns) {
  const sourceRows = sourceRuns.map((key) => latestRunsByKey.get(key)).filter(Boolean);
  const allSourcesPresent = sourceRuns.length > 0 && sourceRows.length === sourceRuns.length;
  const anySourcePresent = sourceRows.length > 0;

  return {
    latestRun: pickLatestRunRow(/** @type {LatestRunRow[]} */ (sourceRows)),
    allSourcesPresent,
    anySourcePresent,
  };
}

/**
 * @param {import('./hubStatus.js').WorksheetHubStatusEntry[]} items
 * @param {string|null} [snapshotUpdatedAt]
 */
export function buildHubStatusSummary(items, snapshotUpdatedAt = null) {
  const coreItems = items.filter((item) => typeof item.coreRank === 'number');
  const coreComplete = coreItems.filter((item) => item.status === 'complete').length;
  const integratedCount = items.filter((item) => item.integrationStatus !== 'planned').length;

  let lastActivityAt = snapshotUpdatedAt || null;
  for (const item of items) {
    if (!item.lastUpdatedAt) continue;
    if (!lastActivityAt || item.lastUpdatedAt > lastActivityAt) {
      lastActivityAt = item.lastUpdatedAt;
    }
  }

  return {
    coreComplete,
    coreTotal: coreItems.length,
    integratedCount,
    lastActivityAt,
  };
}

/**
 * @param {string} table
 * @param {LatestRunRow[]} rows
 */
export function indexRowsByWorksheetKey(table, rows) {
  /** @type {Map<string, LatestRunRow|null>} */
  const keyed = new Map();

  for (const [worksheetKey, entry] of Object.entries(WORKSHEET_RUN_REGISTRY)) {
    if (!isTableRegistryEntry(entry) || entry.table !== table) continue;

    if (entry.analysisType) {
      const matching = rows.filter((row) => row.analysis_type === entry.analysisType);
      keyed.set(worksheetKey, pickLatestRunRow(matching));
      continue;
    }

    keyed.set(worksheetKey, pickLatestRunRow(rows));
  }

  return keyed;
}

/**
 * @param {Record<string, unknown>} catalogEntry
 * @param {string} clientId
 * @param {Map<string, LatestRunRow|null>} latestRunsByKey
 * @param {Record<string, { source?: string, at?: string }>} provenance
 * @param {Map<string, Record<string, unknown>>} [draftsByKey]
 */
export function buildHubStatusItem(catalogEntry, clientId, latestRunsByKey, provenance, draftsByKey = new Map()) {
  const worksheetKey = String(catalogEntry.key);
  const registryEntry = getWorksheetRunRegistryEntry(worksheetKey);

  let latestRun = latestRunsByKey.get(worksheetKey) || null;
  let draftRun = false;

  if (registryEntry && isDerivedRegistryEntry(registryEntry)) {
    const { latestRun: derivedRun, allSourcesPresent, anySourcePresent } = resolveDerivedRunSignals(
      latestRunsByKey,
      registryEntry.sourceRuns,
    );
    latestRun = allSourcesPresent ? derivedRun : null;
    draftRun = anySourcePresent && !allSourcesPresent;
  }

  const entry = buildWorksheetHubStatusEntry({
    catalogEntry,
    clientId,
    latestRun,
    draftRun,
    provenance,
  });

  let progressPercent = null;
  let status = entry.status;
  const draft = draftsByKey.get(worksheetKey);

  if (entry.status !== 'complete' && entry.integrationStatus !== 'planned') {
    const draftProgress = resolveProgressPercentFromDraft(worksheetKey, draft);
    if (draftProgress !== null) {
      progressPercent = draftProgress;
      if (status === 'not_started') {
        status = 'in_progress';
      }
    }
  }

  return {
    ...entry,
    status,
    progressPercent,
  };
}
