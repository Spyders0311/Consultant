import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildExecutiveInsights,
  buildRecommendedActions,
  buildWorksheetGapReason,
} from './executiveAnalysisRules.js';

test('buildExecutiveInsights surfaces loss, decline, and liquidity flags', () => {
  const insights = buildExecutiveInsights({
    plTrend: [
      { year: '2022', revenue: 1000000, netIncome: 50000, grossMarginPct: 35 },
      { year: '2023', revenue: 900000, netIncome: -10000, grossMarginPct: 18 },
    ],
    bsLatest: { currentRatio: 0.8, year: 2023 },
    ratios: {},
    breakeven: { breakevenRevenue: 950000 },
    hubSummary: { coreComplete: 2, coreTotal: 7 },
    fiveYearSummary: { year5Revenue: 1200000 },
  });

  assert.ok(insights.some((item) => item.title.includes('net loss')));
  assert.ok(insights.some((item) => item.title.includes('Revenue declined')));
  assert.ok(insights.some((item) => item.title.includes('Current ratio')));
});

test('buildExecutiveInsights returns onboarding copy when no runs exist', () => {
  const insights = buildExecutiveInsights({
    plTrend: [],
    bsLatest: null,
    ratios: {},
    breakeven: null,
    hubSummary: { coreComplete: 0, coreTotal: 7 },
    fiveYearSummary: null,
    dataCoverage: { isEmpty: true },
  });

  assert.equal(insights.length, 1);
  assert.match(insights[0].title, /No financial runs/i);
});

test('buildRecommendedActions prioritizes incomplete core worksheets with gap copy', () => {
  const actions = buildRecommendedActions([
    {
      worksheetKey: 'basic-client-info',
      sheetName: 'BASIC CLIENT INFO',
      status: 'not_started',
      href: '/workspace/x/analyst-wizard/sheets/basic-client-info',
      coreRank: 1,
      integrationStatus: 'native',
    },
    {
      worksheetKey: 'p-l-comparisons',
      sheetName: 'P&L COMPARISONS',
      status: 'complete',
      href: '/workspace/x/analyst-wizard/sheets/p-l-comparisons',
      coreRank: 3,
      integrationStatus: 'native',
    },
    {
      worksheetKey: 'balance-sht-comparisons',
      sheetName: 'BALANCE SHEET COMPARISONS',
      status: 'in_progress',
      href: '/workspace/x/analyst-wizard/sheets/balance-sht-comparisons',
      coreRank: 4,
      integrationStatus: 'native',
      progressPercent: 40,
    },
  ]);

  assert.equal(actions.length, 2);
  assert.equal(actions[0].worksheetKey, 'basic-client-info');
  assert.match(actions[0].reason, /client profile/i);
  assert.equal(actions[0].unlocks, 'company profile on reports');
  assert.match(actions[1].reason, /40% complete/i);
});

test('buildWorksheetGapReason falls back to hub description', () => {
  const reason = buildWorksheetGapReason({
    worksheetKey: 'unknown-sheet',
    status: 'not_started',
    description: 'Custom worksheet description',
  });
  assert.match(reason, /Custom worksheet description/i);
});
