import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';

export const metadata = {
  title: 'Clients | BMS Portal',
};

function formatCreatedAt(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function ClientsPage() {
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

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, company_name, industry, created_at')
    .eq('consultant_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="portal-wrap">
      <section className="panel">
        <p className="eyebrow">Consulting Workspace</p>
        <h1>Clients</h1>
        <p>Review your client records and open each profile for full details.</p>
        <div className="actions">
          <Link href="/dashboard/clients/new" className="tab active">
            Create New Client
          </Link>
        </div>

        {error && <p className="status">Unable to load clients right now.</p>}

        {!error && (!clients || clients.length === 0) && (
          <div className="card">
            <h2>No clients yet</h2>
            <p>Create your first client record to start tracking baseline assumptions.</p>
          </div>
        )}

        {!error && !!clients?.length && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <Link href={`/workspace/${client.id}/analysis`}>{client.company_name || 'Untitled client'}</Link>
                    </td>
                    <td>{client.industry || 'Not set'}</td>
                    <td>{formatCreatedAt(client.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
