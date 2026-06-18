import { CORE_RANK_BY_KEY } from './catalogMetadata.js';

/**
 * @typedef {'text' | 'year' | 'positiveNumber' | 'nonNegativeNumber'} RequiredFieldType
 */

/**
 * @typedef {Object} RequiredFieldDefinition
 * @property {string} key - Form field key or dotted path (e.g. years.0.revenue)
 * @property {string} label - Human label for worksheet rail copy
 * @property {RequiredFieldType} [type]
 */

/**
 * @typedef {Object} RequiredFieldGroupDefinition
 * @property {string} group - Stable id for the rule
 * @property {string} label
 * @property {string[]} keys - Any one non-empty text field satisfies the group
 * @property {'anyText'} type
 */

/**
 * @typedef {RequiredFieldDefinition | RequiredFieldGroupDefinition} RequiredFieldRuleDefinition
 */

/**
 * @typedef {Object} RequiredFieldRule
 * @property {string} key
 * @property {string} label
 * @property {(values: Record<string, unknown>) => boolean} isComplete
 * @property {string[]} [fieldKeys]
 */

/**
 * @typedef {Object} RequiredFieldCompletion
 * @property {number} completed
 * @property {number} total
 * @property {number} percent
 * @property {string[]} incompleteKeys
 * @property {RequiredFieldRule[]} rules
 */

/** @type {RequiredFieldRuleDefinition[]} */
const BASIC_CLIENT_INFO_FIELDS = [
  { key: 'companyName', label: 'Company name', type: 'text' },
  { key: 'industry', label: 'Industry', type: 'text' },
  {
    group: 'primaryContact',
    label: 'Primary contact',
    keys: ['primaryContactName', 'primaryContactEmail', 'primaryContactPhone'],
    type: 'anyText',
  },
];

/** @type {RequiredFieldRuleDefinition[]} */
const CURRENT_FINANCIAL_INFORMATION_FIELDS = [
  { key: 'annualRevenue', label: 'Annual revenue', type: 'nonNegativeNumber' },
  { key: 'annualCogs', label: 'Annual COGS', type: 'nonNegativeNumber' },
  { key: 'annualFixedExpenses', label: 'Annual fixed expenses', type: 'nonNegativeNumber' },
  { key: 'daysSalesOutstanding', label: 'Days sales outstanding', type: 'nonNegativeNumber' },
  { key: 'daysInventoryOnHand', label: 'Days inventory on hand', type: 'nonNegativeNumber' },
  { key: 'daysPayablesOutstanding', label: 'Days payables outstanding', type: 'nonNegativeNumber' },
  { key: 'workDaysPerYear', label: 'Work days per year', type: 'positiveNumber' },
  { key: 'workHoursPerDay', label: 'Work hours per day', type: 'positiveNumber' },
];

/** @type {RequiredFieldRuleDefinition[]} */
const PL_COMPARISON_FIELDS = Array.from({ length: 4 }, (_, index) => [
  { key: `years.${index}.year`, label: `Year ${index + 1}`, type: 'year' },
  { key: `years.${index}.revenue`, label: `Year ${index + 1} revenue`, type: 'nonNegativeNumber' },
]).flat();

/** @type {RequiredFieldRuleDefinition[]} */
const BALANCE_SHEET_COMPARISON_FIELDS = Array.from({ length: 4 }, (_, index) => ({
  key: `years.${index}.year`,
  label: `Year ${index + 1}`,
  type: 'year',
}));

/** @type {RequiredFieldRuleDefinition[]} */
const BREAKEVEN_FIELDS = [
  { key: 'annualRevenue', label: 'Annual revenue', type: 'positiveNumber' },
  { key: 'fixedExpensesAmount', label: 'Fixed expenses', type: 'nonNegativeNumber' },
  { key: 'workDaysPerYear', label: 'Work days per year', type: 'positiveNumber' },
  { key: 'workHoursPerDay', label: 'Work hours per day', type: 'positiveNumber' },
];

/** @type {RequiredFieldRuleDefinition[]} */
const WORKING_CAPITAL_FIELDS = [
  { key: 'annualRevenue', label: 'Annual revenue', type: 'nonNegativeNumber' },
  { key: 'annualCogs', label: 'Annual COGS', type: 'nonNegativeNumber' },
  { key: 'daysSalesOutstanding', label: 'Days sales outstanding', type: 'nonNegativeNumber' },
  { key: 'daysInventoryOnHand', label: 'Days inventory on hand', type: 'nonNegativeNumber' },
  { key: 'daysPayablesOutstanding', label: 'Days payables outstanding', type: 'nonNegativeNumber' },
];

/** @type {RequiredFieldRuleDefinition[]} */
const FIVE_YEAR_PROJECTION_FIELDS = [
  { key: 'baseYear', label: 'Base year', type: 'year' },
  { key: 'baseRevenue', label: 'Base revenue', type: 'nonNegativeNumber' },
  { key: 'baseCogsPercent', label: 'Base COGS %', type: 'nonNegativeNumber' },
  { key: 'baseFixedExpenses', label: 'Base fixed expenses', type: 'nonNegativeNumber' },
  { key: 'fixedExpenseGrowthPercent', label: 'Fixed expense growth %', type: 'nonNegativeNumber' },
];

