'use client';

import { useEffect, useState } from 'react';
import TrendBarChart from '@/components/analysis/TrendBarChart';
import { REPORT_SECTION_CONFIGS } from '@/lib/worksheets/reportSectionConfigs';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';

export default function EngagementReportWizard({ clientId, sheetKey, clientRow = null }) {
  const config = REPORT_SECTION_CONFIGS[sheetKey];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  useWorksheetShellForm({ memo });

  useEffect(() => {
    if (!clientId || !config) return;
    buildSection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, sheetKey]);

  async function buildSection() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/worksheets/engagement-report/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: config.section,
          memo,
          client: {
            companyName: clientRow?.company_name,
            consultantName: clientRow?.primary_contact_name,
          },
          financials: {},
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Report build failed.');
      setResult(data.result);
    } catch (err) {
      setError(err.message || 'Unable to build report section.');
    } finally {
      setLoading(false);
    }
  }

  const content = result?.content || {};
  const chartSeries = content.series || content.kpis || [];

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Engagement Report</p>
        <h1>{config.title}</h1>
      </header>
      <div className="wizard-card">
        <button type="button" disabled={loading} onClick={buildSection}>
          {loading ? 'Building...' : 'Refresh section'}
        </button>
        {error ? <p className="wizard-error">{error}</p> : null}
      </div>
      {config.editableMemo ? (
        <label className="wizard-field">
          <span>Management memo</span>
          <textarea rows={6} value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>
      ) : null}
      {content.title ? <h2>{content.title}</h2> : null}
      {content.headline ? <h3>{content.headline}</h3> : null}
      {content.subtitle ? <p>{content.subtitle}</p> : null}
      {content.body ? <p>{content.body}</p> : null}
      {content.memo ? <p>{content.memo}</p> : null}
      {Array.isArray(content.bullets) ? (
        <ul>
          {content.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {config.chart && chartSeries.length > 0 ? (
        <TrendBarChart
          title={config.title}
          rows={chartSeries.map((row) => ({
            label: String(row.year || row.label),
            primary: Number(row.revenue || row.netIncome || row.value || 0),
            secondary: row.netIncome != null ? Number(row.netIncome) : null,
          }))}
        />
      ) : null}
    </section>
  );
}
