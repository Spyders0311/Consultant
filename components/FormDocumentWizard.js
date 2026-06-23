'use client';

import { useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import { FORM_DOCUMENT_CONFIGS } from '@/lib/worksheets/formDocumentConfigs';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';

export default function FormDocumentWizard({ clientId, sheetKey, clientRow = null }) {
  const config = FORM_DOCUMENT_CONFIGS[sheetKey];
  const [form, setForm] = useState(() => {
    const initial = Object.fromEntries(config.fields.map((field) => [field.name, '']));
    if (clientRow?.company_name) initial.serviceDescription = `Consulting — ${clientRow.company_name}`;
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useWorksheetShellForm(useMemo(() => form, [form]));

  async function save() {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch('/api/worksheets/form-documents/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          form_type: config.formType,
          invoice_type: config.invoiceType || null,
          inputs: form,
          outputs: { savedAt: new Date().toISOString() },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Save failed.');
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Unable to save form.');
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
          {field.type === 'textarea' ? (
            <textarea
              rows={3}
              value={form[field.name]}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
            />
          ) : (
            <WorksheetInput
              type={field.type}
              value={form[field.name]}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
            />
          )}
        </label>
      ))}
      <button type="button" disabled={loading || !clientId} onClick={save}>
        {loading ? 'Saving...' : 'Save Document'}
      </button>
      {saved ? <p className="wizard-meta">Document saved.</p> : null}
      {error ? <p className="wizard-error">{error}</p> : null}
    </section>
  );
}
