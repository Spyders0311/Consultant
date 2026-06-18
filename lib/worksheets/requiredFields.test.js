import assert from 'node:assert/strict';
import test from 'node:test';
import { CORE_RANK_BY_KEY } from './catalogMetadata.js';
import {
  CORE_WORKSHEET_KEYS,
  getRequiredFieldCompletion,
  getRequiredFieldRules,
  getValueAtPath,
  isCoreWorksheet,
  isRequiredValueComplete,
  listRequiredFieldKeys,
  REQUIRED_FIELDS_BY_WORKSHEET,
} from './requiredFields.js';

test('CORE_WORKSHEET_KEYS covers all seven core ranks', () => {
  assert.equal(CORE_WORKSHEET_KEYS.length, 7);
  assert.deepEqual(new Set(CORE_WORKSHEET_KEYS), new Set(Object.keys(CORE_RANK_BY_KEY)));
});

test('required field manifest includes only core worksheets', () => {
  assert.deepEqual(Object.keys(REQUIRED_FIELDS_BY_WORKSHEET).sort(), CORE_WORKSHEET_KEYS.slice().sort());
});

test('getValueAtPath reads nested year grid values', () => {
  const values = {
    years: [
      { year: 2023, revenue: 1000000 },
      { year: 2024, revenue: 1100000 },
    ],
  };

  assert.equal(getValueAtPath(values, 'years.0.year'), 2023);
  assert.equal(getValueAtPath(values, 'years.1.revenue'), 1100000);
});

test('basic client info counts contact group as one required rule', () => {
  const empty = getRequiredFieldCompletion('basic-client-info', {});
  assert.equal(empty.total, 3);
  assert.equal(empty.completed, 0);

  const partial = getRequiredFieldCompletion('basic-client-info', {
    companyName: 'Acme Co',
    industry: 'Manufacturing',
    primaryContactEmail: 'ops@acme.test',
  });
  assert.equal(partial.completed, 3);
  assert.equal(partial.percent, 100);
});

test('p-l comparisons requires four years with revenue', () => {
  const rules = getRequiredFieldRules('p-l-comparisons');
  assert.equal(rules.length, 8);

  const partial = getRequiredFieldCompletion('p-l-comparisons', {
    years: [
      { year: 2021, revenue: 900000 },
      { year: 2022, revenue: 950000 },
      { year: 2023, revenue: 1000000 },
      { year: '', revenue: '' },
    ],
  });
  assert.equal(partial.completed, 6);
  assert.equal(partial.percent, 75);
});

test('breakeven positive-number rules reject empty revenue', () => {
  assert.equal(isRequiredValueComplete('', 'positiveNumber'), false);
  assert.equal(isRequiredValueComplete(0, 'positiveNumber'), false);
  assert.equal(isRequiredValueComplete(1250000, 'positiveNumber'), true);
});

test('listRequiredFieldKeys expands grouped contact fields', () => {
  const keys = listRequiredFieldKeys('basic-client-info');
  assert.ok(keys.includes('companyName'));
  assert.ok(keys.includes('primaryContactPhone'));
});

test('isCoreWorksheet is true only for manifest worksheets', () => {
  assert.equal(isCoreWorksheet('breakeven-analysis'), true);
  assert.equal(isCoreWorksheet('misc-direct-expenses'), false);
});
