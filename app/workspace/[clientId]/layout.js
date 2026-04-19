import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';
import WorkspaceTabNav from '@/components/WorkspaceTabNav';

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
  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('id', clientId)
    .eq('consultant_id', user.id)
    .maybeSingle();

  if (!client) {
    redirect('/dashboard/clients');
  }

  return (
    <main className="portal-wrap workspace-shell">
      <section className="workspace-header">
        <div>
          <p className="eyebrow">Client Workspace</p>
          <h1>{client.company_name || 'Untitled client'}</h1>
        </div>
        <div className="actions" style={{ margin: 0 }}>
          <Link href="/dashboard/clients" className="tab workspace-back-link">
            Back to Clients
          </Link>
          <Link href="/settings" className="tab workspace-back-link">
            Settings
          </Link>
        </div>
      </section>

      <WorkspaceTabNav clientId={clientId} />
      {children}
    </main>
  );
}
