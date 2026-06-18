import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBalanceSheetRows,
  buildCfiReportingPeriod,
  buildFinancialRatiosPayload,
  buildIncomeStatementRows,
} from './cfiTableModel.js';

test('buildCfiReportingPeriod prefers linked statement years', () => {
  const period = buildCfiReportingPeriod({ year: 2024, revenue: 100 }, { year: 2023 });
  assert.equal(period.year, 2024);
  assert.match(period.label, /2024/);
  assert.match(period.sourceNote, /P&L/);
});

test('buildIncomeStatementRows computes gross profit from form values', () => {
  const rows = buildIncomeStatementRows({ annualRevenue: '1000000', annualCogs: '600000', annualFixedExpenses: '250000' });
  const grossProfit = rows.find((row) => row.key === 'grossProfit');
  assert.equal(grossProfit?.value, 400000);
});

test('buildBalanceSheetRows uses linked balance sheet lines when available', () => {
  const rows = buildBalanceSheetRows(
    { cash: 100000, ar: 200000, equity: 500000 },
    { totalAssets: 800000, workingCapital: 150000 },
    null,
  );
  assert.ok(rows.some((row) => row.key === 'cash' && row.value === 100000));
  assert.ok(rows.some((row) => row.key === 'totalAssets' && row.value === 800000));
});

test('buildFinancialRatiosPayload falls back to form values without linked runs', () => {
  const payload = buildFinancialRatiosPayload(
    { annualRevenue: '900000', annualCogs: '500000', annualFixedExpenses: '200000' },
    null,
    null,
    null,
    2025,
  );
  assert.equal(payload.plYear?.year, 2025);
  assert.equal(payload.plYear?.revenue, 900000);
});
