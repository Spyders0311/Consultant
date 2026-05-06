import ResourceLibrary from '@/components/ResourceLibrary';
import { getResourceSection } from '@/lib/bmsResourceCatalog';

export default async function WorkspaceBmsFormsPage({ params }) {
  const { clientId } = await params;
  const section = getResourceSection('bms-forms', clientId);

  return (
    <section className="panel">
      <h2>BMS Forms</h2>
      <p>
        Client-facing and internal forms that live alongside the rest of this workspace. Agreements and confidential
        templates are marked for review before they become customer-ready forms.
      </p>
      <ResourceLibrary section={section} compact />
    </section>
  );
}
