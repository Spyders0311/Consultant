import { formatRunTimestamp } from '@/lib/format';
import { fetchLatestRun, isFiniteNumber, pickLatestYearRow, round1 } from './prefill-helpers';

async function pullFromLinkedSheets({ clientId, applyPrefill }) {
  const [plRun, bsRun] = await Promise.all([
    fetchLatestRun('/api/worksheets/pl-comparisons/runs', clientId, 'P&L Comparisons'),
    fetchLatestRun('/api/worksheets/balance-sheet-comparisons/runs', clientId, 'Balance Sheet Comparisons'),
  ]);

  const latestPlYear = pickLatestYearRow(plRun?.inputs?.years);
  const latestBsYear = pickLatestYearRow(bsRun?.inputs?.years);

  if (plRun && bsRun && latestPlYear && latestBsYear) {
    const patch = {};
    const missingFields = [];

    const revenue = Number(latestPlYear.revenue);
    const cogs = Number(latestPlYear.cogs);
    const ar = Number(latestBsYear.ar);
    const inventory = Number(latestBsYear.inventory);
    const ap = Number(latestBsYear.ap);

    if (isFiniteNumber(revenue)) {
      patch.annualRevenue = revenue;
    } else {
      missingFields.push('Annual Revenue');
    }

    if (isFiniteNumber(cogs)) {
      patch.annualCogs = cogs;
    } else {
      missingFields.push('Annual COGS');
    }

    if (isFiniteNumber(revenue) && revenue > 0 && isFiniteNumber(ar)) {
      patch.daysSalesOutstanding = round1((ar / revenue) * 365);
    } else {
      missingFields.push('Days Sales Outstanding (requires Revenue + A/R)');
    }

    if (isFiniteNumber(cogs) && cogs > 0 && isFiniteNumber(inventory)) {
      patch.daysInventoryOnHand = round1((inventory / cogs) * 365);
    } else {
      missingFields.push('Days Inventory On Hand (requires COGS + Inventory)');
    }

    if (isFiniteNumber(cogs) && cogs > 0 && isFiniteNumber(ap)) {
      patch.daysPayablesOutstanding = round1((ap / cogs) * 365);
    } else {
      missingFields.push('Days Payables Outstanding (requires COGS + A/P)');
    }

    if (Object.keys(patch).length === 0) {
      throw new Error(`Could not map any Working Capital fields from linked sheets. Missing: ${missingFields.join(', ')}`);
    }

    applyPrefill(patch, 'P&L + Balance Sheet Comparisons');

    return {
      audit: `Prefilled from P&L Comparisons run ${formatRunTimestamp(plRun.created_at)} and Balance Sheet Comparisons run ${formatRunTimestamp(bsRun.created_at)}`,
      warning: missingFields.length > 0 ? `Some fields were not prefilled: ${missingFields.join(', ')}.` : null,
    };
  }

  const missingSources = [];
  if (!plRun || !latestPlYear) missingSources.push('P&L Comparisons');
  if (!bsRun || !latestBsYear) missingSources.push('Balance Sheet Comparisons');

  const breakevenRun = await fetchLatestRun('/api/worksheets/breakeven/runs', clientId, 'Breakeven');
  if (!breakevenRun) {
    throw new Error(
      `No linked P&L/Balance run pair found (${missingSources.join(' + ')} missing) and no Breakeven run available for fallback.`,
    );
  }

  const fallbackPatch = {};
  const fallbackMissing = [];
  const breakevenInputs = breakevenRun.inputs || {};

  if (isFiniteNumber(breakevenInputs.annualRevenue)) {
    fallbackPatch.annualRevenue = Number(breakevenInputs.annualRevenue);
  } else {
    fallbackMissing.push('Annual Revenue');
  }

  if (isFiniteNumber(breakevenInputs.cogsAmount)) {
    fallbackPatch.annualCogs = Number(breakevenInputs.cogsAmount);
  } else {
    fallbackMissing.push('Annual COGS');
  }

  if (Object.keys(fallbackPatch).length === 0) {
    throw new Error(
      `Fallback Breakeven run found (${formatRunTimestamp(breakevenRun.created_at)}) but Annual Revenue/COGS were unavailable.`,
    );
  }

  applyPrefill(fallbackPatch, 'Breakeven fallback');

  return {
    audit: `Prefilled via Breakeven fallback run ${formatRunTimestamp(breakevenRun.created_at)} because linked ${missingSources.join(' + ')} data was unavailable.`,
    warning: `Used Breakeven fallback: DSO, DIO, and DPO were not prefilled (they require Balance Sheet values).${
      fallbackMissing.length > 0 ? ` Also missing from Breakeven run: ${fallbackMissing.join(', ')}.` : ''
    }`,
  };
}

