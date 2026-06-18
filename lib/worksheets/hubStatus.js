/**
 * @typedef {'financial-analysis' | 'ratios' | 'valuation' | 'labor-payroll' | 'operating-expenses' | 'reports-slides' | 'matrices'} HubCategory
 */

/**
 * @typedef {'native' | 'derived' | 'workbook-port' | 'planned'} IntegrationStatus
 */

/**
 * @typedef {'complete' | 'in_progress' | 'not_started' | 'planned'} WorksheetHubLifecycleStatus
 */

/**
 * @typedef {Object} WorksheetHubStatusEntry
 * @property {string} worksheetKey
 * @property {string} sheetName
 * @property {HubCategory} hubCategory
 * @property {IntegrationStatus} integrationStatus
 * @property {WorksheetHubLifecycleStatus} status
 * @property {string|null} lastUpdatedAt
 * @property {string|null} lastRunId
 * @property {number} [progressPercent]
 * @property {string|null} href
 * @property {string} [description]
 * @property {number} [coreRank]
 */

/**
 * @typedef {Object} WorksheetStatusSignals
 * @property {IntegrationStatus} integrationStatus
 * @property {boolean} [hasLatestRun]
 * @property {boolean} [hasDraftRun]
 * @property {boolean} [hasSnapshotProvenance]
 */

/**
 * @typedef {Object} HubStatusSummary
 * @property {number} coreComplete
 * @property {number} coreTotal
 * @property {number} integratedCount
 * @property {string|null} lastActivityAt
 */

/**
 * @typedef {Object} HubStatusResponse
 * @property {boolean} ok
 * @property {string} clientId
 * @property {WorksheetHubStatusEntry[]} items
 * @property {HubStatusSummary} summary
 */

/**
 * v1 status rules:
 * - planned integration → planned (not navigable)
 * - latest run exists → complete
 * - snapshot provenance or draft run → in_progress
 * - otherwise → not_started
 *
 * @param {WorksheetStatusSignals} signals
 * @returns {WorksheetHubLifecycleStatus}
 */
export function resolveWorksheetStatus({
  integrationStatus,
  hasLatestRun = false,
  hasDraftRun = false,
  hasSnapshotProvenance = false,
}) {
  if (integrationStatus === 'planned') {
    return 'planned';
  }
  if (hasLatestRun) {
    return 'complete';
  }
  if (hasDraftRun || hasSnapshotProvenance) {
    return 'in_progress';
  }
  return 'not_started';
}

/**
 * @param {Record<string, { source?: string, at?: string }>|null|undefined} provenance
 * @param {string} worksheetKey
 * @returns {boolean}
 */
export function hasWorksheetSnapshotProvenance(provenance, worksheetKey) {
  if (!provenance || typeof provenance !== 'object') {
    return false;
  }
  return Object.values(provenance).some((entry) => entry?.source === worksheetKey);
}

/**
 * @param {string} clientId
 * @param {string} worksheetKey
 * @param {string} [sectionCategory]
 * @returns {string}
 */
export function worksheetHubHref(clientId, worksheetKey, sectionCategory = 'analyst-wizard') {
  return `/workspace/${clientId}/${sectionCategory}/sheets/${worksheetKey}`;
}

/**
 * @param {Object} params
 * @param {Record<string, unknown>} params.catalogEntry
 * @param {string} params.clientId
 * @param {{ id?: string, created_at?: string, updated_at?: string }|null} [params.latestRun]
 * @param {boolean} [params.draftRun]
 * @param {Record<string, { source?: string, at?: string }>} [params.provenance]
 * @returns {WorksheetHubStatusEntry}
 */
export function buildWorksheetHubStatusEntry({
  catalogEntry,
  clientId,
  latestRun = null,
  draftRun = false,
  provenance = {},
}) {
  const worksheetKey = catalogEntry.key;
  const integrationStatus = /** @type {IntegrationStatus} */ (catalogEntry.integrationStatus || 'planned');
  const status = resolveWorksheetStatus({
    integrationStatus,
    hasLatestRun: Boolean(latestRun?.id),
    hasDraftRun: draftRun,
    hasSnapshotProvenance: hasWorksheetSnapshotProvenance(provenance, worksheetKey),
  });

  const isNavigable = integrationStatus !== 'planned' && status !== 'planned';
  const sectionCategory = typeof catalogEntry.category === 'string' ? catalogEntry.category : 'analyst-wizard';
  const href = isNavigable ? worksheetHubHref(clientId, worksheetKey, sectionCategory) : null;

  /** @type {WorksheetHubStatusEntry} */
  const entry = {
    worksheetKey,
    sheetName: String(catalogEntry.sheetName || worksheetKey),
    hubCategory: /** @type {HubCategory} */ (catalogEntry.hubCategory || 'financial-analysis'),
    integrationStatus,
    status,
    lastUpdatedAt: latestRun?.updated_at || latestRun?.created_at || null,
    lastRunId: latestRun?.id || null,
    href,
  };

  if (typeof catalogEntry.description === 'string') {
    entry.description = catalogEntry.description;
  }
  if (typeof catalogEntry.coreRank === 'number') {
    entry.coreRank = catalogEntry.coreRank;
  }

  return entry;
}

/**
 * @param {WorksheetHubLifecycleStatus} status
 * @returns {boolean}
 */
export function isWorksheetHubNavigable(status, integrationStatus) {
  return integrationStatus !== 'planned' && status !== 'planned';
}

/**
 * @typedef {Object} HubStatusSummary
 * @property {number} coreComplete
 * @property {number} coreTotal
 * @property {number} integratedCount
 * @property {number} [categoryCount]
 * @property {string|null} lastActivityAt
 */

/**
 * @typedef {Object} HubStatusResponse
 * @property {boolean} ok
 * @property {string} clientId
 * @property {WorksheetHubStatusEntry[]} items
 * @property {HubStatusSummary} summary
 */
