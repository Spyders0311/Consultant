'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ConsultantSessionBar({ consultantName, consultantEmail }) {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace('/login');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <section className="session-bar">
      <div>
        <p className="eyebrow">Consultant Dashboard</p>
        <p className="session-text">
          {consultantName} ({consultantEmail})
        </p>
      </div>
      <div className="actions" style={{ margin: 0 }}>
        <Link href="/settings" className="tab workspace-back-link">
          Settings
        </Link>
        <button type="button" className="ghost" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </section>
  );
}
