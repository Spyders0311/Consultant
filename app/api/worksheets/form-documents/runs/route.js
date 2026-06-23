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
  const formType = searchParams.get('form_type') || searchParams.get('formType');
  const invoiceType = searchParams.get('invoice_type') || searchParams.get('invoiceType');
  if (!clientId) return Response.json({ ok: false, error: 'Missing client_id.' }, { status: 400 });

  let query = supabase
    .from('client_form_document_runs')
    .select('id, created_at, form_type, invoice_type, inputs, outputs')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(parseLimit(searchParams.get('limit')));
  if (formType) query = query.eq('form_type', formType);
  if (invoiceType) query = query.eq('invoice_type', invoiceType);

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
  const formType = payload?.form_type || payload?.formType;
  if (!clientId || !formType) {
    return Response.json({ ok: false, error: 'Missing client_id or form_type.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('client_form_document_runs')
    .insert({
      client_id: clientId,
      form_type: formType,
      invoice_type: payload?.invoice_type || payload?.invoiceType || null,
      inputs: payload?.inputs || {},
      outputs: payload?.outputs || null,
    })
    .select('id')
    .single();

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data.id });
}
