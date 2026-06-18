'use client';

import Link from 'next/link';
import { useState } from 'react';
import KpiCard from '@/components/hub/KpiCard';
import ProgressDonut from '@/components/hub/ProgressDonut';
import TrendBarChart from '@/components/analysis/TrendBarChart';
import { formatCurrency, formatRelativeDate } from '@/lib/hub/formatters';

/**
 * @param {{ message: string, actionLabel?: string, actionHref?: string }} props
 */
function PanelEmptyState({ message, actionLabel, actionHref }) {
  return (
    <div className="executive-analysis__empty">
      <p className="hub-empty-copy">{message}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="executive-analysis__empty-action">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * @param {{ report: import('@/lib/reports/executiveAnalysis').ExecutiveAnalysisReport, clientId: string }} props
 */
export default function ExecutiveAnalysisDashboard({ report, clientId }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  async function exportPdf() {
    setExporting(true);
    setExportError('');
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'executive-analysis',
          result: report,
          clientName: report.companyName,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'PDF export failed.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${report.companyName.replace(/\s+/g, '-').toLowerCase()}-executive-analysis.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'PDF export failed.');
    } finally {
      setExporting(false);
    }
  }

  const trendRows = report.plTrend.map((row) => ({
    label: row.year,
    primary: row.revenue,
    secondary: row.netIncome,
  }));

  const banner = report.panelEmptyStates?.banner;
  const empty = report.panelEmptyStates || {};

  return (
    <div className="workspace-hub executive-analysis">
      <header className="executive-analysis__header">
        <div>
          <p className="executive-analysis__eyebrow">Executive analysis</p>
          <h2>{report.companyName}</h2>
          <p className="executive-analysis__meta">
            Read-only synthesis from saved worksheet runs
            {report.industry ? ` · ${report.industry}` : ''}
            {report.dataSources.plRunAt ? ` · P&L updated ${formatRelativeDate(report.dataSources.plRunAt)}` : ''}
            {report.dataSources.bsRunAt ? ` · BS updated ${formatRelativeDate(report.dataSources.bsRunAt)}` : ''}
          </p>
        </div>
        <div className="executive-analysis__actions">
          <button type="button" className="executive-analysis__export" onClick={exportPdf} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
          <Link href={`/workspace/${clientId}/analyst-wizard`} className="executive-analysis__hub-link">
            Open worksheet hub
          </Link>
        </div>
      </header>

      {exportError ? <p className="executive-analysis__error">{exportError}</p> : null}

      {banner ? (
        <section
          className={`executive-analysis__banner executive-analysis__banner--${banner.severity}`}
          aria-label="Data coverage notice"
        >
          <div>
            <strong>{banner.title}</strong>
            <p className="hub-empty-copy">{banner.message}</p>
          </div>
          {banner.actionLabel && banner.actionHref ? (
            <Link href={banner.actionHref} className="executive-analysis__banner-action">
              {banner.actionLabel}
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="hub-kpi-strip" aria-label="Executive KPIs">
        {report.kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
        ))}
      </section>

      <div className="executive-analysis__grid">
        <section className="hub-rail-panel executive-analysis__panel">
          <div className="executive-analysis__progress-header">
            <div>
              <h3 className="hub-section-title">Core worksheet progress</h3>
              <p className="hub-section-subtitle">
                {report.coreProgress.complete} of {report.coreProgress.total} complete
              </p>
            </div>
            <ProgressDonut percent={report.coreProgress.percent} label="Core progress" size={84} />
          </div>
        </section>

        <section className="hub-rail-panel executive-analysis__panel executive-analysis__panel--wide">
          {report.hasMultiYearTrend ? (
            <TrendBarChart title="P&L trend" rows={trendRows} />
          ) : report.plTrend.length === 1 ? (
            <>
              <TrendBarChart title="P&L trend (single year)" rows={trendRows} />
              {empty.trend ? (
                <PanelEmptyState
                  message={empty.trend.message}
                  actionLabel={empty.trend.actionLabel}
                  actionHref={empty.trend.actionHref}
                />
              ) : null}
            </>
          ) : (
            <>
              <h3 className="hub-section-title">P&L trend</h3>
              {empty.trend ? (
                <PanelEmptyState
                  message={empty.trend.message}
                  actionLabel={empty.trend.actionLabel}
                  actionHref={empty.trend.actionHref}
                />
              ) : (
                <p className="hub-empty-copy">Save at least two years in P&L Comparisons to see revenue and net income trends.</p>
              )}
            </>
          )}
        </section>

        <section className="hub-rail-panel executive-analysis__panel">
          <h3 className="hub-section-title">Operating expense breakdown</h3>
          {report.opexBreakdown.length === 0 ? (
            empty.opex ? (
              <PanelEmptyState
                message={empty.opex.message}
                actionLabel={empty.opex.actionLabel}
                actionHref={empty.opex.actionHref}
              />
            ) : (
              <p className="hub-empty-copy">No P&L expense detail available from the latest saved run.</p>
            )
          ) : (
            <ul className="executive-analysis__opex-list">
              {report.opexBreakdown.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <strong>{formatCurrency(row.amount)}</strong>
                  <em>{row.percentOfRevenue != null ? `${row.percentOfRevenue.toFixed(1)}% of revenue` : '—'}</em>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="hub-rail-panel executive-analysis__panel">
          <h3 className="hub-section-title">Key ratios</h3>
          {report.ratioCards.length === 0 ? (
            empty.ratios ? (
              <PanelEmptyState
                message={empty.ratios.message}
                actionLabel={empty.ratios.actionLabel}
                actionHref={empty.ratios.actionHref}
              />
            ) : (
              <p className="hub-empty-copy">Save P&L and balance sheet runs to populate ratio cards.</p>
            )
          ) : (
            <div className="executive-analysis__ratio-grid">
              {report.ratioCards.map((card) => (
                <article key={card.key} className="executive-analysis__ratio-card">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="hub-rail-panel executive-analysis__panel executive-analysis__panel--wide">
          <h3 className="hub-section-title">Five-year outlook</h3>
          {report.fiveYearSummary ? (
            <div className="executive-analysis__five-year-strip">
              <div>
                <span>Base year</span>
                <strong>{report.fiveYearSummary.baseYear ?? '—'}</strong>
              </div>
              <div>
                <span>Year 5 revenue</span>
                <strong>{formatCurrency(report.fiveYearSummary.year5Revenue)}</strong>
              </div>
              <div>
                <span>Year 5 net income</span>
                <strong>{formatCurrency(report.fiveYearSummary.year5NetIncome)}</strong>
              </div>
              <div>
                <span>Year 5 EBITDA</span>
                <strong>{formatCurrency(report.fiveYearSummary.year5Ebitda)}</strong>
              </div>
            </div>
          ) : empty.fiveYear ? (
            <PanelEmptyState
              message={empty.fiveYear.message}
              actionLabel={empty.fiveYear.actionLabel}
              actionHref={empty.fiveYear.actionHref}
            />
          ) : (
            <p className="hub-empty-copy">Save a 5-Year Projections run to populate the outlook panel.</p>
          )}
        </section>

        <section className="hub-rail-panel executive-analysis__panel">
          <h3 className="hub-section-title">Insights</h3>
          <ul className="executive-analysis__insights">
            {report.insights.map((insight) => (
              <li key={`${insight.title}-${insight.detail}`} className={`executive-analysis__insight executive-analysis__insight--${insight.severity}`}>
                <strong>{insight.title}</strong>
                <p>{insight.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="executive-analysis-actions" className="hub-rail-panel executive-analysis__panel">
          <h3 className="hub-section-title">Recommended next actions</h3>
          {report.recommendedActions.length === 0 ? (
            <p className="hub-empty-copy">
              All core worksheets are complete. Review ratios and projections for follow-up, or{' '}
              <Link href={`/workspace/${clientId}/analyst-wizard`}>open the worksheet hub</Link> for supporting worksheets.
            </p>
          ) : (
            <ol className="executive-analysis__actions-list">
              {report.recommendedActions.map((action) => (
                <li key={action.worksheetKey}>
                  <Link href={action.href || '#'} className="executive-analysis__action-link">
                    <span className="executive-analysis__action-rank">Core {action.coreRank}</span>
                    <span className="executive-analysis__action-name">{action.sheetName}</span>
                    {action.priority === 'high' ? (
                      <span className="executive-analysis__action-priority">High priority</span>
                    ) : null}
                  </Link>
                  {action.unlocks ? <p className="executive-analysis__action-unlocks">Unlocks {action.unlocks}</p> : null}
                  <p>{action.reason}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
