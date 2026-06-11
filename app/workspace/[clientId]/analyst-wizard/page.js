import Link from 'next/link';
import CriticalWorkbookCoverage from '@/components/CriticalWorkbookCoverage';
import ResourceLibrary from '@/components/ResourceLibrary';
import RecentRunsStrip from '@/components/hub/RecentRunsStrip';
import WorksheetHubList from '@/components/hub/WorksheetHubList';
import Icon from '@/components/ui/Icon';
import { getResourceSection } from '@/lib/bmsResourceCatalog';
import { getAllWorksheets, getWorksheetGroups } from '@/lib/worksheets/registry';

export default async function WorkspaceAnalystWizardPage({ params }) {
  const { clientId } = await params;
  const section = getResourceSection('analyst-wizard', clientId);

  const groups = getWorksheetGroups().map((group) => ({
    name: group.name,
    worksheets: group.worksheets.map(({ key, displayName, status, priorityRank }) => ({
      key,
      displayName,
      status,
      priorityRank,
    })),
  }));
  const sheetNames = Object.fromEntries(
    getAllWorksheets().map((entry) => [entry.key, entry.displayName]),
  );

  return (
    <>
      <section className="panel hub-header">
        <div>
          <p className="eyebrow">Analyst Program</p>
          <h2>Worksheets</h2>
          <p>
            Guided versions of the BMS analyst workbook. Live worksheets calculate server-side and
            save every run to this client&apos;s history.
          </p>
        </div>
        <Link href={`/workspace/${clientId}/analyst-wizard/guided-intake`} className="hub-cta">
          <span className="hub-cta-icon">
            <Icon name="play" size={18} />
          </span>
          <span>
            <strong>Start Guided Intake</strong>
            <span className="hub-cta-copy">
              Walk through company profile, financials, and assumptions in one flow.
            </span>
          </span>
          <Icon name="chevron-right" size={16} />
        </Link>
      </section>

      <RecentRunsStrip clientId={clientId} sheetNames={sheetNames} />

      <section className="panel">
        <WorksheetHubList clientId={clientId} groups={groups} />
      </section>

      <section className="panel">
        <CriticalWorkbookCoverage clientId={clientId} />
        <div className="resource-library-divider" />
        <ResourceLibrary section={section} compact />
      </section>
    </>
  );
}
