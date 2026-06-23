import { redirect } from 'next/navigation';
import InvoiceBillingWorkspace from '@/components/invoice/InvoiceBillingWorkspace';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';
import { getInvoiceBillingData } from '@/lib/server/invoiceBillingData';

export default async function WorkspaceInvoiceBillingPage({ params }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!isConsultant(user)) {
    redirect('/login?error=unauthorized');
  }

  const { clientId } = await params;
  const data = await getInvoiceBillingData(supabase, clientId, user.id);

  if (!data) {
    redirect('/dashboard/clients');
  }

  return (
    <InvoiceBillingWorkspace
      clientId={clientId}
      clientName={data.client.company_name || 'Untitled client'}
      runs={data.runs}
    />
  );
}
