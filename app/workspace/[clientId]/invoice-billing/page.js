import ResourceLibrary from '@/components/ResourceLibrary';
import { getResourceSection } from '@/lib/bmsResourceCatalog';

export default async function WorkspaceInvoiceBillingPage({ params }) {
  const { clientId } = await params;
  const section = getResourceSection('invoice-billing', clientId);

  return (
    <section className="panel">
      <h2>Invoice / Billing</h2>
      <p>
        Maintain billing details, invoice history, payment status, AR follow-up, expenses, and payment method resources
        for this client.
      </p>
      <ResourceLibrary section={section} compact />
    </section>
  );
}
