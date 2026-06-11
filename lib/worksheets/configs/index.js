import flexibleBudgetVariance from './flexible-budget-variance';
import weeklyCashFlow from './weekly-cash-flow';

/**
 * Wizard configs by sheet key. A key present here is rendered by the unified
 * WorksheetWizard; keys absent fall back to their pre-overhaul component
 * until migrated (Phase 4 migration order in the port tracker).
 */
const CONFIGS = {
  'flexible-budget-variance': flexibleBudgetVariance,
  'weekly-cash-flow': weeklyCashFlow,
};

export function getWizardConfig(sheetKey) {
  return CONFIGS[sheetKey] || null;
}
