'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';

const defaultForm = {
  periodLabel: '',
  budgetRevenue: '',
  actualRevenue: '',
  budgetCogsPercent: '',
  actualCogs: '',
  budgetVariableExpensePercent: '',
  actualVariableExpenses: '',
  budgetFixedExpenses: '',
  actualFixedExpenses: '',
  notes: '',
};

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

function percent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return `${Number(value).toFixed(1)}%`;
}

function formatRunTimestamp(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function FlexibleBudgetVarianceWizard({ clientId }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [error, setError] = useState('');

  const canRun = useMemo(
    () =>
      String(form.periodLabel || '').trim().length > 0 &&
      parseNumber(form.budgetRevenue) > 0 &&
      parseNumber(form.actualRevenue) >= 0,
    [form],
  );

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function loadRun(run) {
    if (!run) return;
    setForm({ ...defaultForm, ...(run.inputs || {}) });
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setError('');
  }

  function resetToNewRun() {
    setForm(defaultForm);
    setResult(null);
    setRunId('');
    setError('');
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchRuns() {
      if (!clientId) return;
      setRunsLoading(true);
      try {
        const response = await fetch(
          `/api/worksheets/flexible-budget-variance/runs?client_id=${encodeURIComponent(clientId)}`,
          { cache: 'no-store' },
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load flexible budget history.');
        }
        if (!cancelled) setRuns(data.runs || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load flexible budget history.');
      } finally {
        if (!cancelled) setRunsLoading(false);
      }
    }

    fetchRuns();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  async function calculateAndSave(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        periodLabel: String(form.periodLabel || '').trim(),
        budgetRevenue: parseNumber(form.budgetRevenue),
        actualRevenue: parseNumber(form.actualRevenue),
        budgetCogsPercent: parseNumber(form.budgetCogsPercent),
        actualCogs: parseNumber(form.actualCogs),
        budgetVariableExpensePercent: parseNumber(form.budgetVariableExpensePercent),
        actualVariableExpenses: parseNumber(form.actualVariableExpenses),
        budgetFixedExpenses: parseNumber(form.budgetFixedExpenses),
        actualFixedExpenses: parseNumber(form.actualFixedExpenses),
        notes: String(form.notes || '').trim(),
      };

      const calculationResponse = await fetch('/api/worksheets/flexible-budget-variance/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Flexible budget variance calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/flexible-budget-variance/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
      });
      const runData = await runResponse.json();
      if (!runResponse.ok || !runData.ok) {
        throw new Error(runData.error || 'Calculation succeeded but saving run failed.');
      }

      const savedRun = {
        id: runData.id || '',
        created_at: new Date().toISOString(),
        inputs: payload,
        outputs: calculationData.result,
      };
      setRunId(savedRun.id);
      setRuns((prev) => [savedRun, ...prev.filter((run) => run.id !== savedRun.id)].slice(0, 10));
    } catch (err) {
      setError(err.message || 'Unable to complete flexible budget variance run.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Financial Tools</p>
        <h1>Flexible Budget / Variance</h1>
        <p>
          Initial app port of the F-700d flexible budget workbook. Compare static budget, flexible budget, and actual
          performance for the selected period.
        </p>
      </header>

      <form className="wizard-card" onSubmit={calculateAndSave}>
        <div className="wizard-fields">
          <label>
            Period Label
            <WorksheetInput
              type="text"
              value={form.periodLabel}
              onChange={(event) => updateField('periodLabel', event.target.value)}
              placeholder="January 2026"
              disabled={loading}
            />
          </label>
          <label>
            Budget Revenue
            <WorksheetInput
              type="number"
              min="0"
              value={form.budgetRevenue}
              onChange={(event) => updateField('budgetRevenue', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Actual Revenue
            <WorksheetInput
              type="number"
              min="0"
              value={form.actualRevenue}
              onChange={(event) => updateField('actualRevenue', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Budget COGS %
            <WorksheetInput
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.budgetCogsPercent}
              onChange={(event) => updateField('budgetCogsPercent', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Actual COGS
            <WorksheetInput
              type="number"
              min="0"
              value={form.actualCogs}
              onChange={(event) => updateField('actualCogs', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Budget Variable Expense %
            <WorksheetInput
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.budgetVariableExpensePercent}
              onChange={(event) => updateField('budgetVariableExpensePercent', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Actual Variable Expenses
            <WorksheetInput
              type="number"
              min="0"
              value={form.actualVariableExpenses}
              onChange={(event) => updateField('actualVariableExpenses', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Budget Fixed Expenses
            <WorksheetInput
              type="number"
              min="0"
              value={form.budgetFixedExpenses}
              onChange={(event) => updateField('budgetFixedExpenses', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Actual Fixed Expenses
            <WorksheetInput
              type="number"
              min="0"
              value={form.actualFixedExpenses}
              onChange={(event) => updateField('actualFixedExpenses', event.target.value)}
              disabled={loading}
            />
          </label>
        </div>

        <label>
          Notes
          <textarea
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Optional period notes, assumptions, or unusual items."
            disabled={loading}
          />
        </label>

        <div className="actions">
          <button type="button" className="ghost" onClick={resetToNewRun} disabled={loading}>
            Reset
          </button>
          <button type="submit" disabled={loading || !canRun}>
            {loading ? 'Calculating...' : 'Calculate & Save'}
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
      </form>

      {result ? (
        <section className="wizard-results">
          <h2>Variance Summary</h2>
          <div className="wizard-kpis">
            <article>
              <span>Flexible Budget OI</span>
              <strong>{currency(result.flexibleBudgetOperatingIncome)}</strong>
            </article>
            <article>
              <span>Actual OI</span>
              <strong>{currency(result.actualOperatingIncome)}</strong>
            </article>
            <article>
              <span>OI Variance</span>
              <strong>{currency(result.operatingIncomeVariance)}</strong>
            </article>
            <article>
              <span>Sales Volume Variance</span>
              <strong>{currency(result.salesVolumeVariance)}</strong>
            </article>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Line Item</th>
                  <th>Static Budget</th>
                  <th>Flexible Budget</th>
                  <th>Actual</th>
                  <th>Variance</th>
                  <th>Variance %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(result.rows || []).map((row) => (
                  <tr key={row.lineItem}>
                    <td>{row.lineItem}</td>
                    <td>{currency(row.staticBudget)}</td>
                    <td>{currency(row.flexibleBudget)}</td>
                    <td>{currency(row.actual)}</td>
                    <td>{currency(row.variance)}</td>
                    <td>{percent(row.variancePercent)}</td>
                    <td>{row.favorable ? 'Favorable' : 'Unfavorable'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.warnings?.length ? <ul className="warnings">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
          {runId ? <p className="run-id">Saved run: {runId}</p> : null}
        </section>
      ) : null}

      <aside className="run-history">
        <h2>Recent Runs</h2>
        {runsLoading ? <p>Loading history...</p> : null}
        {!runsLoading && runs.length === 0 ? <p>No flexible budget runs saved yet.</p> : null}
        <div className="run-list">
          {runs.map((run) => (
            <button type="button" className="run-list-item" key={run.id} onClick={() => loadRun(run)}>
              <strong>{formatRunTimestamp(run.created_at)}</strong>
              <span>{currency(run.outputs?.actualOperatingIncome)} actual operating income</span>
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}
