'use client';

import { useMemo, useState } from 'react';
import { CLIENT_GOALS_CONFIGS } from '@/lib/worksheets/formDocumentConfigs';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';

export default function ClientGoalsWizard({ clientId, sheetKey }) {
  const config = CLIENT_GOALS_CONFIGS[sheetKey];
  const [form, setForm] = useState(() =>
    Object.fromEntries(config.fields.map((field) => [field.name, ''])),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useWorksheetShellForm(useMemo(() => form, [form]));

  async function save() {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch('/api/worksheets/client-goals/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          goal_type: config.goalType,
          inputs: form,
          outputs: { savedAt: new Date().toISOString() },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Save failed.');
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Unable to save goals.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <h1>{config.title}</h1>
      </header>
      {config.fields.map((field) => (
        <label key={field.name} className="wizard-field">
          <span>{field.label}</span>
          <textarea
            rows={3}
            value={form[field.name]}
            onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
          />
        </label>
      ))}
      <button type="button" disabled={loading || !clientId} onClick={save}>
        {loading ? 'Saving...' : 'Save Goals'}
      </button>
      {saved ? <p className="wizard-meta">Goals saved.</p> : null}
      {error ? <p className="wizard-error">{error}</p> : null}
    </section>
  );
}
