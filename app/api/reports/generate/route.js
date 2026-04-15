import { NextResponse } from 'next/server';
import { buildReportPdf } from '../../../../lib/reportPdf';

export async function POST(request) {
  try {
    const body = await request.json();
    const pdfBytes = await buildReportPdf(body);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="bms-report.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Report generation failed.' },
      { status: 400 }
    );
  }
}
