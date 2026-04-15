import { NextResponse } from 'next/server';
import { buildResultsPdf } from '@/lib/server/pdf';

export async function POST(req) {
  try {
    const body = await req.json();
    const model = body?.model;
    const result = body?.result;

    if (!model || !result) {
      return NextResponse.json({ ok: false, error: 'Missing model/result payload' }, { status: 400 });
    }

    const buffer = await buildResultsPdf({ model, result });

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
