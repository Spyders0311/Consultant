import Link from 'next/link';
import { useState } from 'react';
import { downloadInvoicePdf } from '@/lib/client/downloadInvoicePdf';
import { formatCurrency, formatRelativeDate } from '@/lib/hub/formatters';
import {
  getInvoiceSheetKey,
  getInvoiceTitle,
  resolveInvoiceAmount,
  summarizeInvoiceRun,
} from '@/lib/worksheets/invoiceDocumentModel';

const INVOICE_CREATORS = [
  {
    sheetKey: 'initial-consultation-invoice',
    title: 'Initial Consultation Invoice',
    description: 'Hourly consultation billing with service description and rate.',
  },
  {
    sheetKey: 'ps-retainer-invoice',
    title: 'PS Retainer Invoice',
    description: 'Retainer period and fixed retainer amount.',
  },
];

/**
 * @param {{
 *   clientId: string,
 *   clientName: string,
 *   runs: Array<Record<string, unknown>>,
 * }} props
 */
export default function InvoiceBillingWorkspace({ clientId, clientName, runs }) {
  const totals = runs.reduce((sum, run) => {
    const invoiceType = run.invoice_type === 'retainer' ? 'retainer' : 'consultation';
    const inputs = run.inputs && typeof run.inputs === 'object' ? run.inputs : {};
    const amount = resolveInvoiceAmount(invoiceType, inputs);
    return sum + (amount || 0);
  }, 0);

  const consultationCount = runs.filter((run) => run.invoice_type === 'consultation').length;
  const retainerCount = runs.filter((run) => run.invoice_type === 'retainer').length;

  return (
    <div className="invoice-billing">
      <section className="panel invoice-billing__intro">
        <h2>Invoice / Billing</h2>
        <p>
          Review saved invoices for <strong>{clientName}</strong>, export client-ready PDFs, and open the analyst
          worksheets to create new billing documents.
        </p>
        <div className="invoice-billing__stats">
          <div className="invoice-billing__stat">
            <span className="invoice-billing__stat-label">Saved invoices</span>
            <strong>{runs.length}</strong>
          </div>
          <div className="invoice-billing__stat">
            <span className="invoice-billing__stat-label">Consultation</span>
            <strong>{consultationCount}</strong>
          </div>
          <div className="invoice-billing__stat">
            <span className="invoice-billing__stat-label">Retainer</span>
            <strong>{retainerCount}</strong>
          </div>
          <div className="invoice-billing__stat">
            <span className="invoice-billing__stat-label">Recorded total</span>
            <strong>{formatCurrency(totals)}</strong>
          </div>
        </div>
      </section>

      <section className="panel invoice-billing__creators" aria-label="Create invoices">
        <h3>Create invoice</h3>
        <ul className="invoice-billing__creator-grid">
          {INVOICE_CREATORS.map((item) => (
            <li key={item.sheetKey} className="hub-worksheet-card hub-worksheet-card--clickable">
              <Link href={`/workspace/${clientId}/analyst-wizard/sheets/${item.sheetKey}`}>
                <p className="hub-worksheet-card__title">{item.title}</p>
                <p className="hub-worksheet-card__subtitle">{item.description}</p>
                <span className="invoice-billing__creator-cta">Open worksheet →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel invoice-billing__history" aria-label="Invoice history">
        <div className="invoice-billing__history-header">
          <h3>Invoice history</h3>
          <p className="invoice-billing__history-note">
            Each row is a saved run from the analyst invoice worksheets. Download PDF to send to the client.
          </p>
        </div>
        <InvoiceRunSummary clientId={clientId} runs={runs} />
      </section>
    </div>
  );
}

function InvoicePdfButton({ clientId, invoiceType, inputs, runId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setLoading(true);
    setError('');
    try {
      await downloadInvoicePdf({
        clientId,
        invoiceType,
        inputs,
        runId,
        filename: `bms-${invoiceType}-invoice-${runId.slice(0, 8)}.pdf`,
      });
    } catch (err) {
      setError(err.message || 'PDF failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="invoice-billing__pdf-wrap">
      <button type="button" className="tab" disabled={loading} onClick={handleDownload}>
        {loading ? 'PDF…' : 'PDF'}
      </button>
      {error ? <span className="invoice-billing__pdf-error">{error}</span> : null}
    </span>
  );
}

/**
 * @param {{
 *   clientId: string,
 *   runs: Array<Record<string, unknown>>,
 * }} props
 */
function InvoiceRunSummary({ clientId, runs }) {
  if (!runs.length) {
    return <p className="invoice-billing__empty">No saved invoices yet.</p>;
  }

  return (
    <ul className="invoice-billing__runs">
      {runs.map((run) => {
        const invoiceType = run.invoice_type === 'retainer' ? 'retainer' : 'consultation';
        const inputs = run.inputs && typeof run.inputs === 'object' ? run.inputs : {};
        const summary = summarizeInvoiceRun(invoiceType, inputs);
        const sheetKey = getInvoiceSheetKey(invoiceType);
        const title = getInvoiceTitle(invoiceType);

        return (
          <li key={String(run.id)} className="invoice-billing__run">
            <div className="invoice-billing__run-main">
              <p className="invoice-billing__run-title">{title}</p>
              <p className="invoice-billing__run-meta">
                {summary.invoiceDate} · Saved {formatRelativeDate(run.created_at)}
                {summary.headline ? ` · ${summary.headline}` : ''}
              </p>
            </div>
            <div className="invoice-billing__run-amount">{formatCurrency(summary.amount)}</div>
            <div className="invoice-billing__run-actions">
              {sheetKey ? (
                <Link href={`/workspace/${clientId}/analyst-wizard/sheets/${sheetKey}`} className="tab">
                  Open
                </Link>
              ) : null}
              <InvoicePdfButton
                clientId={clientId}
                invoiceType={invoiceType}
                inputs={inputs}
                runId={String(run.id)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
