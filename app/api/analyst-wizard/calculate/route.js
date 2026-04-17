import { NextResponse } from 'next/server';

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://127.0.0.1:8001';

export async function POST(request) {
  try {
    const body = await request.json();

    const upstream = await fetch(`${PYTHON_ENGINE_URL}/api/v1/analyst/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      cache: 'no-store',
    });

    const data = await upstream.json();
    if (!upstream.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || 'Python engine rejected calculation.' },
        { status: upstream.status || 400 },
      );
    }

    return NextResponse.json({ ok: true, result: data.result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Unable to reach calculation engine.' },
      { status: 502 },
    );
  }
}
