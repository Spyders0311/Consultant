/**
 * Shared parsing/formatting for worksheet wizards. Lifted verbatim from the
 * pre-overhaul wizard components so formatted output is unchanged.
 */

export function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseOptionalNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = typeof value === 'string' ? value.trim() : value;
  if (raw === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

export function currency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

export function percent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return `${Number(value).toFixed(1)}%`;
}

export function formatNumber(value, maximumFractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(Number(value));
}

export function formatValue(value, type) {
  if (type === 'currency') return currency(value);
  if (type === 'percent') return percent(value);
  if (type === 'number') return formatNumber(value);
  if (type === 'decimal') {
    if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return 'n/a';
    return Number(value).toFixed(2);
  }
  return value === null || value === undefined || value === '' ? 'n/a' : String(value);
}

export function formatRunTimestamp(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function getPath(source, path) {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce((value, key) => (value && typeof value === 'object' ? value[key] : undefined), source);
}
