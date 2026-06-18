import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildShellFormValuesForDraft,
  resolveProgressPercentFromDraft,
  resolveStepProgressPercent,
} from '../worksheets/stepWizardProgress.js';

test('resolveStepProgressPercent matches wizard progress bars', () => {
  assert.equal(resolveStepProgressPercent(0, 5), 20);
  assert.equal(resolveStepProgressPercent(2, 5), 60);
  assert.equal(resolveStepProgressPercent(4, 5), 100);
});

test('resolveProgressPercentFromDraft only applies to tracked step wizards', () => {
  assert.equal(
    resolveProgressPercentFromDraft('breakeven-analysis', { stepIndex: 1 }),
    40,
  );
  assert.equal(resolveProgressPercentFromDraft('basic-client-info', { stepIndex: 2 }), 43);
  assert.equal(resolveProgressPercentFromDraft('current-financial-information', { stepIndex: 1 }), 40);
  assert.equal(resolveProgressPercentFromDraft('breakeven-analysis', null), null);
});

test('buildShellFormValuesForDraft flattens nested form payloads for the status rail', () => {
  assert.deepEqual(
    buildShellFormValuesForDraft(
      { form: { companyName: 'Acme', industry: 'Manufacturing' } },
      2,
    ),
    { companyName: 'Acme', industry: 'Manufacturing', stepIndex: 2 },
  );
});

test('buildShellFormValuesForDraft keeps top-level grid drafts intact', () => {
  assert.deepEqual(
    buildShellFormValuesForDraft(
      { years: [{ year: '2024', revenue: '100' }], inputMode: 'buckets' },
      1,
    ),
    { years: [{ year: '2024', revenue: '100' }], inputMode: 'buckets', stepIndex: 1 },
  );
});
