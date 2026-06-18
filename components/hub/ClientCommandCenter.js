import Link from 'next/link';
import ContinueWhereLeftOff from '@/components/hub/ContinueWhereLeftOff';
import KpiCard from '@/components/hub/KpiCard';
import ProgressDonut from '@/components/hub/ProgressDonut';
import StatusDot from '@/components/hub/StatusDot';
import { formatRelativeDate } from '@/lib/hub/formatters';
import { isWorksheetHubNavigable } from '@/lib/worksheets/hubStatus';

/**
 * @param {{
 *   clientId: string,
 *   client: {
 *     company_name?: string,
 *     industry?: string,
 *     primary_contact_name?: string,
 *     primary_contact_email?: string,
 *     location_city?: string,
 *     location_state?: string,
 *   }|null,
 *   kpis: Array<{ label: string, value: string, hint?: string }>,
 *   coreItems: import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[],
 *   progressPercent: number,
 *   hubItems: import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[],
 *   recentItems: import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[],
 *   summary: { coreComplete: number, coreTotal: number, integratedCount: number, lastActivityAt?: string|null },
 * }} props
 */
export default function ClientCommandCenter({
  clientId,
  client,
  kpis,
  coreItems,
  progressPercent,
  hubItems,
  recentItems,
  summary,
}) {
  const location = [client?.location_city, client?.location_state].filter(Boolean).join(', ');
  const contact = client?.primary_contact_name || client?.primary_contact_email;

  return (
    <div className="workspace-hub command-center">
      <section className="command-center__client-strip" aria-label="Client overview">
        <div>
          <p className="command-center__client-label">Active engagement</p>
          <h2 className="command-center__client-name">{client?.company_name || 'Untitled client'}</h2>
          <dl className="command-center__client-meta">
            <div>
              <dt>Industry</dt>
              <dd>{client?.industry || '—'}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{location || '—'}</dd>
            </div>
            <div>
              <dt>Primary contact</dt>
              <dd>{contact || '—'}</dd>
            </div>
          </dl>
        </div>
        <div className="command-center__client-actions">
          <Link href={`/workspace/${clientId}/analyst-wizard`} className="command-center__hub-link">
            Open worksheet hub
          </Link>
        </div>
      </section>

      <section className="hub-kpi-strip" aria-label="Financial KPIs">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
        ))}
      </section>

      <div className="command-center__progress-block">
        <section className="hub-rail-panel command-center__progress-panel" aria-label="Core worksheet progress">
          <div className="command-center__progress-header">
            <div>
              <h2 className="hub-section-title">Analyst progress</h2>
              <p className="hub-section-subtitle">
                {summary.coreComplete} of {summary.coreTotal} core worksheets complete
              </p>
            </div>
            <ProgressDonut percent={progressPercent} label="Core worksheet progress" size={88} />
          </div>
          <ol className="command-center__core-list">
            {coreItems.map((item) => (
              <li key={item.worksheetKey}>
                <StatusDot status={item.status} label={`Core ${item.coreRank}: ${item.sheetName}`} />
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ContinueWhereLeftOff items={hubItems} clientId={clientId} />

      <section className="command-center__recent" aria-label="Recent worksheet activity">
        <div className="command-center__recent-header">
          <div>
            <h2 className="hub-section-title">Recent worksheets</h2>
            <p className="hub-section-subtitle">
              {summary.lastActivityAt
                ? `Last activity ${formatRelativeDate(summary.lastActivityAt)}`
                : 'No saved worksheet runs yet'}
            </p>
          </div>
          <Link href={`/workspace/${clientId}/analyst-wizard`} className="command-center__hub-link command-center__hub-link--inline">
            View all worksheets
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <p className="hub-empty-copy">Complete a core worksheet to see recent activity here.</p>
        ) : (
          <div className="command-center__table-wrap">
            <table className="command-center__table">
              <thead>
                <tr>
                  <th scope="col">Worksheet</th>
                  <th scope="col">Status</th>
                  <th scope="col">Category</th>
                  <th scope="col">Last updated</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item) => {
                  const navigable = isWorksheetHubNavigable(item.status, item.integrationStatus);
                  return (
                    <tr key={item.worksheetKey}>
                      <td>
                        {navigable && item.href ? (
                          <Link href={item.href} className="command-center__table-link">
                            {item.sheetName}
                          </Link>
                        ) : (
                          <span className="command-center__table-muted">{item.sheetName}</span>
                        )}
                      </td>
                      <td>
                        <StatusDot status={item.status} />
                      </td>
                      <td>{item.hubCategory.replace(/-/g, ' ')}</td>
                      <td>{formatRelativeDate(item.lastUpdatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
