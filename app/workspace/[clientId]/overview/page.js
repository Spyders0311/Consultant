import { redirect } from 'next/navigation';
import ClientCommandCenter from '@/components/hub/ClientCommandCenter';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';
import { getCommandCenterData } from '@/lib/server/commandCenterData';

export default async function WorkspaceOverviewPage({ params }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!isConsultant(user)) {
    redirect('/login?error=unauthorized');
  }

  const { clientId } = await params;
  const data = await getCommandCenterData(supabase, clientId);

  if (!data.client) {
    redirect('/dashboard/clients');
  }

  return (
    <ClientCommandCenter
      clientId={clientId}
      client={data.client}
      kpis={data.kpis}
      coreItems={data.coreItems}
      progressPercent={data.progressPercent}
      hubItems={data.hubStatus.items}
      recentItems={data.recentItems}
      summary={data.hubStatus.summary}
    />
  );
}
