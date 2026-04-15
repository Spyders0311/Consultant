import { NextResponse } from 'next/server';
import { calculateFcfeStableGrowth } from '@/lib/server/fcfe';

export async function POST(req) {
  try {
    const body = await req.json();
    const result = calculateFcfeStableGrowth(body || {});
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Calculation failed' },
      { status: 400 },
    );
  }
}
