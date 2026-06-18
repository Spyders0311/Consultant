import { rollupPLLineItems } from '@/lib/worksheets/plRollup';
import { normalizePLYearRow } from '@/lib/worksheets/worksheetPullHelpers';

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildFeederLineItem(config, annualTotal, description = '') {
  return {
    category: config.plMapCategory,
    description: description || config.title,
    amount: parseNumber(annualTotal),
  };
}

export function mergeLineItemIntoPLYear(yearRow, lineItem) {
  const existing = Array.isArray(yearRow?.lineItems) ? [...yearRow.lineItems] : [];
  const category = String(lineItem.category || '').toLowerCase();
  const filtered = existing.filter((line) => String(line.category || '').toLowerCase() !== category);
  filtered.push({
    category: lineItem.category,
    description: lineItem.description || '',
    amount: parseNumber(lineItem.amount),
  });

  const rolled = rollupPLLineItems(filtered);
  return {
    ...yearRow,
    lineItems: filtered,
    revenue: rolled.revenue || parseNumber(yearRow.revenue),
    cogs: rolled.cogs || parseNumber(yearRow.cogs),
    operatingExpenses: rolled.operatingExpenses || parseNumber(yearRow.operatingExpenses),
    otherExpenses: rolled.otherExpenses || parseNumber(yearRow.otherExpenses),
  };
}

export async function loadLatestPLYears(clientId) {
  const response = await fetch(`/api/worksheets/pl-comparisons/runs?client_id=${encodeURIComponent(clientId)}&limit=1`, {
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to load P&L runs.');

  const run = data.runs?.[0];
  const years = Array.isArray(run?.inputs?.years) ? run.inputs.years : [];
  if (years.length === 0) {
    return {
      years: Array.from({ length: 4 }, (_, index) => ({
        year: '',
        revenue: '',
        cogs: '',
        operatingExpenses: '',
        otherExpenses: '',
        lineItems: [],
      })),
      runId: null,
    };
  }

  return {
    years: years.map((row) => ({
      year: row.year ?? '',
      revenue: row.revenue ?? '',
      cogs: row.cogs ?? '',
      operatingExpenses: row.operatingExpenses ?? '',
      otherExpenses: row.otherExpenses ?? '',
      lineItems: Array.isArray(row.lineItems) ? row.lineItems : [],
    })),
    runId: run?.id || null,
  };
}

export async function pushFeederLineToPLComparisons(clientId, lineItem, yearIndex = 3) {
  const { years } = await loadLatestPLYears(clientId);
  const targetIndex = Math.min(Math.max(yearIndex, 0), years.length - 1);
  const nextYears = years.map((row, idx) =>
    idx === targetIndex ? mergeLineItemIntoPLYear(row, lineItem) : normalizePLYearRow(row) || row,
  );

  const payload = {
    years: nextYears.map((row) => ({
      year: parseNumber(row.year),
      revenue: parseNumber(row.revenue),
      cogs: parseNumber(row.cogs),
      operatingExpenses: parseNumber(row.operatingExpenses),
      otherExpenses: parseNumber(row.otherExpenses),
      lineItems: (row.lineItems || []).map((line) => ({
        category: line.category,
        description: line.description || '',
        amount: parseNumber(line.amount),
      })),
    })),
  };

  const calculationResponse = await fetch('/api/worksheets/pl-comparisons/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const calculationData = await calculationResponse.json();
  if (!calculationResponse.ok || !calculationData.ok) {
    throw new Error(calculationData.error || 'P&L calculation failed after feeder push.');
  }

  const runResponse = await fetch('/api/worksheets/pl-comparisons/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
  });
  const runData = await runResponse.json();
  if (!runResponse.ok || !runData.ok) {
    throw new Error(runData.error || 'Failed to save P&L run after feeder push.');
  }

  return { payload, result: calculationData.result, runId: runData.id };
}

export async function pushTwelveMonthPLToAnnual(clientId, twelveMonthPayload) {
  const annual = (twelveMonthPayload.months || []).reduce(
    (acc, month) => ({
      revenue: acc.revenue + parseNumber(month.revenue),
      cogs: acc.cogs + parseNumber(month.cogs),
      operatingExpenses: acc.operatingExpenses + parseNumber(month.operatingExpenses),
      otherExpenses: acc.otherExpenses + parseNumber(month.otherExpenses),
    }),
    { revenue: 0, cogs: 0, operatingExpenses: 0, otherExpenses: 0 },
  );

  const lineItems = [];
  if (annual.revenue > 0) lineItems.push({ category: 'revenue', description: '12-month P&L rollup', amount: annual.revenue });
  if (annual.cogs > 0) lineItems.push({ category: 'cogs', description: '12-month P&L rollup', amount: annual.cogs });
  if (annual.operatingExpenses > 0) {
    lineItems.push({ category: 'opex', description: '12-month P&L rollup', amount: annual.operatingExpenses });
  }
  if (annual.otherExpenses > 0) {
    lineItems.push({ category: 'other', description: '12-month P&L rollup', amount: annual.otherExpenses });
  }

  const { years } = await loadLatestPLYears(clientId);
  const yearIndex = years.length - 1;
  const targetYear = parseNumber(twelveMonthPayload.year) || new Date().getFullYear();
  const merged = mergeLineItemIntoPLYear(
    { ...years[yearIndex], year: targetYear },
    lineItems[0] || { category: 'revenue', amount: 0 },
  );

  let nextYear = merged;
  for (const item of lineItems.slice(1)) {
    nextYear = mergeLineItemIntoPLYear(nextYear, item);
  }

  const nextYears = years.map((row, idx) => (idx === yearIndex ? nextYear : row));
  const payload = {
    years: nextYears.map((row) => ({
      year: parseNumber(row.year),
      revenue: parseNumber(row.revenue),
      cogs: parseNumber(row.cogs),
      operatingExpenses: parseNumber(row.operatingExpenses),
      otherExpenses: parseNumber(row.otherExpenses),
      lineItems: row.lineItems || [],
    })),
  };

  const calculationResponse = await fetch('/api/worksheets/pl-comparisons/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const calculationData = await calculationResponse.json();
  if (!calculationResponse.ok || !calculationData.ok) {
    throw new Error(calculationData.error || 'P&L calculation failed.');
  }

  await fetch('/api/worksheets/pl-comparisons/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
  });

  return { payload, result: calculationData.result };
}
