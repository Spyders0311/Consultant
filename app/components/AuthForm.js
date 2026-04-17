'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function friendlyError(paramError) {
  if (paramError === 'unauthorized') {
    return 'Your account is missing consultant access or tenant assignment.';
  }
  return '';
}

export default function AuthForm({ paramError, nextPath }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const displayError = friendlyError(paramError);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const normalizedTenant = tenantId.trim().toLowerCase();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userTenant =
          user?.app_metadata?.tenant_id?.toLowerCase() ||
          user?.user_metadata?.tenant_id?.toLowerCase() ||
          '';
        if (!normalizedTenant || !userTenant || normalizedTenant !== userTenant) {
          await supabase.auth.signOut();
          throw new Error('Tenant ID does not match your consultant account.');
        }

        router.replace(nextPath || '/');
        router.refresh();
        return;
      }

      const normalizedTenant = tenantId.trim().toLowerCase();
      if (!normalizedTenant) {
        throw new Error('Tenant ID is required for consultant onboarding.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'consultant',
            tenant_id: normalizedTenant,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        router.replace('/');
        router.refresh();
      } else {
        setStatus('Account created. Check your email to confirm your account before logging in.');
      }
    } catch (err) {
      setStatus(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <p className="eyebrow">BMS Portal Access</p>
        <h1>{mode === 'login' ? 'Consultant Login' : 'Consultant Sign Up'}</h1>
        <p className="auth-copy">Use your consultant credentials and tenant ID to access the portal dashboard.</p>

        {displayError && <p className="auth-error">{displayError}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <label className="field">
              <span>Full Name</span>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>

          <label className="field">
            <span>Tenant ID</span>
            <input
              type="text"
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              placeholder="acme-consulting"
              required
            />
          </label>

          <div className="actions">
            <button type="submit" disabled={busy}>
              {busy ? 'Submitting...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </div>

          {status && <p className="auth-status">{status}</p>}
        </form>

        <button
          type="button"
          className="auth-toggle"
          onClick={() => {
            setMode((value) => (value === 'login' ? 'signup' : 'login'));
            setStatus('');
          }}
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>
      </section>
    </main>
  );
}
