import { rollupPLLineItems } from '@/lib/worksheets/plRollup';

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

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

export function normalizePLYearRow(row) {
  if (!row) return null;

  if (Array.isArray(row.lineItems) && row.lineItems.length > 0) {
    const rolled = rollupPLLineItems(row.lineItems);
    return {
      year: row.year,
      revenue: rolled.revenue || Number(row.revenue) || 0,
      cogs: rolled.cogs || Number(row.cogs) || 0,
      operatingExpenses: rolled.operatingExpenses || Number(row.operatingExpenses) || 0,
      otherExpenses: rolled.otherExpenses || Number(row.otherExpenses) || 0,
      laborAmount: rolled.laborAmount,
      indirectCostsAmount: rolled.indirectCostsAmount,
      generalAdministrativeCostsAmount: rolled.generalAdministrativeCostsAmount,
      lineItems: row.lineItems,
    };
  }

  return {
    year: row.year,
    revenue: Number(row.revenue) || 0,
    cogs: Number(row.cogs) || 0,
    operatingExpenses: Number(row.operatingExpenses) || 0,
    otherExpenses: Number(row.otherExpenses) || 0,
    laborAmount: Number(row.laborAmount) || 0,
    indirectCostsAmount: Number(row.indirectCostsAmount) || 0,
    generalAdministrativeCostsAmount: Number(row.generalAdministrativeCostsAmount) || 0,
    lineItems: row.lineItems || [],
  };
}

export function mapPLYearToBreakeven(plYear) {
  const row = normalizePLYearRow(plYear);
  if (!row) return { patch: {}, missingFields: ['P&L year'] };

  const patch = {};
  const missingFields = [];

  if (isFiniteNumber(row.revenue)) patch.annualRevenue = Number(row.revenue);
  else missingFields.push('Annual Revenue');

  if (isFiniteNumber(row.cogs)) patch.cogsAmount = Number(row.cogs);
  else missingFields.push('COGS Amount');

  const fixedFromBuckets = Number(row.operatingExpenses) + Number(row.otherExpenses);
  const fixedFromLayers =
    Number(row.laborAmount) + Number(row.indirectCostsAmount) + Number(row.generalAdministrativeCostsAmount);
  const fixedExpenses = fixedFromBuckets > 0 ? fixedFromBuckets : fixedFromLayers;

  if (fixedExpenses > 0 || fixedFromBuckets === 0) {
    patch.fixedExpensesAmount = fixedExpenses;
  } else {
    missingFields.push('Fixed Expenses');
  }

  if (row.laborAmount > 0) patch.laborAmount = row.laborAmount;
  if (row.indirectCostsAmount > 0) patch.indirectCostsAmount = row.indirectCostsAmount;
  if (row.generalAdministrativeCostsAmount > 0) {
    patch.generalAdministrativeCostsAmount = row.generalAdministrativeCostsAmount;
  }

  return { patch, missingFields, row };
}

export async function fetchLatestRun(clientId, endpoint, extraQuery = '') {
  const separator = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(
    `${endpoint}${separator}client_id=${encodeURIComponent(clientId)}&limit=1${extraQuery}`,
    { cache: 'no-store' },
  );
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Unable to load worksheet runs.');
  }
  return data.runs?.[0] || null;
}

