export async function fetchFinancialSnapshot(clientId) {
  if (!clientId) return { snapshot: {}, provenance: {}, updated_at: null };

  const response = await fetch(`/api/worksheets/financial-snapshot?client_id=${encodeURIComponent(clientId)}`, {
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Unable to load financial snapshot.');
  }

  return {
    snapshot: data.snapshot || {},
    provenance: data.provenance || {},
    updated_at: data.updated_at || null,
  };
}
