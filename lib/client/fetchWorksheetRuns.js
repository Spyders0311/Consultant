import { WORKBOOK_PORT_KEYS } from '@/lib/workbookPortKeys';
import {
  getWorksheetRunRegistryEntry,
  isTableRegistryEntry,
} from '@/lib/worksheets/worksheetRunRegistry';

/**
 * @param {string} clientId
 * @param {string} worksheetKey
 * @param {{ limit?: number }} [options]
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function fetchWorksheetRuns(clientId, worksheetKey, { limit = 3 } = {}) {
  const entry = getWorksheetRunRegistryEntry(worksheetKey);

  if (isTableRegistryEntry(entry) && entry.runEndpoint) {
    const separator = entry.runEndpoint.includes('?') ? '&' : '?';
    const response = await fetch(
      `${entry.runEndpoint}${separator}client_id=${encodeURIComponent(clientId)}&limit=${limit}`,
      { cache: 'no-store' },
    );
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Unable to load worksheet runs.');
    }
    return data.runs || [];
  }

  if (WORKBOOK_PORT_KEYS.has(worksheetKey)) {
    const response = await fetch(
      `/api/worksheets/workbook-ports/runs?client_id=${encodeURIComponent(clientId)}&workbook_key=${encodeURIComponent(worksheetKey)}&limit=${limit}`,
      { cache: 'no-store' },
    );
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Unable to load workbook port runs.');
    }
    return data.runs || [];
  }

  return [];
}
