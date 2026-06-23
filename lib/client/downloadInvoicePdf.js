/**
 * Request an invoice PDF and trigger a browser download.
 *
 * @param {{
 *   clientId: string,
 *   invoiceType: 'consultation' | 'retainer',
 *   inputs: Record<string, unknown>,
 *   runId?: string,
 *   filename?: string,
 * }} options
 */
export async function downloadInvoicePdf({ clientId, invoiceType, inputs, runId, filename }) {
  const response = await fetch('/api/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportType: 'invoice',
      clientId,
      invoiceType,
      inputs,
      runId: runId || null,
    }),
  });

  if (!response.ok) {
    let message = 'Unable to generate invoice PDF.';
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data?.error) message = data.error;
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `bms-invoice-${invoiceType}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
