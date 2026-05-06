import ResourceLibrary from '@/components/ResourceLibrary';
import { getResourceSection } from '@/lib/bmsResourceCatalog';

export default async function WorkspaceMarketingPage({ params }) {
  const { clientId } = await params;
  const section = getResourceSection('marketing', clientId);

  return (
    <section className="panel">
      <h2>Marketing</h2>
      <p>
        Capture positioning, campaigns, channel mix, sales pipeline, pricing, and top-of-funnel assumptions for this
        client.
      </p>
      <ResourceLibrary section={section} compact />
    </section>
  );
}
