import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildWorksheetHubStatusEntry, resolveWorksheetStatus } from '../worksheets/hubStatus.js';
import {
  buildHubStatusItem,
  buildHubStatusSummary,
  pickLatestRunRow,
  resolveDerivedRunSignals,
} from '../worksheets/hubStatusAggregation.js';
import { getRunSelectForTable } from '../worksheets/worksheetRunRegistry.js';

test('pickLatestRunRow prefers the most recent updated_at', () => {
  const latest = pickLatestRunRow([
    { id: 'a', created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z' },
    { id: 'b', created_at: '2026-01-03T00:00:00.000Z', updated_at: '2026-01-03T00:00:00.000Z' },
  ]);

  assert.equal(latest?.id, 'b');
});

test('getRunSelectForTable only requests analysis_type from typed run tables', () => {
  assert.equal(
    getRunSelectForTable('client_breakeven_runs'),
    'id, created_at, updated_at',
  );
  assert.equal(
    getRunSelectForTable('client_twelve_month_analysis_runs'),
    'id, created_at, updated_at, analysis_type',
  );
});

test('resolveDerivedRunSignals marks complete only when all sources exist', () => {
  const runs = new Map([
    ['p-l-comparisons', { id: 'pl-1', created_at: '2026-01-01T00:00:00.000Z' }],
    ['balance-sht-comparisons', null],
  ]);

  const partial = resolveDerivedRunSignals(runs, ['p-l-comparisons', 'balance-sht-comparisons']);
  assert.equal(partial.allSourcesPresent, false);
  assert.equal(partial.anySourcePresent, true);

  runs.set('balance-sht-comparisons', { id: 'bs-1', created_at: '2026-01-02T00:00:00.000Z' });
  const complete = resolveDerivedRunSignals(runs, ['p-l-comparisons', 'balance-sht-comparisons']);
  assert.equal(complete.allSourcesPresent, true);
  assert.equal(complete.latestRun?.id, 'bs-1');
});

test('buildHubStatusSummary counts core completion and integrated worksheets', () => {
  const summary = buildHubStatusSummary(
    [
      {
        worksheetKey: 'basic-client-info',
        coreRank: 1,
        integrationStatus: 'native',
        status: 'complete',
        lastUpdatedAt: '2026-02-01T00:00:00.000Z',
      },
      {
        worksheetKey: 'breakeven-analysis',
        coreRank: 5,
        integrationStatus: 'native',
        status: 'not_started',
        lastUpdatedAt: null,
      },
      {
        worksheetKey: 'intro',
        integrationStatus: 'planned',
        status: 'planned',
        lastUpdatedAt: null,
      },
    ],
    '2026-01-15T00:00:00.000Z',
  );

  assert.equal(summary.coreComplete, 1);
  assert.equal(summary.coreTotal, 2);
  assert.equal(summary.integratedCount, 2);
  assert.equal(summary.lastActivityAt, '2026-02-01T00:00:00.000Z');
});

test('buildHubStatusItem applies v1 status rules from runs and provenance', () => {
  const catalogEntry = {
    key: 'breakeven-analysis',
    sheetName: 'BREAKEVEN ANALYSIS',
    category: 'analyst-wizard',
    hubCategory: 'financial-analysis',
    integrationStatus: 'native',
    description: 'Breakeven targets.',
    coreRank: 5,
  };

  const withRun = buildHubStatusItem(
    catalogEntry,
    'client-1',
    new Map([
      [
        'breakeven-analysis',
        { id: 'run-1', created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z' },
      ],
    ]),
    {},
  );

  assert.equal(withRun.status, 'complete');
  assert.equal(withRun.lastRunId, 'run-1');
  assert.equal(withRun.progressPercent, null);

  const inProgress = buildHubStatusItem(catalogEntry, 'client-1', new Map(), {
    annualRevenue: { source: 'breakeven-analysis', at: '2026-01-01T00:00:00.000Z' },
  });

  assert.equal(inProgress.status, 'in_progress');
});

test('buildHubStatusItem exposes progressPercent from step drafts', () => {
  const catalogEntry = {
    key: 'breakeven-analysis',
    sheetName: 'BREAKEVEN ANALYSIS',
    category: 'analyst-wizard',
    hubCategory: 'financial-analysis',
    integrationStatus: 'native',
    description: 'Breakeven targets.',
    coreRank: 5,
  };

  const draftsByKey = new Map([
    ['breakeven-analysis', { stepIndex: 2, form: { annualRevenue: '1000000' } }],
  ]);

  const item = buildHubStatusItem(catalogEntry, 'client-1', new Map(), {}, draftsByKey);

  assert.equal(item.status, 'in_progress');
  assert.equal(item.progressPercent, 60);
});

test('buildHubStatusItem exposes progressPercent for basic client info drafts', () => {
  const catalogEntry = {
    key: 'basic-client-info',
    sheetName: 'BASIC CLIENT INFO',
    category: 'analyst-wizard',
    hubCategory: 'financial-analysis',
    integrationStatus: 'native',
    coreRank: 1,
  };

  const item = buildHubStatusItem(
    catalogEntry,
    'client-1',
    new Map(),
    {},
    new Map([['basic-client-info', { stepIndex: 3 }]]),
  );

  assert.equal(item.status, 'in_progress');
  assert.equal(item.progressPercent, 57);
});

test('buildHubStatusItem keeps progressPercent null when worksheet is complete', () => {
  const catalogEntry = {
    key: 'breakeven-analysis',
    sheetName: 'BREAKEVEN ANALYSIS',
    category: 'analyst-wizard',
    hubCategory: 'financial-analysis',
    integrationStatus: 'native',
    coreRank: 5,
  };

  const draftsByKey = new Map([['breakeven-analysis', { stepIndex: 2 }]]);

  const item = buildHubStatusItem(
    catalogEntry,
    'client-1',
    new Map([['breakeven-analysis', { id: 'run-1', created_at: '2026-01-01T00:00:00.000Z' }]]),
    {},
    draftsByKey,
  );

  assert.equal(item.status, 'complete');
  assert.equal(item.progressPercent, null);
});

test('resolveWorksheetStatus matches Phase 0 contract', () => {
  assert.equal(
    resolveWorksheetStatus({ integrationStatus: 'planned', hasLatestRun: true }),
    'planned',
  );
  assert.equal(
    resolveWorksheetStatus({ integrationStatus: 'native', hasLatestRun: true }),
    'complete',
  );
  assert.equal(
    resolveWorksheetStatus({
      integrationStatus: 'native',
      hasSnapshotProvenance: true,
    }),
    'in_progress',
  );
  assert.equal(resolveWorksheetStatus({ integrationStatus: 'native' }), 'not_started');
});

test('buildWorksheetHubStatusEntry omits href for planned integration', () => {
  const entry = buildWorksheetHubStatusEntry({
    catalogEntry: {
      key: 'intro',
      sheetName: 'INTRO',
      category: 'analyst-wizard',
      hubCategory: 'reports-slides',
      integrationStatus: 'planned',
      description: 'Planned intro sheet.',
    },
    clientId: 'client-1',
  });

  assert.equal(entry.status, 'planned');
  assert.equal(entry.href, null);
});

test('worksheet catalog exposes full analyst program integration', () => {
  const catalogPath = join(dirname(fileURLToPath(import.meta.url)), '../../knowledge/workbooks/worksheet_catalog.json');
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const integrated = catalog.filter((entry) => entry.integrationStatus !== 'planned');
  const planned = catalog.filter((entry) => entry.integrationStatus === 'planned');
  const deprecated = catalog.filter((entry) => entry.integrationStatus === 'deprecated');

  assert.equal(catalog.length, 74);
  assert.equal(integrated.length, 74);
  assert.equal(planned.length, 0);
  assert.equal(deprecated.length, 3);
});
