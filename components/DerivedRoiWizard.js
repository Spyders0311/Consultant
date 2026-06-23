'use client';

import { useState } from 'react';
import { normalizePLYearRow, pickLatestYearRow } from '@/lib/worksheets/worksheetPullHelpers';
import { ROI_ANALYSIS_CONFIGS } from '@/lib/worksheets/roiAnalysisConfigs';

function pct(value) {
  if (value === null || value === undefined) return 'n/a';
  return `${Number(value).toFixed(1)}%`;
}

export default function DerivedRoiWizard({ clientId, sheetKey }) {
  const config = ROI_ANALYSIS_CONFIGS[sheetKey];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function loadFeederTotal(analysisType, category) {
    const url = `/api/worksheets/twelve-month-analysis/runs?client_id=${encodeURIComponent(clientId)}&analysis_type=${analysisType}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    const run = data.runs?.[0];
    const months = run?.inputs?.months || [];
    let total = 0;
    for (const month of months) {
      for (const line of month.lines || []) {
        if (!category || line.category === category) total += Number(line.amount || 0);
      }
    }
    return total;
  }

  async function calculate() {
    setLoading(true);
    setError('');
    try {
      const plRes = await fetch(`/api/worksheets/pl-comparisons/runs?client_id=${encodeURIComponent(clientId)}&limit=1`);
      const plData = await plRes.json();
      const plYear = normalizePLYearRow(pickLatestYearRow(plData.runs?.[0]?.inputs?.years));
      if (!plYear) throw new Error('Save P&L Comparisons first.');

      let categoryTotal = 0;
      if (config.usePlCogs) categoryTotal = Number(plYear.cogs || 0);
      else if (config.miscDirect) {
        const md = await fetch(`/api/worksheets/misc-direct-expenses/runs?client_id=${encodeURIComponent(clientId)}&limit=1`);
        const mdData = await md.json();
        categoryTotal = Number(mdData.runs?.[0]?.outputs?.annualTotal || 0);
      } else if (config.feederAnalysisType) {
        categoryTotal = await loadFeederTotal(config.feederAnalysisType, config.feederCategory);
      }

      const payload = {
        roiType: config.roiType,
        annualRevenue: plYear.revenue,
        annualCogs: plYear.cogs,
        grossProfit: Number(plYear.revenue || 0) - Number(plYear.cogs || 0),
        categoryTotal,
      };

      const response = await fetch('/api/worksheets/roi-analysis/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'ROI calculation failed.');
      setResult(data.result);
    } catch (err) {
      setError(err.message || 'Unable to calculate ROI.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Derived ROI</p>
        <h1>{config.title}</h1>
      </header>
      <div className="wizard-card">
        <button type="button" disabled={loading || !clientId} onClick={calculate}>
          {loading ? 'Calculating...' : 'Calculate ROI from latest runs'}
        </button>
        {error ? <p className="wizard-error">{error}</p> : null}
      </div>
      {result ? (
        <div className="wizard-kpis">
          <article>
            <span>Category Total</span>
            <strong>{result.categoryTotal}</strong>
          </article>
          <article>
            <span>Share of Revenue</span>
            <strong>{pct(result.shareOfRevenuePct)}</strong>
          </article>
          <article>
            <span>Share of Gross Profit</span>
            <strong>{pct(result.shareOfGrossProfitPct)}</strong>
          </article>
          <article>
            <span>ROI</span>
            <strong>{pct(result.roiPct)}</strong>
          </article>
        </div>
      ) : null}
    </section>
  );
}
