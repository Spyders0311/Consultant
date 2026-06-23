'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import { downloadInvoicePdf } from '@/lib/client/downloadInvoicePdf';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';
import useWorksheetShellRunLoader from '@/lib/client/useWorksheetShellRunLoader';
import { formatCurrency } from '@/lib/hub/formatters';
import { FORM_DOCUMENT_CONFIGS } from '@/lib/worksheets/formDocumentConfigs';
import { resolveInvoiceAmount } from '@/lib/worksheets/invoiceDocumentModel';

function buildInitialForm(config, clientRow) {
  const initial = Object.fromEntries(config.fields.map((field) => [field.name, '']));
  if (clientRow?.company_name && config.invoiceType === 'consultation') {
    initial.serviceDescription = `Consulting — ${clientRow.company_name}`;
  }
  if (config.formType === 'invoice' && !initial.invoiceDate) {
    initial.invoiceDate = new Date().toISOString().slice(0, 10);
  }
  return initial;
}

function runMatchesSheet(run, config) {
  if (config.formType !== 'invoice') return true;
  return run?.invoice_type === config.invoiceType;
}

export default function FormDocumentWizard({ clientId, sheetKey, clientRow = null }) {
  const config = FORM_DOCUMENT_CONFIGS[sheetKey];
  const [form, setForm] = useState(() => buildInitialForm(config, clientRow));
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [saved, setSaved] = useState(false);
  const [runId, setRunId] = useState('');

  const loadRun = useCallback(
    (run) => {
      if (!runMatchesSheet(run, config)) return;
      const inputs = run?.inputs && typeof run.inputs === 'object' ? run.inputs : {};
      setForm((prev) => ({ ...prev, ...inputs }));
      setRunId(String(run.id || ''));
      setSaved(true);
      setError('');
      setPdfError('');
    },
    [config],
  );

  useWorksheetShellForm(useMemo(() => form, [form]));
  useWorksheetShellRunLoader(loadRun);

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
      setRunId(String(data.id || ''));
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Unable to save form.');
    } finally {
      setLoading(false);
    }
  }

  async function exportPdf() {
    if (config.formType !== 'invoice' || !config.invoiceType) return;

    setPdfLoading(true);
    setPdfError('');
    try {
      await downloadInvoicePdf({
        clientId,
        invoiceType: config.invoiceType,
        inputs: form,
        runId: runId || undefined,
        filename: `bms-${config.invoiceType}-invoice.pdf`,
      });
    } catch (err) {
      setPdfError(err.message || 'Unable to generate PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  const invoiceAmount =
    config.formType === 'invoice' && config.invoiceType
      ? resolveInvoiceAmount(config.invoiceType, form)
      : null;

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <h1>{config.title}</h1>
        {config.formType === 'invoice' ? (
          <p className="wizard-meta">
            Saved invoices appear on the{' '}
            <Link href={`/workspace/${clientId}/invoice-billing`}>Invoice / Billing</Link> tab.
          </p>
        ) : null}
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
      {config.formType === 'invoice' && invoiceAmount != null ? (
        <p className="wizard-meta">
          Invoice total: <strong>{formatCurrency(invoiceAmount)}</strong>
        </p>
      ) : null}
      <div className="wizard-actions">
        <button type="button" disabled={loading || !clientId} onClick={save}>
          {loading ? 'Saving...' : 'Save Document'}
        </button>
        {config.formType === 'invoice' ? (
          <button
            type="button"
            className="ghost"
            disabled={pdfLoading || !clientId || invoiceAmount == null || invoiceAmount <= 0}
            onClick={exportPdf}
          >
            {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        ) : null}
      </div>
      {saved ? <p className="wizard-meta">Document saved{runId ? ` (run ${runId.slice(0, 8)})` : ''}.</p> : null}
      {error ? <p className="wizard-error">{error}</p> : null}
      {pdfError ? <p className="wizard-error">{pdfError}</p> : null}
    </section>
  );
}
