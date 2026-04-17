import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';
import { normalizeClientPayload } from '@/lib/clients/globalColumns';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  if (!isConsultant(user)) {
    return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
  }

  let payload;
  try {
    payload = normalizeClientPayload(await request.json());
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({ consultant_id: user.id, ...payload })
    .select('id, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create client.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, client: data });
}
