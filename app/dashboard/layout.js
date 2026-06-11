import { createClient } from '@/lib/supabase/server';
import PortalTopbar from '@/components/shell/PortalTopbar';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <PortalTopbar userEmail={user?.email} />
      {children}
    </>
  );
}
