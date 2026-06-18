import { redirect } from 'next/navigation';

import AnalystWorksheetHub from '@/components/hub/AnalystWorksheetHub';
import { isConsultant } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { getClientHubStatus } from '@/lib/server/hubStatus';

export default async function WorkspaceAnalystWizardPage({ params }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (!isConsultant(user)) redirect('/login?error=unauthorized');

  const { clientId } = await params;
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .maybeSingle();

  if (clientError || !client) redirect('/dashboard/clients');

  const hubStatus = await getClientHubStatus(clientId, supabase);

  return <AnalystWorksheetHub clientId={clientId} hubStatus={hubStatus} />;
}
