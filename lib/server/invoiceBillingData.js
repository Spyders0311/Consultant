const CLIENT_SELECT =
  'id, company_name, primary_contact_name, primary_contact_email, primary_contact_phone, location_city, location_state, ein, address_line1, address_line2, address_postal_code';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} clientId
 * @param {string} consultantId
 */
export async function getInvoiceBillingData(supabase, clientId, consultantId) {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select(CLIENT_SELECT)
    .eq('id', clientId)
    .eq('consultant_id', consultantId)
    .maybeSingle();

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (!client) {
    return null;
  }

  const { data: runs, error: runsError } = await supabase
    .from('client_form_document_runs')
    .select('id, created_at, form_type, invoice_type, inputs, outputs')
    .eq('client_id', clientId)
    .eq('form_type', 'invoice')
    .order('created_at', { ascending: false })
    .limit(50);

  if (runsError) {
    throw new Error(runsError.message);
  }

  return {
    client,
    runs: runs || [],
  };
}
