import { isFiniteNumber } from '@/lib/format';

/** Newest year row from a 4-year comparison grid (P&L / balance sheet runs). */
export function pickLatestYearRow(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  return rows.reduce((latest, row) => {
    if (!latest) return row;
    const rowYear = Number(row?.year);
    const latestYear = Number(latest?.year);
    if (Number.isFinite(rowYear) && Number.isFinite(latestYear)) {
      return rowYear >= latestYear ? row : latest;
    }
    return row;
  }, null);
}

export function round1(value) {
  return Math.round(Number(value) * 10) / 10;
}

/** Latest saved run from a worksheet runs endpoint, or null when none exist. */
export async function fetchLatestRun(endpoint, clientId, sourceLabel) {
  const response = await fetch(`${endpoint}?client_id=${encodeURIComponent(clientId)}&limit=1`, {
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Unable to load ${sourceLabel} runs.`);
  }
  return data.runs?.[0] || null;
}

export { isFiniteNumber };
