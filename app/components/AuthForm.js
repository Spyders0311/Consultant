'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function friendlyError(paramError) {
  if (paramError === 'unauthorized') {
    return 'Your account is missing consultant access.';
  }
  return '';
}

const LOGIN_FEATURES = [
  {
    title: 'Consultant workspace',
    copy: 'Manage client engagements, worksheets, and financial analysis from one secure dashboard.',
  },
  {
    title: 'Server-side calculations',
    copy: 'Spreadsheet-grade valuation logic runs on the server. Inputs in, results out — logic stays protected.',
  },
  {
    title: 'Client command center',
    copy: 'Track worksheet progress, KPIs, and deliverables across every active engagement.',
  },
];

export default function AuthForm({ paramError, nextPath }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
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
        router.replace(nextPath || '/');
        router.refresh();
        return;
      }

      const normalizedWorkspaceName = workspaceName.trim();
      if (!normalizedWorkspaceName) {
        throw new Error('Workspace name is required for consultant onboarding.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'consultant',
            workspace_name: normalizedWorkspaceName,
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
    <main className="portal-wrap login-page">
      <section className="login-brand-bar" aria-label="Portal branding">
        <div>
          <p className="eyebrow">BMS Intelligent Portal</p>
          <p className="login-brand-bar__tagline">Consultant access only</p>
        </div>
      </section>

      <section className="hero login-hero">
        <p className="eyebrow">Secure Decision Engine</p>
        <h1>{mode === 'login' ? 'Sign in to your workspace' : 'Create your consultant account'}</h1>
        <p>
          Spreadsheet-grade valuation logic runs on the server. The browser only sends inputs and receives
          results.
        </p>
      </section>

      <section className="panel login-panel">
        <div className="login-layout">
          <aside className="login-aside" aria-label="Portal capabilities">
            {LOGIN_FEATURES.map((feature) => (
              <article key={feature.title} className="card login-feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </aside>

          <div className="login-form-shell wizard-card">
            <p className="wizard-kicker">{mode === 'login' ? 'Consultant login' : 'New consultant'}</p>
            <h2 className="login-form-title">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="login-form-copy">
              {mode === 'login'
                ? 'Use your consultant credentials to access the portal dashboard.'
                : 'Set up your workspace to begin onboarding clients and running analysis.'}
            </p>

            {displayError && <p className="login-form-error">{displayError}</p>}

            <form onSubmit={handleSubmit} className="login-form">
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

              {mode === 'signup' && (
                <label className="field">
                  <span>Workspace Name</span>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    placeholder="BMS Consulting"
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

              <div className="login-form-actions">
                <button type="submit" disabled={busy}>
                  {busy ? 'Submitting...' : mode === 'login' ? 'Sign in' : 'Create account'}
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setMode((value) => (value === 'login' ? 'signup' : 'login'));
                    setStatus('');
                  }}
                >
                  {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </button>
              </div>

              {status && (
                <p className={status.includes('created') ? 'login-form-success' : 'login-form-status'}>
                  {status}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
