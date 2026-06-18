import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDataCoverage,
  buildExecutiveKpis,
  buildOpexBreakdown,
  buildPanelEmptyStates,
  buildPlTrend,
  validateExecutiveAnalysisPdfPayload,
  yearsFromRunOutputs,
} from './executiveAnalysisModel.js';

test('yearsFromRunOutputs sorts years and ignores invalid rows', () => {
  const years = yearsFromRunOutputs({
    years: [{ year: 2024, revenue: 100 }, { year: 2022, revenue: 80 }, { year: null }],
  });
  assert.deepEqual(years.map((row) => row.year), [2022, 2024]);
});

test('buildExecutiveKpis shows em dash when P&L and BS are missing', () => {
  const kpis = buildExecutiveKpis({
    latestPl: null,
    bsLatest: null,
    snapshot: {},
    workingCapitalRun: null,
    cfiRun: null,
  });
  assert.equal(kpis.find((kpi) => kpi.label === 'Annual Revenue')?.value, '—');
  assert.equal(kpis.find((kpi) => kpi.label === 'Current Ratio')?.value, '—');
});

test('buildExecutiveKpis uses latest P&L year and BS current ratio', () => {
  const kpis = buildExecutiveKpis({
    latestPl: { year: '2024', revenue: 1000000, netIncome: 50000, grossMarginPct: 35 },
    bsLatest: { year: 2024, currentRatio: 1.42 },
    snapshot: {},
    workingCapitalRun: null,
    cfiRun: { outputs: { netWorkingCapital: 120000 } },
  });
  assert.match(kpis.find((kpi) => kpi.label === 'Annual Revenue')?.value || '', /\$1,000,000/);
  assert.equal(kpis.find((kpi) => kpi.label === 'Current Ratio')?.value, '1.42');
});

test('buildPlTrend handles a single saved P&L year', () => {
  const trend = buildPlTrend([{ year: 2023, revenue: 500000, netIncome: 25000, grossMarginPct: 30 }]);
  assert.equal(trend.length, 1);
  assert.equal(trend[0].year, '2023');
});

test('buildOpexBreakdown returns empty array without P&L input', () => {
  assert.deepEqual(buildOpexBreakdown(null), []);
});

test('buildDataCoverage flags sparse state when BS is missing', () => {
  const coverage = buildDataCoverage({
    plRun: { id: 'pl' },
    bsRun: null,
    cfiRun: null,
    fiveYearRun: null,
    workingCapitalRun: null,
    plTrend: buildPlTrend([{ year: 2024, revenue: 1, netIncome: 1 }]),
    ratioCards: [],
    opexBreakdown: [],
    coreProgress: { complete: 1, total: 7 },
  });
  assert.equal(coverage.hasPlRun, true);
  assert.equal(coverage.hasBsRun, false);
  assert.equal(coverage.isSparse, true);
  assert.ok(coverage.missingBlocks.includes('Balance Sheet Comparisons'));
});

test('buildPanelEmptyStates links to balance sheet when ratios need BS', () => {
  const coverage = buildDataCoverage({
    plRun: { id: 'pl' },
    bsRun: null,
    cfiRun: null,
    fiveYearRun: null,
    workingCapitalRun: null,
    plTrend: [{ year: '2024' }],
    ratioCards: [],
    opexBreakdown: [],
    coreProgress: { complete: 1, total: 7 },
  });
  const empty = buildPanelEmptyStates(coverage, 'client-1');
  assert.match(empty.ratios?.actionHref || '', /balance-sht-comparisons/);
  assert.match(empty.ratios?.message || '', /Balance sheet data is missing/i);
});

test('validateExecutiveAnalysisPdfPayload accepts minimal partial report', () => {
  assert.equal(
    validateExecutiveAnalysisPdfPayload({
      companyName: 'Acme Co',
      kpis: [{ label: 'Annual Revenue', value: '—' }],
      coreProgress: { complete: 0, total: 7, percent: 0 },
    }),
    true,
  );
});

test('validateExecutiveAnalysisPdfPayload rejects missing company name', () => {
  assert.throws(() => validateExecutiveAnalysisPdfPayload({ kpis: [], coreProgress: { complete: 0, total: 7 } }));
});
