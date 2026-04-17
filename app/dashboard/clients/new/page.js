import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';
import NewClientWizard from './wizard';

export const metadata = {
  title: 'Create New Client | BMS Portal',
};

export default async function NewClientPage() {
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

  return (
    <main className="portal-wrap">
      <section className="panel">
        <p className="eyebrow">Client Intake</p>
        <h1 className="new-client-title">Create New Client</h1>
        <p className="new-client-subtitle">
          {consultantName} can complete this guided intake and securely save the record.
        </p>
        <NewClientWizard />
      </section>
    </main>
  );
}
