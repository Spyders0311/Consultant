import assert from 'node:assert/strict';
import test from 'node:test';
import { buildExecutiveAnalysisPdf } from '../server/pdf.js';

const partialReport = {
  companyName: 'Acme Manufacturing',
  generatedAt: '2026-06-17T12:00:00.000Z',
  kpis: [
    { label: 'Annual Revenue', value: '$1,200,000' },
    { label: 'Net Income', value: '—' },
    { label: 'Gross Margin', value: '—' },
    { label: 'Current Ratio', value: '—' },
    { label: 'Net Working Capital', value: '—' },
  ],
  insights: [
    {
      severity: 'info',
      title: 'No financial runs saved yet',
      detail: 'Start with P&L Comparisons and Balance Sheet Comparisons.',
    },
  ],
  recommendedActions: [
    {
      coreRank: 3,
      sheetName: 'P&L COMPARISONS',
      reason: 'Save P&L Comparisons to populate revenue KPIs.',
    },
  ],
  coreProgress: { complete: 1, total: 7, percent: 14 },
  plTrend: [{ year: '2024', revenue: 1200000, netIncome: 45000, grossMarginPct: 28 }],
};

test('buildExecutiveAnalysisPdf returns a PDF buffer for partial data', async () => {
  const buffer = await buildExecutiveAnalysisPdf({
    report: partialReport,
    consultant: { name: 'Test Consultant', email: 'test@example.com' },
    clientName: partialReport.companyName,
  });

  assert.ok(buffer instanceof Uint8Array || Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 500);
  assert.equal(String.fromCharCode(...buffer.subarray(0, 4)), '%PDF');
});

test('buildExecutiveAnalysisPdf handles empty plTrend', async () => {
  const buffer = await buildExecutiveAnalysisPdf({
    report: {
      ...partialReport,
      plTrend: [],
      insights: [],
      recommendedActions: [],
      kpis: [{ label: 'Annual Revenue', value: '—' }],
    },
    consultant: { name: 'Test Consultant' },
    clientName: 'Empty Client',
  });

  assert.equal(String.fromCharCode(...buffer.subarray(0, 4)), '%PDF');
});
