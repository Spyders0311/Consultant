/** @typedef {'consultation' | 'retainer'} InvoiceType */

const INVOICE_TITLES = {
  consultation: 'Initial Consultation Invoice',
  retainer: 'PS Retainer Invoice',
};

const SHEET_KEY_BY_INVOICE_TYPE = {
  consultation: 'initial-consultation-invoice',
  retainer: 'ps-retainer-invoice',
};

function cleanText(value) {
  return String(value ?? '').trim();
}

/**
 * @param {Record<string, unknown>|null|undefined} client
 */
export function formatClientBillTo(client) {
  if (!client) {
    return { companyName: 'Client', lines: [], contact: '' };
  }

  const cityState = [client.location_city, client.location_state].filter(Boolean).join(', ');
  const postal = cleanText(client.address_postal_code);
  const cityLine = [cityState, postal].filter(Boolean).join(' ');

  const lines = [
    cleanText(client.address_line1),
    cleanText(client.address_line2),
    cityLine,
  ].filter(Boolean);

  const contactParts = [
    cleanText(client.primary_contact_name),
    cleanText(client.primary_contact_email),
    cleanText(client.primary_contact_phone),
  ].filter(Boolean);

  return {
    companyName: cleanText(client.company_name) || 'Client',
    lines,
    contact: contactParts.join(' · '),
    ein: cleanText(client.ein),
  };
}

/**
 * @param {InvoiceType} invoiceType
 * @param {Record<string, unknown>} inputs
 */
export function resolveInvoiceAmount(invoiceType, inputs = {}) {
  if (invoiceType === 'retainer') {
    const amount = Number(inputs.retainerAmount);
    return Number.isFinite(amount) ? amount : null;
  }

  const explicit = Number(inputs.amount);
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }

  const hours = Number(inputs.hours);
  const rate = Number(inputs.rate);
  if (Number.isFinite(hours) && Number.isFinite(rate)) {
    return hours * rate;
  }

  return null;
}

/**
 * @param {InvoiceType} invoiceType
 */
export function getInvoiceTitle(invoiceType) {
  return INVOICE_TITLES[invoiceType] || 'Invoice';
}

/**
 * @param {InvoiceType} invoiceType
 */
export function getInvoiceSheetKey(invoiceType) {
  return SHEET_KEY_BY_INVOICE_TYPE[invoiceType] || null;
}

/**
 * @param {unknown} value
 */
export function formatInvoiceDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return cleanText(value);
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * @param {InvoiceType} invoiceType
 * @param {Record<string, unknown>} inputs
 */
export function summarizeInvoiceRun(invoiceType, inputs = {}) {
  const amount = resolveInvoiceAmount(invoiceType, inputs);
  const invoiceDate = formatInvoiceDate(inputs.invoiceDate) || '—';

  if (invoiceType === 'retainer') {
    return {
      headline: cleanText(inputs.retainerPeriod) || 'Retainer',
      invoiceDate,
      amount,
      detail: cleanText(inputs.notes),
    };
  }

  return {
    headline: cleanText(inputs.serviceDescription) || 'Consulting services',
    invoiceDate,
    amount,
    detail: [inputs.hours, inputs.rate].every((v) => v !== '' && v != null)
      ? `${inputs.hours} hrs @ ${inputs.rate}`
      : '',
  };
}

/**
 * @param {{ invoiceType: InvoiceType, inputs: Record<string, unknown>, client?: Record<string, unknown>|null }} payload
 */
export function validateInvoicePdfPayload(payload) {
  const invoiceType = payload?.invoiceType;
  if (invoiceType !== 'consultation' && invoiceType !== 'retainer') {
    throw new Error('Invalid invoice type.');
  }

  const inputs = payload?.inputs;
  if (!inputs || typeof inputs !== 'object') {
    throw new Error('Missing invoice inputs.');
  }

  const amount = resolveInvoiceAmount(invoiceType, inputs);
  if (amount === null || amount <= 0) {
    throw new Error('Invoice amount is required.');
  }

  if (!payload?.client) {
    throw new Error('Client billing profile is required.');
  }
}
