import { NextResponse } from 'next/server';
import { calculateCapBudg } from '@/lib/server/capbudg';

export async function POST(req) {
  try {
    const body = await req.json();
    const result = calculateCapBudg(body || {});
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Calculation failed' },
      { status: 400 },
    );
  }
}
