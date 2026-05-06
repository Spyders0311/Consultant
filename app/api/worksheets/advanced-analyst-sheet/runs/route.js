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
  const sheetKey = searchParams.get('sheet_key') || searchParams.get('sheetKey');
  if (!clientId || !sheetKey) {
    return NextResponse.json({ ok: false, error: 'Missing client_id or sheet_key.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('client_advanced_analyst_sheet_runs')
    .select('id, created_at, sheet_key, inputs, outputs')
    .eq('client_id', clientId)
    .eq('sheet_key', sheetKey)
    .order('created_at', { ascending: false })
    .limit(parseLimit(searchParams.get('limit')));

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to load advanced analyst sheet runs.' },
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
  const sheetKey = payload?.sheet_key || payload?.sheetKey;
  if (!clientId || !sheetKey) {
    return NextResponse.json({ ok: false, error: 'Missing client_id or sheet_key.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('client_advanced_analyst_sheet_runs')
    .insert({
      client_id: clientId,
      sheet_key: sheetKey,
      inputs: payload?.inputs || {},
      outputs: payload?.outputs || null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to save advanced analyst sheet run.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
