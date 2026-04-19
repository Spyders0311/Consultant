'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SettingsForm() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) throw new Error('Not signed in.');

        if (!mounted) return;
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
        setWorkspaceName(user.user_metadata?.workspace_name || '');
        setPhone(user.user_metadata?.phone || user.user_metadata?.phone_number || '');
      } catch (err) {
        if (mounted) setStatus(err.message || 'Unable to load settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          workspace_name: workspaceName.trim(),
          phone: phone.trim(),
        },
      });
      if (error) throw error;
      setStatus('Saved.');
    } catch (err) {
      setStatus(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="status">Loading settings…</p>;
  }

  return (
    <form onSubmit={save} className="auth-form" style={{ marginTop: 18 }}>
      <label className="field">
        <span>Email (read-only)</span>
        <input type="email" value={email} readOnly />
      </label>

      <label className="field">
        <span>Full Name</span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
      </label>

      <label className="field">
        <span>Workspace Name</span>
        <input
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="BMS Consulting"
          required
        />
      </label>

      <label className="field">
        <span>Phone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
      </label>

      <div className="actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {status ? <p className="auth-status">{status}</p> : null}
    </form>
  );
}
