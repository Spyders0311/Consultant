import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';
import WorkspaceShell from '@/components/shell/WorkspaceShell';
import { getAllWorksheets, getWorksheetGroups } from '@/lib/worksheets/registry';

export default async function WorkspaceLayout({ children, params }) {
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
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('consultant_id', user.id)
    .order('created_at', { ascending: false });

  const client = (clients || []).find((row) => row.id === clientId);
  if (!client) {
    redirect('/dashboard/clients');
  }

  const allWorksheets = getAllWorksheets();
  const worksheets = allWorksheets.map(({ key, displayName, group, status }) => ({
    key,
    displayName,
    group,
    status,
  }));
  const navGroups = getWorksheetGroups({ liveOnly: true }).map((group) => ({
    name: group.name,
    worksheets: group.worksheets.map(({ key, displayName }) => ({ key, displayName })),
  }));
  const sheetNames = Object.fromEntries(allWorksheets.map((entry) => [entry.key, entry.displayName]));

  return (
    <WorkspaceShell
      clientId={clientId}
      clientName={client.company_name || 'Untitled client'}
      clients={clients || []}
      navGroups={navGroups}
      worksheets={worksheets}
      totalWorksheets={worksheets.length}
      sheetNames={sheetNames}
      userEmail={user.email}
    >
      {children}
    </WorkspaceShell>
  );
}
