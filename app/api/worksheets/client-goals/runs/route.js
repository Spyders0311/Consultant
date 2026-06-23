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
  if (authError || !user) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id') || searchParams.get('clientId');
  const goalType = searchParams.get('goal_type') || searchParams.get('goalType');
  if (!clientId) return Response.json({ ok: false, error: 'Missing client_id.' }, { status: 400 });

  let query = supabase
    .from('client_goals_runs')
    .select('id, created_at, goal_type, inputs, outputs')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(parseLimit(searchParams.get('limit')));
  if (goalType) query = query.eq('goal_type', goalType);

  const { data, error } = await query;
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, runs: data || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const clientId = payload?.client_id || payload?.clientId;
  const goalType = payload?.goal_type || payload?.goalType;
  if (!clientId || !goalType) {
    return Response.json({ ok: false, error: 'Missing client_id or goal_type.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('client_goals_runs')
    .insert({
      client_id: clientId,
      goal_type: goalType,
      inputs: payload?.inputs || {},
      outputs: payload?.outputs || null,
    })
    .select('id')
    .single();

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data.id });
}
