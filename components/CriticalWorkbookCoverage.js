import Link from 'next/link';
import criticalWorkbookAnalysis from '@/knowledge/workbooks/critical_workbooks_analysis.json';
import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';

const implementedWorksheetKeys = new Set([
  'basic-client-info',
  'breakeven-analysis',
  'working-capital-analysis',
  'p-l-comparisons',
  'balance-sht-comparisons',
  'current-financial-information',
  '5-year-projections',
]);

function workbookName(path) {
  return String(path || '').split('/').pop() || path;
}

function worksheetKeyByName() {
  return new Map(worksheetCatalog.map((entry) => [String(entry.sheetName).toLowerCase(), entry]));
}

function coverageForAnalystProgram(workbook, clientId) {
  const byName = worksheetKeyByName();

  return (workbook.sheetNames || []).map((sheetName) => {
    const entry = byName.get(String(sheetName).toLowerCase());
    const isLive = entry && implementedWorksheetKeys.has(entry.key);

    return {
      sheetName,
      key: entry?.key || null,
      status: isLive ? 'Live' : entry ? 'Cataloged' : 'Source only',
      href: isLive ? `/workspace/${clientId}/analyst-wizard/sheets/${entry.key}` : null,
    };
  });
}

export default function CriticalWorkbookCoverage({ clientId }) {
  const breakevenWorkbook = criticalWorkbookAnalysis.workbooks.find((workbook) =>
    workbook.path.includes('Breakeven Analysis Tool'),
  );
  const analystWorkbook = criticalWorkbookAnalysis.workbooks.find((workbook) => workbook.path.includes('Analyst Program'));
  const coverage = analystWorkbook ? coverageForAnalystProgram(analystWorkbook, clientId) : [];
  const liveSheets = coverage.filter((entry) => entry.status === 'Live');
  const topFormulaSheets = (analystWorkbook?.topSheets || []).slice(0, 8);
  const macroProcedures = (analystWorkbook?.macros?.modules || [])
    .flatMap((module) => module.procedures.map((procedure) => procedure.name))
    .slice(0, 12);

  return (
    <section className="critical-workbooks">
      <div className="critical-workbook-header">
        <p className="eyebrow">Critical source workbooks</p>
        <h3>Parsed and Reconciled With the Website</h3>
        <p>
          The standalone Breakeven workbook is now represented by the Breakeven workflow. The Analyst Program workbook
          remains the master manifest; its core sheets are either live workflows or cataloged source worksheets.
        </p>
      </div>

      <div className="critical-workbook-grid">
        {breakevenWorkbook ? (
          <article>
            <span className="resource-status resource-status-live">Live</span>
            <h4>{workbookName(breakevenWorkbook.path)}</h4>
            <p>
              {breakevenWorkbook.sheetCount} sheets · {breakevenWorkbook.totalFormulaCount.toLocaleString()} formulas ·
              no VBA macros detected
            </p>
            <Link href={`/workspace/${clientId}/analyst-wizard/sheets/breakeven-analysis`}>Open Breakeven workflow</Link>
          </article>
        ) : null}

        {analystWorkbook ? (
          <article>
            <span className="resource-status resource-status-live">{liveSheets.length} Live</span>
            <h4>{workbookName(analystWorkbook.path)}</h4>
            <p>
              {analystWorkbook.sheetCount} sheets · {analystWorkbook.totalFormulaCount.toLocaleString()} formulas ·{' '}
              {analystWorkbook.macros?.procedureCount || 0} VBA procedures parsed
            </p>
            <div className="critical-live-links">
              {liveSheets.map((sheet) => (
                <Link href={sheet.href} key={sheet.key}>
                  {sheet.sheetName}
                </Link>
              ))}
            </div>
          </article>
        ) : null}
      </div>

      <div className="critical-workbook-detail-grid">
        <article>
          <h4>Next Formula-Heavy Sheets</h4>
          <ul>
            {topFormulaSheets.map((sheet) => (
              <li key={sheet.name}>
                {sheet.name}: {sheet.formulaCount.toLocaleString()} formulas
              </li>
            ))}
          </ul>
        </article>

        <article>
          <h4>Macro Behavior Summary</h4>
          <p>Parsed macros are mostly navigation, button handlers, print actions, and guided cell selection.</p>
          <ul>
            {macroProcedures.map((procedure) => (
              <li key={procedure}>{procedure}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
