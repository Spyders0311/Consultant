import ResourceLibrary from '@/components/ResourceLibrary';
import { getResourceSection } from '@/lib/bmsResourceCatalog';

export default async function WorkspaceConsultingPage({ params }) {
  const { clientId } = await params;
  const section = getResourceSection('consulting', clientId);

  return (
    <section className="panel">
      <h2>Consulting</h2>
      <p>
        Track the engagement plan, deliverables, milestones, management tools, and operating procedures specific to this
        client workspace.
      </p>
      <ResourceLibrary section={section} compact />
    </section>
  );
}
