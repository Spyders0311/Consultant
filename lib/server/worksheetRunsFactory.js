import { createClient } from '@/lib/supabase/server';

export function createWorksheetRunsHandlers(tableName, errorLabel) {
  function parseLimit(rawLimit) {
    const parsed = Number.parseInt(rawLimit || '10', 10);
    if (!Number.isFinite(parsed)) return 10;
    return Math.min(Math.max(parsed, 1), 50);
  }

  async function GET(request) {
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
    if (!clientId) {
      return Response.json({ ok: false, error: 'Missing client_id.' }, { status: 400 });
    }

    const limit = parseLimit(searchParams.get('limit'));
    const { data, error } = await supabase
      .from(tableName)
      .select('id, created_at, inputs, outputs')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return Response.json({ ok: false, error: error.message || `Failed to load ${errorLabel}.` }, { status: 500 });
    }

    return Response.json({ ok: true, runs: data || [] });
  }

  async function POST(request) {
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
    if (!clientId) {
      return Response.json({ ok: false, error: 'Missing client_id.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert({
        client_id: clientId,
        inputs: payload?.inputs || {},
        outputs: payload?.outputs || null,
      })
      .select('id')
      .single();

    if (error) {
      return Response.json({ ok: false, error: error.message || `Failed to save ${errorLabel}.` }, { status: 500 });
    }

    return Response.json({ ok: true, id: data.id });
  }

  return { GET, POST };
}
