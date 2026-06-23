import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInvoicePdf } from '../server/pdf.js';
import {
  resolveInvoiceAmount,
  summarizeInvoiceRun,
  validateInvoicePdfPayload,
} from '../worksheets/invoiceDocumentModel.js';

const sampleClient = {
  company_name: 'Acme Manufacturing',
  primary_contact_name: 'Jane Owner',
  primary_contact_email: 'jane@acme.example',
  primary_contact_phone: '555-0100',
  address_line1: '100 Industrial Way',
  location_city: 'Austin',
  location_state: 'TX',
  address_postal_code: '78701',
  ein: '12-3456789',
};

test('resolveInvoiceAmount uses hours * rate when amount omitted', () => {
  assert.equal(resolveInvoiceAmount('consultation', { hours: 2, rate: 150 }), 300);
  assert.equal(resolveInvoiceAmount('consultation', { amount: 400, hours: 2, rate: 150 }), 400);
  assert.equal(resolveInvoiceAmount('retainer', { retainerAmount: 5000 }), 5000);
});

test('validateInvoicePdfPayload rejects missing amount', () => {
  assert.throws(
    () =>
      validateInvoicePdfPayload({
        invoiceType: 'consultation',
        inputs: { serviceDescription: 'Consulting' },
        client: sampleClient,
      }),
    /amount/i,
  );
});

test('buildInvoicePdf returns a PDF buffer for consultation invoice', async () => {
  validateInvoicePdfPayload({
    invoiceType: 'consultation',
    inputs: {
      invoiceDate: '2026-06-18',
      serviceDescription: 'Initial consultation',
      hours: 2,
      rate: 175,
    },
    client: sampleClient,
  });

  const buffer = await buildInvoicePdf({
    invoiceType: 'consultation',
    inputs: {
      invoiceDate: '2026-06-18',
      serviceDescription: 'Initial consultation',
      hours: 2,
      rate: 175,
    },
    client: sampleClient,
    consultant: { name: 'Test Consultant', email: 'test@example.com' },
    runId: 'abc12345-0000-0000-0000-000000000000',
  });

  assert.ok(buffer instanceof Uint8Array || Buffer.isBuffer(buffer));
  assert.equal(String.fromCharCode(...buffer.slice(0, 4)), '%PDF');
});

test('summarizeInvoiceRun formats consultation headline', () => {
  const summary = summarizeInvoiceRun('consultation', {
    invoiceDate: '2026-06-18',
    serviceDescription: 'Discovery session',
    hours: 3,
    rate: 200,
  });

  assert.equal(summary.headline, 'Discovery session');
  assert.equal(summary.amount, 600);
});
