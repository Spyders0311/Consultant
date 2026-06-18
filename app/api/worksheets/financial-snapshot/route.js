import { createClient } from '@/lib/supabase/server';
import { getFinancialSnapshot, patchFinancialSnapshot } from '@/lib/server/financialSnapshot';

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
  if (!clientId) {
    return Response.json({ ok: false, error: 'Missing client_id.' }, { status: 400 });
  }

  const data = await getFinancialSnapshot(clientId);
  return Response.json({ ok: true, ...data });
}

export async function PATCH(request) {
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

  const clientId = payload?.clientId || payload?.client_id;
  const source = payload?.source || 'worksheet';
  const fields = payload?.fields || {};
  if (!clientId) {
    return Response.json({ ok: false, error: 'Missing clientId.' }, { status: 400 });
  }

  await patchFinancialSnapshot(clientId, source, fields);
  const data = await getFinancialSnapshot(clientId);
  return Response.json({ ok: true, ...data });
}
