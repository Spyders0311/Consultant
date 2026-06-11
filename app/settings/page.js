import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';
import PortalTopbar from '@/components/shell/PortalTopbar';
import SettingsForm from '@/components/SettingsForm';

export const metadata = {
  title: 'Settings | BMS Portal',
};

export default async function SettingsPage() {
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

  return (
    <>
      <PortalTopbar userEmail={user.email} />
      <main className="portal-wrap">
        <section className="panel">
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
          <p>Update your consultant profile details used across PDFs and the portal UI.</p>

          <SettingsForm />
        </section>
      </main>
    </>
  );
}
