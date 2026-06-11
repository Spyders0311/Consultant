import AdvancedAnalystSheetWizard from '@/components/AdvancedAnalystSheetWizard';
import BalanceSheetComparisonsWizard from '@/components/BalanceSheetComparisonsWizard';
import BreakevenWizard from '@/components/BreakevenWizard';
import CurrentFinancialInformationWizard from '@/components/CurrentFinancialInformationWizard';
import FiveYearProjectionsWizard from '@/components/FiveYearProjectionsWizard';
import PLComparisonsWizard from '@/components/PLComparisonsWizard';
import WorkbookPortWizard from '@/components/WorkbookPortWizard';
import WorkingCapitalWizard from '@/components/WorkingCapitalWizard';
import WorksheetWizard from '@/components/wizard/WorksheetWizard';
import ComingSoonPanel from '@/components/hub/ComingSoonPanel';
import { createClient } from '@/lib/supabase/server';
import { getWizardConfig } from '@/lib/worksheets/configs';
import { getWorksheet, getWorksheetGroups } from '@/lib/worksheets/registry';
import { notFound } from 'next/navigation';

export default async function AnalystWizardSheetPage({ params }) {
  const { sheetKey, clientId } = await params;
  const worksheet = getWorksheet(sheetKey);

  if (!worksheet) {
    notFound();
  }

  if (worksheet.status !== 'live') {
    const group = getWorksheetGroups({ liveOnly: true }).find(
      (entry) => entry.name === worksheet.group,
    );
    const alternatives = (group?.worksheets || [])
      .filter((entry) => entry.key !== sheetKey)
      .slice(0, 3)
      .map(({ key, displayName }) => ({ key, displayName }));

    return <ComingSoonPanel worksheet={worksheet} clientId={clientId} alternatives={alternatives} />;
  }

  // Sheets migrated onto the unified wizard render from their config; the
  // if-chain below shrinks as each remaining wizard migrates.
  const wizardConfig = getWizardConfig(sheetKey);
  if (wizardConfig) {
    let initialData = null;
    if (sheetKey === 'basic-client-info') {
      const supabase = await createClient();
      const { data: client } = await supabase
        .from('clients')
        .select('company_name, industry')
        .eq('id', clientId)
        .maybeSingle();

      initialData = {
        companyName: client?.company_name || '',
        industry: client?.industry || '',
      };
    }
    return <WorksheetWizard config={wizardConfig} clientId={clientId} initialData={initialData} />;
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
  if (worksheet.component === 'advanced-analyst-sheet') {
    return <AdvancedAnalystSheetWizard clientId={clientId} sheetKey={sheetKey} />;
  }
  if (worksheet.component === 'workbook-port') {
    return <WorkbookPortWizard clientId={clientId} workbookKey={sheetKey} />;
  }

  notFound();
}
