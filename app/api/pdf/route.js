import { NextResponse } from 'next/server';
import { buildExecutiveAnalysisPdf, buildInvoicePdf, buildResultsPdf } from '@/lib/server/pdf';
import { validateExecutiveAnalysisPdfPayload } from '@/lib/reports/executiveAnalysisModel';
import { validateInvoicePdfPayload } from '@/lib/worksheets/invoiceDocumentModel';
import { createClient } from '@/lib/supabase/server';

const CLIENT_INVOICE_SELECT =
  'id, company_name, primary_contact_name, primary_contact_email, primary_contact_phone, location_city, location_state, ein, address_line1, address_line2, address_postal_code';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const reportType = body?.reportType;

    const consultant = {
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'Consultant',
      email: user.email || '',
      phone: user.user_metadata?.phone || user.user_metadata?.phone_number || '',
    };

    if (reportType === 'executive-analysis') {
      const report = body?.result;
      try {
        validateExecutiveAnalysisPdfPayload(report);
      } catch (validationError) {
        return NextResponse.json(
          { ok: false, error: validationError instanceof Error ? validationError.message : 'Invalid payload.' },
          { status: 400 },
        );
      }

      const buffer = await buildExecutiveAnalysisPdf({
        report,
        consultant,
        clientName: body?.clientName || report.companyName,
      });

      const slug = String(body?.clientName || report.companyName)
        .replace(/\s+/g, '-')
        .toLowerCase();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${slug}-executive-analysis.pdf"`,
        },
      });
    }

    if (reportType === 'invoice') {
      const clientId = body?.clientId || body?.client_id;
      const invoiceType = body?.invoiceType || body?.invoice_type;
      const inputs = body?.inputs;

      if (!clientId) {
        return NextResponse.json({ ok: false, error: 'Missing clientId.' }, { status: 400 });
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(CLIENT_INVOICE_SELECT)
        .eq('id', clientId)
        .eq('consultant_id', user.id)
        .maybeSingle();

      if (clientError) {
        return NextResponse.json({ ok: false, error: clientError.message }, { status: 500 });
      }

      if (!client) {
        return NextResponse.json({ ok: false, error: 'Client not found.' }, { status: 404 });
      }

      try {
        validateInvoicePdfPayload({ invoiceType, inputs, client });
      } catch (validationError) {
        return NextResponse.json(
          { ok: false, error: validationError instanceof Error ? validationError.message : 'Invalid payload.' },
          { status: 400 },
        );
      }

      const buffer = await buildInvoicePdf({
        invoiceType,
        inputs,
        client,
        consultant,
        runId: body?.runId || body?.run_id || null,
      });

      const slug = String(client.company_name || 'client')
        .replace(/\s+/g, '-')
        .toLowerCase();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${slug}-${invoiceType}-invoice.pdf"`,
        },
      });
    }

    const model = body?.model;
    const result = body?.result;

    if (!model || !result) {
      return NextResponse.json({ ok: false, error: 'Missing model/result payload' }, { status: 400 });
    }

    const buffer = await buildResultsPdf({ model, result, consultant });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bms-${model}-report.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'PDF generation failed' },
      { status: 400 },
    );
  }
}
