'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/Icon';

export default function SignOutButton() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={signOut} disabled={busy}>
      <Icon name="logout" size={14} />
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
