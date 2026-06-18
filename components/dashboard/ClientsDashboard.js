import Link from 'next/link';
import KpiCard from '@/components/hub/KpiCard';

function formatCreatedAt(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function buildKpis(clients) {
  const industries = new Set(clients.map((client) => client.industry).filter(Boolean));

  return [
    {
      label: 'Active clients',
      value: clients.length,
      hint: clients.length === 1 ? 'Engagement in workspace' : 'Engagements in workspace',
    },
    {
      label: 'Industries',
      value: industries.size,
      hint: industries.size ? 'Represented across clients' : 'Set industry during intake',
    },
    {
      label: 'Latest intake',
      value: clients[0] ? formatCreatedAt(clients[0].created_at) : '—',
      hint: clients[0] ? 'Most recent client record' : 'No clients yet',
    },
  ];
}

/**
 * @param {{ clients: Array<{ id: string, company_name?: string, industry?: string, created_at?: string }>, error?: unknown }} props
 */
export default function ClientsDashboard({ clients = [], error }) {
  const kpis = buildKpis(clients);

  return (
    <>
      <section className="hero clients-dashboard-hero">
        <p className="eyebrow">BMS Intelligent Portal</p>
        <h1>Your client engagements</h1>
        <p>
          Review client records, open each command center, and run worksheets with server-side financial
          analysis.
        </p>
      </section>

      <div className="workspace-hub clients-dashboard">
        <section className="hub-kpi-strip" aria-label="Workspace summary">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
          ))}
        </section>

        <section className="clients-dashboard__list" aria-label="Client directory">
          <div className="clients-dashboard__header">
            <div>
              <h2 className="hub-section-title">Client directory</h2>
              <p className="hub-section-subtitle">
                Open a workspace to view KPIs, worksheet progress, and deliverables.
              </p>
            </div>
            <Link href="/dashboard/clients/new" className="command-center__hub-link">
              Create new client
            </Link>
          </div>

          {error && (
            <p className="clients-dashboard__error" role="alert">
              Unable to load clients right now. Please refresh and try again.
            </p>
          )}

          {!error && clients.length === 0 && (
            <div className="clients-dashboard__empty">
              <h2>No clients yet</h2>
              <p className="hub-empty-copy">
                Create your first client record to start tracking baseline assumptions and running analysis.
              </p>
              <Link href="/dashboard/clients/new" className="command-center__hub-link clients-dashboard__empty-cta">
                Create your first client
              </Link>
            </div>
          )}

          {!error && clients.length > 0 && (
            <ul className="clients-directory">
              {clients.map((client) => (
                <li key={client.id}>
                  <Link href={`/workspace/${client.id}/overview`} className="client-directory-card">
                    <p className="client-directory-card__label">Client workspace</p>
                    <p className="client-directory-card__name">{client.company_name || 'Untitled client'}</p>
                    <dl className="client-directory-card__meta">
                      <div>
                        <dt>Industry</dt>
                        <dd>{client.industry || 'Not set'}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatCreatedAt(client.created_at)}</dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