/** @type {Record<string, RequiredFieldRuleDefinition[]>} */
export const REQUIRED_FIELDS_BY_WORKSHEET = {
  'basic-client-info': BASIC_CLIENT_INFO_FIELDS,
  'current-financial-information': CURRENT_FINANCIAL_INFORMATION_FIELDS,
  'p-l-comparisons': PL_COMPARISON_FIELDS,
  'balance-sht-comparisons': BALANCE_SHEET_COMPARISON_FIELDS,
  'breakeven-analysis': BREAKEVEN_FIELDS,
  'working-capital-analysis': WORKING_CAPITAL_FIELDS,
  '5-year-projections': FIVE_YEAR_PROJECTION_FIELDS,
};

/** Core worksheet keys sorted by coreRank. */
export const CORE_WORKSHEET_KEYS = Object.entries(CORE_RANK_BY_KEY)
  .sort(([, rankA], [, rankB]) => rankA - rankB)
  .map(([worksheetKey]) => worksheetKey);

/**
 * @param {unknown} value
 */
function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

/**
 * @param {unknown} value
 */
function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * @param {Record<string, unknown>} values
 * @param {string} path
 */
export function getValueAtPath(values, path) {
  if (!values || typeof values !== 'object') return undefined;
  if (!path.includes('.')) return values[path];

  return path.split('.').reduce((current, segment) => {
    if (current == null) return undefined;
    if (Array.isArray(current)) {
      const index = Number.parseInt(segment, 10);
      return Number.isNaN(index) ? undefined : current[index];
    }
    if (typeof current === 'object') {
      return /** @type {Record<string, unknown>} */ (current)[segment];
    }
    return undefined;
  }, /** @type {unknown} */ (values));
}

/**
 * @param {unknown} value
 * @param {RequiredFieldType} type
 */
export function isRequiredValueComplete(value, type) {
  switch (type) {
    case 'text':
      return hasText(value);
    case 'year': {
      const numeric = parseNumber(value);
      return numeric !== null && numeric > 1900;
    }
    case 'positiveNumber': {
      const numeric = parseNumber(value);
      return numeric !== null && numeric > 0;
    }
    case 'nonNegativeNumber': {
      const numeric = parseNumber(value);
      return numeric !== null && numeric >= 0;
    }
    default:
      return false;
  }
}

/**
 * @param {RequiredFieldRuleDefinition} definition
 * @returns {RequiredFieldRule}
 */
export function compileRequiredFieldRule(definition) {
  if ('group' in definition) {
    return {
      key: definition.group,
      label: definition.label,
      fieldKeys: definition.keys,
      isComplete: (values) => definition.keys.some((fieldKey) => hasText(getValueAtPath(values, fieldKey))),
    };
  }

  const type = definition.type || 'text';
  return {
    key: definition.key,
    label: definition.label,
    fieldKeys: [definition.key],
    isComplete: (values) => isRequiredValueComplete(getValueAtPath(values, definition.key), type),
  };
}

/**
 * @param {string} worksheetKey
 * @returns {RequiredFieldRule[]}
 */
export function getRequiredFieldRules(worksheetKey) {
  const definitions = REQUIRED_FIELDS_BY_WORKSHEET[worksheetKey];
  if (!definitions) return [];
  return definitions.map(compileRequiredFieldRule);
}

/**
 * @param {string} worksheetKey
 * @returns {string[]}
 */
export function listRequiredFieldKeys(worksheetKey) {
  const definitions = REQUIRED_FIELDS_BY_WORKSHEET[worksheetKey] || [];
  /** @type {string[]} */
  const keys = [];
  for (const definition of definitions) {
    if ('group' in definition) {
      keys.push(...definition.keys);
    } else {
      keys.push(definition.key);
    }
  }
  return keys;
}

/**
 * @param {string} worksheetKey
 */
export function isCoreWorksheet(worksheetKey) {
  return Object.prototype.hasOwnProperty.call(REQUIRED_FIELDS_BY_WORKSHEET, worksheetKey);
}

/**
 * @param {string} worksheetKey
 * @param {Record<string, unknown>} [values]
 * @returns {RequiredFieldCompletion}
 */
export function getRequiredFieldCompletion(worksheetKey, values = {}) {
  const rules = getRequiredFieldRules(worksheetKey);
  const incompleteKeys = [];
  let completed = 0;

  for (const rule of rules) {
    if (rule.isComplete(values)) {
      completed += 1;
    } else {
      incompleteKeys.push(rule.key);
    }
  }

  const total = rules.length;
  const percent = total === 0 ? 100 : Math.round((completed / total) * 100);

  return {
    completed,
    total,
    percent,
    incompleteKeys,
    rules,
  };
}
