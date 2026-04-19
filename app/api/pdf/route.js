import { NextResponse } from 'next/server';
import { buildResultsPdf } from '@/lib/server/pdf';
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
    const model = body?.model;
    const result = body?.result;

    if (!model || !result) {
      return NextResponse.json({ ok: false, error: 'Missing model/result payload' }, { status: 400 });
    }

    const consultant = {
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'Consultant',
      email: user.email || '',
      phone: user.user_metadata?.phone || user.user_metadata?.phone_number || '',
    };

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
