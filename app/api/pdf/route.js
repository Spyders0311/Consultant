import { NextResponse } from 'next/server';
import { buildExecutiveAnalysisPdf, buildResultsPdf } from '@/lib/server/pdf';
import { validateExecutiveAnalysisPdfPayload } from '@/lib/reports/executiveAnalysisModel';
import { createClient } from '@/lib/supabase/server';

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
