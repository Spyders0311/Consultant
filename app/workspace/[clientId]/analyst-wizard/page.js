import Link from 'next/link';
import CriticalWorkbookCoverage from '@/components/CriticalWorkbookCoverage';
import ResourceLibrary from '@/components/ResourceLibrary';
import { getResourceSection } from '@/lib/bmsResourceCatalog';
import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';

export default async function WorkspaceAnalystWizardPage({ params }) {
  const { clientId } = await params;
  const section = getResourceSection('analyst-wizard', clientId);
  const wizardSheets = worksheetCatalog.filter((entry) => entry.category === 'analyst-wizard');
  const coreSheets = wizardSheets.filter((entry) => entry.priorityRank > 0);
  const otherSheets = wizardSheets.filter((entry) => entry.priorityRank <= 0);

  return (
    <section className="panel worksheet-picker">
      <h2>Analyst Wizard Worksheets</h2>
      <p>Select a worksheet to continue. Core worksheets are listed first.</p>

      <ul className="worksheet-list">
        <li>
          <Link href={`/workspace/${clientId}/analyst-wizard/guided-intake`} className="worksheet-link worksheet-link-core">
            Guided Intake Wizard
          </Link>
        </li>
      </ul>

      {coreSheets.length > 0 ? <h3>Core worksheets</h3> : null}
      <ul className="worksheet-list">
        {coreSheets.map((entry) => (
          <li key={entry.key}>
            <Link
              href={`/workspace/${clientId}/analyst-wizard/sheets/${entry.key}`}
              className="worksheet-link worksheet-link-core"
            >
              {entry.sheetName}
            </Link>
          </li>
        ))}
      </ul>

      {otherSheets.length > 0 ? <h3>All worksheets</h3> : null}
      <ul className="worksheet-list">
        {otherSheets.map((entry) => (
          <li key={entry.key}>
            <Link href={`/workspace/${clientId}/analyst-wizard/sheets/${entry.key}`} className="worksheet-link">
              {entry.sheetName}
            </Link>
          </li>
        ))}
      </ul>

      <div className="resource-library-divider" />
      <CriticalWorkbookCoverage clientId={clientId} />
      <div className="resource-library-divider" />
      <ResourceLibrary section={section} compact />
    </section>
  );
}
