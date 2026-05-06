import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import AdvancedAnalystSheetWizard from '@/components/AdvancedAnalystSheetWizard';
import BasicClientInfoWizard from '@/components/BasicClientInfoWizard';
import BalanceSheetComparisonsWizard from '@/components/BalanceSheetComparisonsWizard';
import BreakevenWizard from '@/components/BreakevenWizard';
import CurrentFinancialInformationWizard from '@/components/CurrentFinancialInformationWizard';
import FlexibleBudgetVarianceWizard from '@/components/FlexibleBudgetVarianceWizard';
import FiveYearProjectionsWizard from '@/components/FiveYearProjectionsWizard';
import PLComparisonsWizard from '@/components/PLComparisonsWizard';
import WeeklyCashFlowWizard from '@/components/WeeklyCashFlowWizard';
import WorkingCapitalWizard from '@/components/WorkingCapitalWizard';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

const customWorksheets = {
  'weekly-cash-flow': {
    key: 'weekly-cash-flow',
    sheetName: 'WEEKLY CASH FLOW FORECAST',
    category: 'analysis',
  },
  'flexible-budget-variance': {
    key: 'flexible-budget-variance',
    sheetName: 'FLEXIBLE BUDGET / VARIANCE',
    category: 'analysis',
  },
};

const advancedAnalystSheetKeys = new Set([
  '12-month-p-l-comparisons',
  'p-l-comparisons-min-max',
  'misc-direct-expenses',
  'misc-indirect-expenses',
  'z-score-private-heavy-assets',
  'comparative-activity-ratios',
]);

export default async function AnalystWizardSheetPlaceholderPage({ params }) {
  const { sheetKey, clientId } = await params;
  const worksheet = worksheetCatalog.find((entry) => entry.key === sheetKey) || customWorksheets[sheetKey];
  let initialClientInfo = null;

  if (!worksheet) {
    notFound();
  }

  if (sheetKey === 'basic-client-info') {
    const supabase = await createClient();
    const { data: client } = await supabase
      .from('clients')
      .select('company_name, industry')
      .eq('id', clientId)
      .maybeSingle();

    initialClientInfo = {
      companyName: client?.company_name || '',
      industry: client?.industry || '',
    };
    return <BasicClientInfoWizard clientId={clientId} initialClientInfo={initialClientInfo} />;
  }

  if (sheetKey === 'breakeven-analysis') {
    return <BreakevenWizard clientId={clientId} />;
  }
  if (sheetKey === 'working-capital-analysis') {
    return <WorkingCapitalWizard clientId={clientId} />;
  }
  if (sheetKey === 'p-l-comparisons') {
    return <PLComparisonsWizard clientId={clientId} />;
  }
  if (sheetKey === 'balance-sht-comparisons') {
    return <BalanceSheetComparisonsWizard clientId={clientId} />;
  }
  if (sheetKey === 'current-financial-information') {
    return <CurrentFinancialInformationWizard clientId={clientId} />;
  }
  if (sheetKey === '5-year-projections') {
    return <FiveYearProjectionsWizard clientId={clientId} />;
  }
  if (sheetKey === 'weekly-cash-flow') {
    return <WeeklyCashFlowWizard clientId={clientId} />;
  }
  if (sheetKey === 'flexible-budget-variance') {
    return <FlexibleBudgetVarianceWizard clientId={clientId} />;
  }
  if (advancedAnalystSheetKeys.has(sheetKey)) {
    return <AdvancedAnalystSheetWizard clientId={clientId} sheetKey={sheetKey} />;
  }

  return (
    <section className="panel">
      <h2>{worksheet.sheetName}</h2>
      <p>Coming soon.</p>
    </section>
  );
}
