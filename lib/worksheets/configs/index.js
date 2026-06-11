import advancedAnalystSheets from './advanced-analyst-sheets';
import balanceSheetComparisons from './balance-sheet-comparisons';
import basicClientInfo from './basic-client-info';
import breakeven from './breakeven';
import currentFinancialInformation from './current-financial-information';
import fiveYearProjections from './five-year-projections';
import flexibleBudgetVariance from './flexible-budget-variance';
import plComparisons from './pl-comparisons';
import weeklyCashFlow from './weekly-cash-flow';
import workingCapital from './working-capital';

/**
 * Wizard configs by sheet key. A key present here is rendered by the unified
 * WorksheetWizard; keys absent fall back to their pre-overhaul component
 * until migrated (Phase 4 migration order in the port tracker).
 */
const CONFIGS = {
  '5-year-projections': fiveYearProjections,
  'balance-sht-comparisons': balanceSheetComparisons,
  'basic-client-info': basicClientInfo,
  'breakeven-analysis': breakeven,
  'current-financial-information': currentFinancialInformation,
  'flexible-budget-variance': flexibleBudgetVariance,
  'p-l-comparisons': plComparisons,
  'weekly-cash-flow': weeklyCashFlow,
  'working-capital-analysis': workingCapital,
  ...advancedAnalystSheets,
};

export function getWizardConfig(sheetKey) {
  return CONFIGS[sheetKey] || null;
}