const config = {
  key: 'working-capital-analysis',
  kicker: 'Analyst Program',
  title: 'Working Capital Analysis',
  description:
    'Model cash tied up in receivables and inventory, offset by payables financing, then export to PDF.',
  source: null,
  api: {
    calculate: '/api/worksheets/working-capital/calculate',
    runs: '/api/worksheets/working-capital/runs',
  },
  pdf: { model: 'working-capital', filename: 'bms-working-capital-analysis-report.pdf' },
  submitLabel: 'Run Working Capital Analysis',
  fields: {
    annualRevenue: { label: 'Annual Revenue', type: 'number', min: 0, placeholder: 'e.g. 1250000' },
    annualCogs: { label: 'Annual COGS', type: 'number', min: 0, placeholder: 'e.g. 700000' },
    daysSalesOutstanding: { label: 'Days Sales Outstanding (DSO)', type: 'number', min: 0, placeholder: 'e.g. 45' },
    daysInventoryOnHand: { label: 'Days Inventory On Hand (DIO)', type: 'number', min: 0, placeholder: 'e.g. 38' },
    daysPayablesOutstanding: { label: 'Days Payables Outstanding (DPO)', type: 'number', min: 0, placeholder: 'e.g. 30' },
  },
  steps: [
    {
      id: 'annual',
      title: 'Annual Inputs',
      hint: 'Set annual revenue and COGS.',
      fieldNames: ['annualRevenue', 'annualCogs'],
      validate: (form, { num }) => num(form.annualRevenue) >= 0 && num(form.annualCogs) >= 0,
    },
    {
      id: 'days',
      title: 'Cycle Days',
      hint: 'Set DSO, DIO, and DPO assumptions.',
      fieldNames: ['daysSalesOutstanding', 'daysInventoryOnHand', 'daysPayablesOutstanding'],
      validate: (form, { num }) =>
        num(form.daysSalesOutstanding) >= 0 &&
        num(form.daysInventoryOnHand) >= 0 &&
        num(form.daysPayablesOutstanding) >= 0,
    },
    {
      id: 'review',
      title: 'Review & Run',
      hint: 'Confirm assumptions and run calculation.',
      review: true,
    },
  ],
  review: (form, { currency, formatNumber }, { runId }) => [
    { label: 'Annual Revenue', value: currency(form.annualRevenue) },
    { label: 'Annual COGS', value: currency(form.annualCogs) },
    {
      label: 'Cash Conversion Cycle Inputs',
      value: `DSO ${formatNumber(form.daysSalesOutstanding)} + DIO ${formatNumber(form.daysInventoryOnHand)} - DPO ${formatNumber(form.daysPayablesOutstanding)}`,
    },
    { label: 'Current Run', value: runId ? `Loaded run ${runId.slice(0, 8)}...` : 'New run (unsaved)' },
  ],
  results: {
    kpis: [
      { key: 'arInvestment', label: 'A/R Investment', type: 'currency' },
      { key: 'inventoryInvestment', label: 'Inventory Investment', type: 'currency' },
      { key: 'apFinancing', label: 'A/P Financing', type: 'currency' },
      { key: 'netWorkingCapital', label: 'Net Working Capital', type: 'currency' },
      {
        key: 'cashConversionCycle',
        label: 'Cash Conversion Cycle',
        format: (value) =>
          value === null || value === undefined || Number.isNaN(Number(value))
            ? 'n/a'
            : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value))} days`,
      },
      { key: 'workingCapitalPercentOfRevenue', label: 'Working Capital % of Revenue', type: 'percent' },
    ],
    notesKey: 'warnings',
  },
  history: {},
  prefill: [
    {
      id: 'linked-sheets',
      label: 'Pull from P&L + Balance Sheet',
      execute: pullFromLinkedSheets,
    },
  ],
};

export default config;
