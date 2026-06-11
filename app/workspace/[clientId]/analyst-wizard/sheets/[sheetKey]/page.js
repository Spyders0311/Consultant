import AdvancedAnalystSheetWizard from '@/components/AdvancedAnalystSheetWizard';
import BreakevenWizard from '@/components/BreakevenWizard';
import WorkbookPortWizard from '@/components/WorkbookPortWizard';
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
  if (worksheet.component === 'advanced-analyst-sheet') {
    return <AdvancedAnalystSheetWizard clientId={clientId} sheetKey={sheetKey} />;
  }
  if (worksheet.component === 'workbook-port') {
    return <WorkbookPortWizard clientId={clientId} workbookKey={sheetKey} />;
  }

  notFound();
}
