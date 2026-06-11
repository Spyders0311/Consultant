import basicClientInfo from './basic-client-info';
import flexibleBudgetVariance from './flexible-budget-variance';
import weeklyCashFlow from './weekly-cash-flow';
import workingCapital from './working-capital';

/**
 * Wizard configs by sheet key. A key present here is rendered by the unified
 * WorksheetWizard; keys absent fall back to their pre-overhaul component
 * until migrated (Phase 4 migration order in the port tracker).
 */
const CONFIGS = {
  'basic-client-info': basicClientInfo,
  'flexible-budget-variance': flexibleBudgetVariance,
  'weekly-cash-flow': weeklyCashFlow,
  'working-capital-analysis': workingCapital,
};

export function getWizardConfig(sheetKey) {
  return CONFIGS[sheetKey] || null;
}
