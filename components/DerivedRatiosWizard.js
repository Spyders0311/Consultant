'use client';

import { useState } from 'react';
import { pickLatestYearRow, normalizePLYearRow } from '@/lib/worksheets/worksheetPullHelpers';
import { DERIVED_RATIO_CONFIGS, DERIVED_RATIO_LABELS } from '@/lib/worksheets/derivedRatioConfigs';

function formatRatio(key, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  if (key.toLowerCase().includes('pct') || key.toLowerCase().includes('margin')) {
    return `${Number(value).toFixed(1)}%`;
  }
  if (key.toLowerCase().includes('days') || key === 'currentRatio' || key === 'debtRatio') {
    return Number(value).toFixed(2);
  }
  return Number(value).toFixed(2);
}

function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

export default function DerivedRatiosWizard({ clientId, sheetKey, clientRow = null }) {
  const config = DERIVED_RATIO_CONFIGS[sheetKey] || DERIVED_RATIO_CONFIGS['comparative-activity-ratios'];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [sourceAudit, setSourceAudit] = useState('');

  async function calculateFromLatestRuns() {
    setLoading(true);
    setError('');
    setSourceAudit('');

    try {
      const [plRes, bsRes] = await Promise.all([
        fetch(`/api/worksheets/pl-comparisons/runs?client_id=${encodeURIComponent(clientId)}&limit=1`),
        fetch(`/api/worksheets/balance-sheet-comparisons/runs?client_id=${encodeURIComponent(clientId)}&limit=1`),
      ]);
      const [plData, bsData] = await Promise.all([plRes.json(), bsRes.json()]);

      const plRun = plData.runs?.[0];
      const bsRun = bsData.runs?.[0];
      const plYear = normalizePLYearRow(pickLatestYearRow(plRun?.inputs?.years));
      const bsYear = pickLatestYearRow(bsRun?.inputs?.years);
      const bsComputed = pickLatestYearRow(bsRun?.outputs?.years) || {};

      if (!plYear && !bsYear) {
        throw new Error('Save P&L Comparisons and/or Balance Sheet Comparisons runs first.');
      }

      const payload = {
        plYear: plYear
          ? {
              year: plYear.year,
              revenue: plYear.revenue,
              cogs: plYear.cogs,
              operatingExpenses: plYear.operatingExpenses,
              otherExpenses: plYear.otherExpenses,
              interestExpense: plYear.interestExpense,
            }
          : null,
        bsYear: bsYear || null,
        bsComputed: bsComputed || {},
      };

      const response = await fetch('/api/worksheets/financial-ratios/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Ratio calculation failed.');

      setResult(data.result);
      setSourceAudit(
        `P&L ${plRun ? 'loaded' : 'missing'} · BS ${bsRun ? 'loaded' : 'missing'}${clientRow?.company_name ? ` · ${clientRow.company_name}` : ''}`,
      );
    } catch (err) {
      setError(err.message || 'Unable to calculate ratios.');
    } finally {
      setLoading(false);
    }
  }

  const focusKeys = config.focusKeys || Object.keys(DERIVED_RATIO_LABELS);

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Derived Worksheet</p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </header>

      <div className="wizard-card">
        <div className="wizard-actions">
          <button type="button" disabled={loading || !clientId} onClick={calculateFromLatestRuns}>
            {loading ? 'Calculating...' : 'Calculate from latest P&L & BS runs'}
          </button>
        </div>
        {sourceAudit ? <p className="wizard-meta">{sourceAudit}</p> : null}
        {error ? <p className="wizard-error">{error}</p> : null}
      </div>

      {result ? (
        <section className="wizard-result">
          <div className="wizard-kpis">
            {focusKeys.map((key) => (
              <article key={key}>
                <span>{DERIVED_RATIO_LABELS[key] || key}</span>
                <strong>{formatRatio(key, result.ratios?.[key])}</strong>
              </article>
            ))}
          </div>

          <div className="table-wrap">
            <h3>P&L Summary</h3>
            <table>
              <tbody>
                <tr>
                  <td>Revenue</td>
                  <td>{currency(result.plSummary?.revenue)}</td>
                </tr>
                <tr>
                  <td>Gross Profit</td>
                  <td>{currency(result.plSummary?.grossProfit)}</td>
                </tr>
                <tr>
                  <td>Net Income (approx)</td>
                  <td>{currency(result.plSummary?.netIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {(result.warnings || []).length > 0 ? (
            <ul className="warnings">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
