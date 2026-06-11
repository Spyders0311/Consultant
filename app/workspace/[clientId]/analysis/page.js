import AnalysisPanel from '@/components/AnalysisPanel';
import ResourceLibrary from '@/components/ResourceLibrary';
import SpreadsheetPortRoadmap from '@/components/SpreadsheetPortRoadmap';
import { getResourceSection } from '@/lib/bmsResourceCatalog';
import Link from 'next/link';

export default async function WorkspaceAnalysisPage({ params }) {
  const { clientId } = await params;
  const section = getResourceSection('analysis', clientId);

  return (
    <>
      <section className="panel">
        <h2>Analysis</h2>
        <p>
          Analysis worksheet. Enter the core financial inputs for this client. Proprietary math stays server-side for IP
          protection.
        </p>
        <AnalysisPanel />
      </section>

      <section className="panel">
        <h2>Priority Financial Tools</h2>
        <p>Start with the high-value workbook ports from the canonical source pass.</p>
        <div className="resource-card-grid">
          <Link href={`/workspace/${clientId}/analyst-wizard/sheets/weekly-cash-flow`} className="resource-card resource-card-link">
            <span className="resource-status resource-status-live">Live</span>
            <h4>Weekly Cash Flow Forecast</h4>
            <p className="resource-path">Ported from F-900b Cash Flow Spreadsheet.xls</p>
            <div className="resource-meta">
              <span>Cash timing</span>
              <span>LOC usage</span>
              <span>Saved runs</span>
            </div>
          </Link>
          <Link
            href={`/workspace/${clientId}/analyst-wizard/sheets/cash-flow-forecast-worksheet`}
            className="resource-card resource-card-link"
          >
            <span className="resource-status resource-status-live">Live</span>
            <h4>Cash Flow Forecast Worksheet</h4>
            <p className="resource-path">Ported from F-900a Cash Flow Forecast worksheet.xls</p>
            <div className="resource-meta">
              <span>A/R activity</span>
              <span>A/P activity</span>
              <span>Saved runs</span>
            </div>
          </Link>
          <Link
            href={`/workspace/${clientId}/analyst-wizard/sheets/flexible-budget-variance`}
            className="resource-card resource-card-link"
          >
            <span className="resource-status resource-status-live">Live</span>
            <h4>Flexible Budget / Variance</h4>
            <p className="resource-path">Ported from F-700d Advanced Flex Budget Example - 2019.xls</p>
            <div className="resource-meta">
              <span>Budget vs actual</span>
              <span>Variance</span>
              <span>Saved runs</span>
            </div>
          </Link>
          <Link
            href={`/workspace/${clientId}/analyst-wizard/sheets/flex-budget-worksheet`}
            className="resource-card resource-card-link"
          >
            <span className="resource-status resource-status-live">Live</span>
            <h4>Flex Budget Worksheet</h4>
            <p className="resource-path">Ported from F-700a Flex Budget Worksheet.xlsx</p>
            <div className="resource-meta">
              <span>Annual budget</span>
              <span>Monthly average</span>
              <span>Saved runs</span>
            </div>
          </Link>
          <Link
            href={`/workspace/${clientId}/analyst-wizard/sheets/dashboard-gantt-chart`}
            className="resource-card resource-card-link"
          >
            <span className="resource-status resource-status-live">Live</span>
            <h4>Dashboard Gantt Chart</h4>
            <p className="resource-path">Ported from F-1600d Dashboard Gantt-Chart.xlsx</p>
            <div className="resource-meta">
              <span>Tasks</span>
              <span>Progress</span>
              <span>Issues</span>
            </div>
          </Link>
        </div>
      </section>

      <SpreadsheetPortRoadmap resources={section.resources} />

      <section className="panel">
        <ResourceLibrary section={section} />
      </section>
    </>
  );
}
