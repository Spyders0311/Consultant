import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';

export default async function HomePage() {
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

  redirect('/dashboard/clients');
}
