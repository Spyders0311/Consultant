import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import { HUB_CATEGORIES } from '@/lib/worksheets/catalogMetadata';
import { buildWorksheetHubStatusEntry } from '@/lib/worksheets/hubStatus';

/**
 * Build hub-status payload from catalog metadata (fallback until hub-status API ships).
 *
 * @param {string} clientId
 * @param {{ sectionCategory?: string }} [options]
 * @returns {import('@/lib/worksheets/hubStatus').HubStatusResponse}
 */
export function buildCatalogHubStatus(clientId, { sectionCategory = 'analyst-wizard' } = {}) {
  const catalogEntries = worksheetCatalog.filter((entry) => entry.category === sectionCategory);

  /** @type {import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[]} */
  const items = catalogEntries.map((catalogEntry) =>
    buildWorksheetHubStatusEntry({
      catalogEntry,
      clientId,
    }),
  );

  const coreItems = items.filter((entry) => typeof entry.coreRank === 'number');
  const integratedItems = items.filter((entry) => entry.integrationStatus !== 'planned');
  const lastActivityAt = items
    .map((entry) => entry.lastUpdatedAt)
    .filter(Boolean)
    .sort()
    .pop() || null;

  return {
    ok: true,
    clientId,
    items,
    summary: {
      coreComplete: coreItems.filter((entry) => entry.status === 'complete').length,
      coreTotal: coreItems.length,
      integratedCount: integratedItems.length,
      categoryCount: HUB_CATEGORIES.length,
      lastActivityAt,
    },
  };
}
