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

  const wizardConfig = getWizardConfig(sheetKey);
  if (!wizardConfig) {
    notFound();
  }

  // Basic client info prefills company details from the client record.
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
