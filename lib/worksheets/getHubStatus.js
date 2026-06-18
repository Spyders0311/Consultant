import { headers } from 'next/headers';
import { buildCatalogHubStatus } from '@/lib/worksheets/hubStatusCatalog';

/**
 * Load hub-status for a client. Prefers the hub-status API when available.
 *
 * @param {string} clientId
 * @param {{ sectionCategory?: string }} [options]
 */
export async function getHubStatus(clientId, options = {}) {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    if (host) {
      const protocol = headersList.get('x-forwarded-proto') || 'http';
      const response = await fetch(`${protocol}://${host}/api/clients/${clientId}/hub-status`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.ok && Array.isArray(data.items)) {
          return data;
        }
      }
    }
  } catch {
    // Hub-status API not deployed yet — fall through to catalog builder.
  }

  return buildCatalogHubStatus(clientId, options);
}
