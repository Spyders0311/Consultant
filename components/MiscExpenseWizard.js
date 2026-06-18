'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import { patchFinancialSnapshot } from '@/lib/client/patchFinancialSnapshot';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

function formatRunTimestamp(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function MiscExpenseWizard({
  clientId,
  worksheetKey,
  title,
  description,
  categoryOptions,
  snapshotSource,
}) {
  const [lines, setLines] = useState([{ category: categoryOptions[0]?.value || '', description: '', amount: '' }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState('');

  const shellForm = useMemo(() => ({ lines }), [lines]);
  useWorksheetShellForm(shellForm);

  const apiBase = `/api/worksheets/${worksheetKey}`;

  function updateLine(index, field, value) {
    setLines((prev) => prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)));
  }

  function addLine() {
    setLines((prev) => [...prev, { category: categoryOptions[0]?.value || '', description: '', amount: '' }]);
  }

  async function calculateAndSave(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        lines: lines.map((line) => ({
          category: line.category,
          description: line.description,
          amount: parseNumber(line.amount),
        })),
      };

      const calculationResponse = await fetch(`${apiBase}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch(`${apiBase}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
      });
      const runData = await runResponse.json();
      if (!runResponse.ok || !runData.ok) {
        throw new Error(runData.error || 'Failed to save run.');
      }

      setRunId(runData.id || '');
      setRuns((prev) => [
        { id: runData.id, created_at: new Date().toISOString(), inputs: payload, outputs: calculationData.result },
        ...prev,
      ].slice(0, 10));

      await patchFinancialSnapshot(clientId, snapshotSource, {
        [`${worksheetKey}AnnualTotal`]: calculationData.result?.annualTotal,
      });
    } catch (err) {
      setError(err.message || 'Unable to complete run.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchRuns() {
      if (!clientId) return;
      try {
        const response = await fetch(`${apiBase}/runs?client_id=${encodeURIComponent(clientId)}`, { cache: 'no-store' });
        const data = await response.json();
        if (!cancelled && response.ok && data.ok) setRuns(data.runs || []);
      } catch {
        // ignore
      }
    }
    fetchRuns();
    return () => {
      cancelled = true;
    };
  }, [apiBase, clientId]);

  const totalPreview = useMemo(
    () => lines.reduce((sum, line) => sum + parseNumber(line.amount), 0),
    [lines],
  );

  return (
    <section className="panel worksheet-wizard">
      <header className="wizard-header">
        <p className="wizard-kicker">Analyst Wizard</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>

      <form className="wizard-form" onSubmit={calculateAndSave}>
        <div className="wizard-grid">
          {lines.map((line, index) => (
            <div key={`line-${index}`} className="wizard-grid-row">
              <label>
                Category
                <select value={line.category} onChange={(e) => updateLine(index, 'category', e.target.value)}>
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <WorksheetInput
                label="Description"
                value={line.description}
                onChange={(e) => updateLine(index, 'description', e.target.value)}
              />
              <WorksheetInput
                label="Amount"
                type="number"
                value={line.amount}
                onChange={(e) => updateLine(index, 'amount', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="wizard-actions">
          <button type="button" className="ghost" onClick={addLine}>
            Add line
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Running...' : 'Run & Save'}
          </button>
        </div>

        <p className="wizard-meta">Draft total: {currency(totalPreview)}</p>
        {error ? <p className="wizard-error">{error}</p> : null}
      </form>

      {result ? (
        <section className="wizard-result">
          <article>
            <span>Annual Total</span>
            <strong>{currency(result.annualTotal)}</strong>
          </article>
          {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}
        </section>
      ) : null}

      <ul className="wizard-history-list">
        {runs.slice(0, 5).map((run) => (
          <li key={run.id}>
            <span>{formatRunTimestamp(run.created_at)}</span>
            <strong>{currency(run.outputs?.annualTotal)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
