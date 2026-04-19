import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    .from('client_breakeven_runs')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to save breakeven run.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
