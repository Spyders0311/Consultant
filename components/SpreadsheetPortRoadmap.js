import Link from 'next/link';

function candidateScore(resource) {
  if (resource.status === 'Live') return 0;
  if (resource.porting?.priority === 'next') return 1;
  if (resource.porting?.priority === 'candidate') return 2;
  return 3;
}

export default function SpreadsheetPortRoadmap({ resources }) {
  const candidates = (resources || [])
    .filter((resource) => resource.kind === 'Workbook' && ['Live', 'Port Next', 'Ready to Port'].includes(resource.status))
    .sort((left, right) => candidateScore(left) - candidateScore(right) || left.title.localeCompare(right.title))
    .slice(0, 8);

  if (!candidates.length) return null;

  return (
    <section className="panel spreadsheet-roadmap">
      <div className="spreadsheet-roadmap-header">
        <div>
          <p className="eyebrow">Spreadsheet workflow pipeline</p>
          <h2>High-Value Workbook Ports</h2>
          <p>
            These workbooks are selected from the canonical catalog. Live items already run through app workflows; next
            items should be rebuilt from their extracted manifests into reviewed server-side calculations with saved
            client runs.
          </p>
        </div>
      </div>

      <div className="spreadsheet-roadmap-grid">
        {candidates.map((resource) => (
          <article key={resource.id} className="spreadsheet-roadmap-card">
            <span className={`resource-status resource-status-${resource.status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
              {resource.status}
            </span>
            <h3>{resource.href ? <Link href={resource.href}>{resource.title}</Link> : resource.title}</h3>
            <p>{resource.relPath}</p>
            <div className="resource-meta">
              {(resource.metrics || []).slice(0, 5).map((metric) => (
                <span key={metric}>{metric}</span>
              ))}
            </div>
            {resource.preview?.sheets?.length ? (
              <ul className="spreadsheet-roadmap-sheets">
                {resource.preview.sheets.slice(0, 3).map((sheet) => (
                  <li key={`${resource.id}-${sheet.name}`}>
                    {sheet.name}
                    {sheet.formulaCount ? ` · ${sheet.formulaCount.toLocaleString()} formulas` : ''}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
