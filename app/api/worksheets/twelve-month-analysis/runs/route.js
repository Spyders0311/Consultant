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
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id') || searchParams.get('clientId');
  const analysisType = searchParams.get('analysis_type') || searchParams.get('analysisType');
  if (!clientId) {
    return Response.json({ ok: false, error: 'Missing client_id.' }, { status: 400 });
  }

  let query = supabase
    .from('client_twelve_month_analysis_runs')
    .select('id, created_at, analysis_type, inputs, outputs')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(parseLimit(searchParams.get('limit')));

  if (analysisType) {
    query = query.eq('analysis_type', analysisType);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ ok: false, error: error.message || 'Failed to load analysis runs.' }, { status: 500 });
  }

  return Response.json({ ok: true, runs: data || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const clientId = payload?.client_id || payload?.clientId;
  const analysisType = payload?.analysis_type || payload?.analysisType;
  if (!clientId || !analysisType) {
    return Response.json({ ok: false, error: 'Missing client_id or analysis_type.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('client_twelve_month_analysis_runs')
    .insert({
      client_id: clientId,
      analysis_type: analysisType,
      inputs: payload?.inputs || {},
      outputs: payload?.outputs || null,
    })
    .select('id')
    .single();

  if (error) {
    return Response.json({ ok: false, error: error.message || 'Failed to save analysis run.' }, { status: 500 });
  }

  return Response.json({ ok: true, id: data.id });
}
