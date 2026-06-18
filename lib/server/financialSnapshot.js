import { createClient } from '@/lib/supabase/server';

export async function patchFinancialSnapshot(clientId, source, fields) {
  if (!clientId || !fields || Object.keys(fields).length === 0) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('client_financial_snapshots')
    .select('snapshot, provenance')
    .eq('client_id', clientId)
    .maybeSingle();

  const snapshot = { ...(existing?.snapshot || {}), ...fields };
  const provenance = { ...(existing?.provenance || {}) };
  const stampedAt = new Date().toISOString();
  for (const key of Object.keys(fields)) {
    provenance[key] = { source, at: stampedAt };
  }

  await supabase.from('client_financial_snapshots').upsert(
    {
      client_id: clientId,
      snapshot,
      provenance,
    },
    { onConflict: 'client_id' },
  );
}

export async function getFinancialSnapshot(clientId) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('client_financial_snapshots')
    .select('snapshot, provenance, updated_at')
    .eq('client_id', clientId)
    .maybeSingle();
  return data || { snapshot: {}, provenance: {}, updated_at: null };
}
