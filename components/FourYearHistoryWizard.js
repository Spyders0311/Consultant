'use client';

import { useMemo, useState } from 'react';
import { mapClientRowToApiClient } from '@/lib/worksheets/clientBaselines';
import { patchFinancialSnapshot } from '@/lib/client/patchFinancialSnapshot';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';

function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

export default function FourYearHistoryWizard({ clientId, clientRow = null }) {
  const [loading, setLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pushAudit, setPushAudit] = useState('');

  const shellForm = useMemo(() => ({ generated: Boolean(result) }), [result]);
  useWorksheetShellForm(shellForm);

  async function generateHistory() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/worksheets/four-year-history/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: mapClientRowToApiClient(clientRow) }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to generate 4-year history.');
      setResult(data.result);
    } catch (err) {
      setError(err.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function pushToWorksheets() {
    if (!result?.plYears?.length) return;
    setPushLoading(true);
    setPushAudit('');
    setError('');

    try {
      const plPayload = {
        years: result.plYears.map((row) => ({
          year: row.year,
          revenue: row.revenue,
          cogs: row.cogs,
          operatingExpenses: row.operatingExpenses,
          otherExpenses: row.otherExpenses,
          lineItems: row.lineItems || [],
        })),
      };

      const plCalc = await fetch('/api/worksheets/pl-comparisons/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plPayload),
      });
      const plCalcData = await plCalc.json();
      if (!plCalc.ok || !plCalcData.ok) throw new Error(plCalcData.error || 'P&L calculation failed.');

      await fetch('/api/worksheets/pl-comparisons/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, inputs: plPayload, outputs: plCalcData.result }),
      });

      if (result.bsYears?.length) {
        const bsPayload = { years: result.bsYears };
        const bsCalc = await fetch('/api/worksheets/balance-sheet-comparisons/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bsPayload),
        });
        const bsCalcData = await bsCalc.json();
        if (!bsCalc.ok || !bsCalcData.ok) throw new Error(bsCalcData.error || 'Balance sheet calculation failed.');

        await fetch('/api/worksheets/balance-sheet-comparisons/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, inputs: bsPayload, outputs: bsCalcData.result }),
        });
      }

      const latest = plPayload.years[plPayload.years.length - 1];
      await patchFinancialSnapshot(clientId, '4-year-history-auto', {
        annualRevenue: latest?.revenue,
        annualCogs: latest?.cogs,
      });

      setPushAudit('Saved new P&L and Balance Sheet comparison runs from generated history.');
    } catch (err) {
      setError(err.message || 'Unable to push history to worksheets.');
    } finally {
      setPushLoading(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Analyst Wizard</p>
        <h1>4 YEAR HISTORY (Auto)</h1>
        <p>Generate draft 4-year P&L and balance sheet grids from client baseline and feeder worksheets.</p>
      </header>

      <div className="wizard-card">
        <div className="wizard-actions">
          <button type="button" disabled={loading} onClick={generateHistory}>
            {loading ? 'Generating...' : 'Generate 4-Year History'}
          </button>
          <button type="button" className="ghost" disabled={!result || pushLoading} onClick={pushToWorksheets}>
            {pushLoading ? 'Saving...' : 'Save to P&L & Balance Sheet'}
          </button>
        </div>
        {pushAudit ? <p className="wizard-meta">{pushAudit}</p> : null}
        {error ? <p className="wizard-error">{error}</p> : null}
      </div>

      {result?.plYears?.length ? (
        <section className="wizard-result">
          <h3>Generated P&L Years</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>COGS</th>
                  <th>OpEx</th>
                  <th>Other</th>
                </tr>
              </thead>
              <tbody>
                {result.plYears.map((row) => (
                  <tr key={row.year}>
                    <td>{row.year}</td>
                    <td>{currency(row.revenue)}</td>
                    <td>{currency(row.cogs)}</td>
                    <td>{currency(row.operatingExpenses)}</td>
                    <td>{currency(row.otherExpenses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}