export async function pullBreakevenFromAllSources(clientId) {
  const [
    plRun,
    miscDirectRun,
    miscIndirectRun,
    payrollRun,
    laborRun,
    materialRun,
    opexRun,
  ] = await Promise.all([
    fetchLatestRun(clientId, '/api/worksheets/pl-comparisons/runs'),
    fetchLatestRun(clientId, '/api/worksheets/misc-direct-expenses/runs'),
    fetchLatestRun(clientId, '/api/worksheets/misc-indirect-expenses/runs'),
    fetchLatestRun(clientId, '/api/worksheets/twelve-month-analysis/runs', '&analysis_type=payroll'),
    fetchLatestRun(clientId, '/api/worksheets/twelve-month-analysis/runs', '&analysis_type=direct_labor'),
    fetchLatestRun(clientId, '/api/worksheets/twelve-month-analysis/runs', '&analysis_type=material'),
    fetchLatestRun(clientId, '/api/worksheets/twelve-month-analysis/runs', '&analysis_type=operating_exp'),
  ]);

  const latestPlYear = normalizePLYearRow(pickLatestYearRow(plRun?.inputs?.years));
  const { patch: plPatch, missingFields } = mapPLYearToBreakeven(latestPlYear);
  const patch = { ...plPatch };
  const sources = [];

  if (plRun) sources.push('P&L Comparisons');

  const miscDirectTotal = Number(miscDirectRun?.outputs?.annualTotal || 0);
  if (miscDirectTotal > 0) {
    patch.laborAmount = (patch.laborAmount || 0) + miscDirectTotal;
    sources.push('Misc Direct Expenses');
  }

  const miscIndirectTotal = Number(miscIndirectRun?.outputs?.annualTotal || 0);
  if (miscIndirectTotal > 0) {
    patch.indirectCostsAmount = (patch.indirectCostsAmount || 0) + miscIndirectTotal * 0.6;
    patch.generalAdministrativeCostsAmount =
      (patch.generalAdministrativeCostsAmount || 0) + miscIndirectTotal * 0.4;
    sources.push('Misc Indirect Expenses');
  }

  const payrollTotal = Number(payrollRun?.outputs?.annualTotal || 0);
  const directLaborTotal = Number(laborRun?.outputs?.annualTotal || 0);
  const materialTotal = Number(materialRun?.outputs?.annualTotal || 0);
  const opexTotal = Number(opexRun?.outputs?.annualTotal || 0);

  if (payrollTotal > 0) {
    patch.laborAmount = (patch.laborAmount || 0) + payrollTotal;
    sources.push('12-Month Payroll');
  }
  if (directLaborTotal > 0) {
    patch.laborAmount = (patch.laborAmount || 0) + directLaborTotal;
    sources.push('12-Month Direct Labor');
  }
  if (materialTotal > 0) {
    patch.cogsAmount = (patch.cogsAmount || 0) + materialTotal;
    sources.push('12-Month Material');
  }
  if (opexTotal > 0) {
    patch.fixedExpensesAmount = (patch.fixedExpensesAmount || 0) + opexTotal;
    sources.push('12-Month Operating Exp');
  }

  return {
    patch,
    missingFields,
    sources: [...new Set(sources)],
    auditRuns: { plRun, miscDirectRun, miscIndirectRun, payrollRun, laborRun, materialRun, opexRun },
  };
}

export function mapCFIFromSources({ plYear, bsYear, beInputs }) {
  const normalized = normalizePLYearRow(plYear);
  const patch = {};

  if (normalized) {
    patch.annualRevenue = normalized.revenue;
    patch.annualCogs = normalized.cogs;
    patch.annualFixedExpenses = normalized.operatingExpenses + normalized.otherExpenses;
    patch.laborAmount = normalized.laborAmount || beInputs?.laborAmount;
    patch.indirectCostsAmount = normalized.indirectCostsAmount || beInputs?.indirectCostsAmount;
    patch.generalAdministrativeCostsAmount =
      normalized.generalAdministrativeCostsAmount || beInputs?.generalAdministrativeCostsAmount;
  }

  if (bsYear && normalized?.revenue > 0) {
    if (bsYear.ar != null) {
      patch.daysSalesOutstanding = Math.round((Number(bsYear.ar) / Number(normalized.revenue)) * 365);
    }
    if (normalized.cogs > 0 && bsYear.inventory != null) {
      patch.daysInventoryOnHand = Math.round((Number(bsYear.inventory) / Number(normalized.cogs)) * 365);
    }
    if (normalized.cogs > 0 && bsYear.ap != null) {
      patch.daysPayablesOutstanding = Math.round((Number(bsYear.ap) / Number(normalized.cogs)) * 365);
    }
  }

  if (beInputs?.profitAmount != null) patch.profitAmount = beInputs.profitAmount;
  if (beInputs?.workDaysPerYear != null) patch.workDaysPerYear = beInputs.workDaysPerYear;
  if (beInputs?.workHoursPerDay != null) patch.workHoursPerDay = beInputs.workHoursPerDay;

  return patch;
}
