export const MISSING_VALUE = '—';

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return MISSING_VALUE;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

/**
 * @param {unknown} value - decimal (0.42) or whole percent (42)
 * @param {{ asDecimal?: boolean }} [options]
 * @returns {string}
 */
export function formatPercent(value, options = {}) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return MISSING_VALUE;
  }
  const numeric = Number(value);
  const pct = options.asDecimal ? numeric * 100 : numeric;
  return `${pct.toFixed(1)}%`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatRatio(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return MISSING_VALUE;
  }
  return Number(value).toFixed(2);
}

/**
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formatRelativeDate(iso) {
  if (!iso) return MISSING_VALUE;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return MISSING_VALUE;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
