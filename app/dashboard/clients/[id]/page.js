import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';
import { clientGlobalFields } from '@/lib/clients/globalColumns';

export const metadata = {
  title: 'Client Details | BMS Portal',
};

function formatFieldValue(value) {
  if (value == null || value === '') return 'Not set';
  if (typeof value === 'number') return value.toLocaleString('en-US');
  return String(value);
}

export default async function ClientDetailPage({ params }) {
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

  const { id } = await params;
  const fieldKeys = clientGlobalFields.map((field) => field.key).join(', ');
  const selectColumns = `id, consultant_id, created_at, ${fieldKeys}`;

  const { data: client, error } = await supabase
    .from('clients')
    .select(selectColumns)
    .eq('id', id)
    .eq('consultant_id', user.id)
    .maybeSingle();

  if (error || !client) {
    return (
      <main className="portal-wrap">
        <section className="panel">
          <p className="eyebrow">Client Profile</p>
          <h1>Client Not Found</h1>
          <p>We could not find a client with that ID in your workspace.</p>
          <div className="actions">
            <Link href="/dashboard/clients" className="tab active">
              Back to Clients
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-wrap">
      <section className="panel">
        <p className="eyebrow">Client Profile</p>
        <h1>{client.company_name || 'Untitled client'}</h1>
        <p>Baseline assumptions and stored intake values for this engagement.</p>
        <div className="actions">
          <Link href={`/workspace/${id}/analysis`} className="tab active">
            Open Workspace
          </Link>
          <Link href="/dashboard/clients" className="tab active">
            Back to Clients
          </Link>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {clientGlobalFields.map((field) => (
                <tr key={field.key}>
                  <td>{field.label}</td>
                  <td>{formatFieldValue(client[field.key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
