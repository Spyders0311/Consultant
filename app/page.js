import { redirect } from 'next/navigation';
import PortalApp from '@/app/components/PortalApp';
import { createClient } from '@/lib/supabase/server';
import { getUserTenantId, isConsultant } from '@/lib/supabase/auth';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const tenantId = getUserTenantId(user);
  if (!tenantId || !isConsultant(user)) {
    redirect('/login?error=unauthorized');
  }

  const consultantName = user.user_metadata?.full_name || user.email;

  return (
    <PortalApp
      consultantName={consultantName}
      consultantEmail={user.email}
      tenantId={tenantId}
    />
  );
}
