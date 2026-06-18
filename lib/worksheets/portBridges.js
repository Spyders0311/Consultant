/** Map workbook port outputs → analyst worksheet form patches. */
export const PORT_BRIDGE_TARGETS = {
  'f-1200-ar-turns': {
    label: 'Working Capital Analysis',
    worksheetKey: 'working-capital-analysis',
    mapFromRun(run) {
      const summary = run?.outputs?.summary || run?.outputs || {};
      const days = summary.avgCollectionPeriodDays;
      if (!Number.isFinite(Number(days))) return null;
      return { daysSalesOutstanding: Number(days) };
    },
  },
  'inventory-turn-calculation': {
    label: 'Working Capital Analysis',
    worksheetKey: 'working-capital-analysis',
    mapFromRun(run) {
      const summary = run?.outputs?.summary || run?.outputs || {};
      const days = summary.averageDaysHeld;
      if (!Number.isFinite(Number(days))) return null;
      return { daysInventoryOnHand: Number(days) };
    },
  },
  'f-200a-labor-burden': {
    label: 'Breakeven Analysis',
    worksheetKey: 'breakeven-analysis',
    mapFromRun(run) {
      const summary = run?.outputs?.summary || run?.outputs || {};
      const total = summary.totalFullyBurdenedAnnual || summary.fullyBurdenedAnnual;
      if (!Number.isFinite(Number(total))) return null;
      return { laborAmount: Number(total) };
    },
  },
  'f-200b-fully-burdened-labor': {
    label: 'Breakeven Analysis',
    worksheetKey: 'breakeven-analysis',
    mapFromRun(run) {
      const summary = run?.outputs?.summary || run?.outputs || {};
      const total = summary.fullyBurdenedAnnual;
      if (!Number.isFinite(Number(total))) return null;
      return { laborAmount: Number(total) };
    },
  },
  'f-1000-pl': {
    label: 'P&L Comparisons',
    worksheetKey: 'p-l-comparisons',
    mapFromRun(run) {
      const lines = run?.inputs?.plLines;
      if (!Array.isArray(lines) || lines.length === 0) return null;
      return { plLines: lines };
    },
  },
  'f-100b-breakeven-sample': {
    label: 'Breakeven Analysis',
    worksheetKey: 'breakeven-analysis',
    mapFromRun(run) {
      const inputs = run?.inputs || {};
      const patch = {};
      if (inputs.annualRevenue != null) patch.annualRevenue = inputs.annualRevenue;
      if (inputs.cogsAmount != null) patch.cogsAmount = inputs.cogsAmount;
      if (inputs.fixedExpensesAmount != null) patch.fixedExpensesAmount = inputs.fixedExpensesAmount;
      return Object.keys(patch).length ? patch : null;
    },
  },
  'f-100d-break-even-tool': {
    label: 'Breakeven Analysis',
    worksheetKey: 'breakeven-analysis',
    mapFromRun(run) {
      const inputs = run?.inputs || {};
      const patch = {};
      if (inputs.annualRevenue != null) patch.annualRevenue = inputs.annualRevenue;
      if (inputs.variableCostsAmount != null) patch.cogsAmount = inputs.variableCostsAmount;
      if (inputs.fixedCostsAmount != null) patch.fixedExpensesAmount = inputs.fixedCostsAmount;
      return Object.keys(patch).length ? patch : null;
    },
  },
};

export const ANALYST_PORT_BRIDGE_SOURCES = {
  'breakeven-analysis': ['f-200a-labor-burden', 'f-200b-fully-burdened-labor', 'f-100b-breakeven-sample', 'f-100d-break-even-tool'],
  'working-capital-analysis': ['f-1200-ar-turns', 'inventory-turn-calculation'],
  'p-l-comparisons': ['f-1000-pl'],
};

export function getPortBridgesForWorksheet(worksheetKey) {
  const sourceKeys = ANALYST_PORT_BRIDGE_SOURCES[worksheetKey] || [];
  return sourceKeys
    .map((portKey) => ({ portKey, ...PORT_BRIDGE_TARGETS[portKey] }))
    .filter((entry) => entry.mapFromRun);
}
