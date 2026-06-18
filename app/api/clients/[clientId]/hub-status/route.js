import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientHubStatus } from '@/lib/server/hubStatus';

export async function GET(_request, { params }) {
  const { clientId } = await params;

  if (!clientId) {
    return NextResponse.json({ ok: false, error: 'Missing clientId.' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .maybeSingle();

  if (clientError) {
    return NextResponse.json(
      { ok: false, error: clientError.message || 'Failed to load client.' },
      { status: 500 },
    );
  }

  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client not found.' }, { status: 404 });
  }

  try {
    const result = await getClientHubStatus(clientId, supabase);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to load hub status.' },
      { status: 500 },
    );
  }
}
