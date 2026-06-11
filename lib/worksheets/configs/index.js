import basicClientInfo from './basic-client-info';
import currentFinancialInformation from './current-financial-information';
import fiveYearProjections from './five-year-projections';
import flexibleBudgetVariance from './flexible-budget-variance';
import weeklyCashFlow from './weekly-cash-flow';
import workingCapital from './working-capital';

/**
 * Wizard configs by sheet key. A key present here is rendered by the unified
 * WorksheetWizard; keys absent fall back to their pre-overhaul component
 * until migrated (Phase 4 migration order in the port tracker).
 */
const CONFIGS = {
  '5-year-projections': fiveYearProjections,
  'basic-client-info': basicClientInfo,
  'current-financial-information': currentFinancialInformation,
  'flexible-budget-variance': flexibleBudgetVariance,
  'weekly-cash-flow': weeklyCashFlow,
  'working-capital-analysis': workingCapital,
};

export function getWizardConfig(sheetKey) {
  return CONFIGS[sheetKey] || null;
}
