import { redirect } from 'next/navigation';
import ClientsDashboard from '@/components/dashboard/ClientsDashboard';
import ConsultantSessionBar from '@/components/dashboard/ConsultantSessionBar';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';

export const metadata = {
  title: 'Clients | BMS Portal',
  description: 'Manage client engagements and open workspaces from the BMS consultant dashboard.',
};

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

  const consultantName = user.user_metadata?.full_name || user.email;
  const consultantEmail = user.email;

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, company_name, industry, created_at')
    .eq('consultant_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="portal-wrap dashboard-page">
      <ConsultantSessionBar consultantName={consultantName} consultantEmail={consultantEmail} />
      <ClientsDashboard clients={clients || []} error={error} />
    </main>
  );
}
