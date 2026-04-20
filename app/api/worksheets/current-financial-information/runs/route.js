import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function parseLimit(rawLimit) {
  const parsed = Number.parseInt(rawLimit || '10', 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(Math.max(parsed, 1), 50);
}

export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id') || searchParams.get('clientId');
  if (!clientId) {
    return NextResponse.json({ ok: false, error: 'Missing client_id.' }, { status: 400 });
  }

  const limit = parseLimit(searchParams.get('limit'));

  const { data, error } = await supabase
    .from('client_current_financial_information_runs')
    .select('id, created_at, inputs, outputs')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to load current financial information runs.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, runs: data || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const clientId = payload?.client_id || payload?.clientId;
  if (!clientId) {
    return NextResponse.json({ ok: false, error: 'Missing client_id.' }, { status: 400 });
  }

  const insertPayload = {
    client_id: clientId,
    inputs: payload?.inputs || {},
    outputs: payload?.outputs || null,
  };

  const { data, error } = await supabase
    .from('client_current_financial_information_runs')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to save current financial information run.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
