'use client';

import { useState } from 'react';
import { pickLatestYearRow, normalizePLYearRow } from '@/lib/worksheets/worksheetPullHelpers';
import { DERIVED_PL_CONFIGS } from '@/lib/worksheets/derivedPlConfigs';

function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

export default function DerivedPlWizard({ clientId, sheetKey }) {
  const config = DERIVED_PL_CONFIGS[sheetKey];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function calculate() {
    setLoading(true);
    setError('');
    try {
      const plRes = await fetch(`/api/worksheets/pl-comparisons/runs?client_id=${encodeURIComponent(clientId)}&limit=1`);
      const plData = await plRes.json();
      const years = (plData.runs?.[0]?.inputs?.years || []).map((row) => normalizePLYearRow(row));
      if (!years.length) throw new Error('Save P&L Comparisons with at least one year first.');

      const response = await fetch('/api/worksheets/pl-analysis/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType: config.analysisType, years }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Analysis failed.');
      setResult(data.result);
    } catch (err) {
      setError(err.message || 'Unable to analyze P&L.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Derived Worksheet</p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </header>
      <div className="wizard-card">
        <button type="button" disabled={loading || !clientId} onClick={calculate}>
          {loading ? 'Calculating...' : 'Analyze from latest P&L run'}
        </button>
        {error ? <p className="wizard-error">{error}</p> : null}
      </div>
      {result?.summary ? (
        <div className="table-wrap">
          <h3>Min / Max Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Min</th>
                <th>Max</th>
                <th>Spread</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.summary).map(([key, row]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{currency(row.min)}</td>
                  <td>{currency(row.max)}</td>
                  <td>{currency(row.spread)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {result?.comparison ? (
        <div className="table-wrap">
          <h3>
            {result.comparison.fromYear} → {result.comparison.toYear}
          </h3>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>From</th>
                <th>To</th>
                <th>Δ</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.comparison.metrics || {}).map(([key, row]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{currency(row.from)}</td>
                  <td>{currency(row.to)}</td>
                  <td>{currency(row.delta)}</td>
                  <td>{row.pctChange != null ? `${row.pctChange}%` : 'n/a'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {result?.pieSlices ? (
        <div className="wizard-kpis">
          {result.pieSlices.map((slice) => (
            <article key={slice.year}>
              <span>{slice.year}</span>
              <strong>
                {currency(slice.revenue)} ({slice.sharePct}%)
              </strong>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
