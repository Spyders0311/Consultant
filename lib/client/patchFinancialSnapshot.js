export async function patchFinancialSnapshot(clientId, source, fields) {
  if (!clientId || !fields || Object.keys(fields).length === 0) return;

  try {
    await fetch('/api/worksheets/financial-snapshot', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, source, fields }),
    });
  } catch {
    // Snapshot updates are best-effort and should not block worksheet saves.
  }
}
