import { NextResponse } from 'next/server';

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://127.0.0.1:8001';
const ENGINE_CONFIG_ERROR =
  'Calculation engine not configured. Set PYTHON_ENGINE_URL in Vercel to your deployed Python engine URL.';

function isLocalEngineUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  } catch {
    return true;
  }
}

export async function POST(request) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isMissing = !process.env.PYTHON_ENGINE_URL;
  const isLocalOrDefault = isLocalEngineUrl(PYTHON_ENGINE_URL);

  if (isProduction && (isMissing || isLocalOrDefault)) {
    return NextResponse.json({ ok: false, error: ENGINE_CONFIG_ERROR }, { status: 500 });
  }

  try {
    const body = await request.json();

    const upstream = await fetch(`${PYTHON_ENGINE_URL}/api/v1/worksheets/weekly-cash-flow/calculate`, {
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
  } catch {
    if (isProduction && isLocalOrDefault) {
      return NextResponse.json({ ok: false, error: ENGINE_CONFIG_ERROR }, { status: 500 });
    }

    return NextResponse.json(
      { ok: false, error: 'Unable to reach calculation engine.' },
      { status: 502 },
    );
  }
}
