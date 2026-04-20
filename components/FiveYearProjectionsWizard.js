'use client';

import { useEffect, useMemo, useState } from 'react';

const steps = [
  { id: 'base', title: 'Base Inputs', hint: 'Set base year, revenue, and COGS assumptions.' },
  { id: 'expenses', title: 'Expense & Tax', hint: 'Set fixed expense growth and optional tax rate.' },
  { id: 'review', title: 'Review & Run', hint: 'Confirm assumptions and calculate five-year output.' },
];

function defaultFormValues() {
  return {
    baseYear: new Date().getFullYear(),
    baseRevenue: 1250000,
    revenueGrowthPercent: 8,
    baseCogsPercent: 55,
    baseFixedExpenses: 320000,
    fixedExpenseGrowthPercent: 3,
    taxRatePercent: '',
  };
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalNumber(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
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

function number(value, maximumFractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(Number(value));
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

export default function FiveYearProjectionsWizard({ clientId }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(() => defaultFormValues());
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfError, setPdfError] = useState('');

  const progress = ((stepIndex + 1) / steps.length) * 100;

  const canAdvance = useMemo(() => {
    if (stepIndex === 0) {
      return parseNumber(form.baseYear) >= 1900 && parseNumber(form.baseRevenue) >= 0 && parseNumber(form.baseCogsPercent) >= 0;
    }
    if (stepIndex === 1) {
      const taxRate = parseOptionalNumber(form.taxRatePercent);
      return (
        parseNumber(form.baseFixedExpenses) >= 0 &&
        parseNumber(form.fixedExpenseGrowthPercent) >= -100 &&
        (taxRate === null || (taxRate >= 0 && taxRate <= 100))
      );
    }
    return true;
  }, [form, stepIndex]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function loadRun(run) {
    if (!run) return;
    setForm({ ...defaultFormValues(), ...(run.inputs || {}) });
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setStepIndex(steps.length - 1);
    setError('');
    setPdfError('');
  }

  function resetToNewRun() {
    setForm(defaultFormValues());
    setResult(null);
    setRunId('');
    setStepIndex(0);
    setError('');
    setPdfError('');
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchRuns() {
      if (!clientId) return;
      setRunsLoading(true);
      try {
        const response = await fetch(`/api/worksheets/five-year-projections/runs?client_id=${encodeURIComponent(clientId)}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load five year projection history.');
        }

        const fetchedRuns = data.runs || [];
        if (cancelled) return;
        setRuns(fetchedRuns);
        if (fetchedRuns.length > 0) {
          loadRun(fetchedRuns[0]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load five year projection history.');
        }
      } finally {
        if (!cancelled) {
          setRunsLoading(false);
        }
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
        baseYear: parseNumber(form.baseYear),
        baseRevenue: parseNumber(form.baseRevenue),
        revenueGrowthPercent: parseNumber(form.revenueGrowthPercent),
        baseCogsPercent: parseNumber(form.baseCogsPercent),
        baseFixedExpenses: parseNumber(form.baseFixedExpenses),
        fixedExpenseGrowthPercent: parseNumber(form.fixedExpenseGrowthPercent),
        taxRatePercent: parseOptionalNumber(form.taxRatePercent),
      };

      const calculationResponse = await fetch('/api/worksheets/five-year-projections/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Five year projection calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/five-year-projections/runs', {
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
      setError(err.message || 'Unable to complete five year projections run.');
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    if (!result) return;

    setPdfLoading(true);
    setPdfError('');

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'five-year-projections', result: { ...result, clientId, runId } }),
      });

      if (!response.ok) {
        let message = 'Unable to generate PDF.';
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data?.error) message = data.error;
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bms-five-year-projections-report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err.message || 'Unable to generate PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Analyst Program</p>
        <h1>5 Year Projections</h1>
        <p>Forecast five years of revenue, margins, EBITDA, and optional after-tax net income.</p>
      </header>

      <section className="wizard-history" aria-label="Five year projection run history">
        <div className="wizard-history-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => loadRun(runs[0])}
            disabled={loading || runsLoading || runs.length === 0}
          >
            Continue last run
          </button>
          <button type="button" className="ghost" onClick={resetToNewRun} disabled={loading || runsLoading}>
            Start new run
          </button>
        </div>
        <ul className="wizard-history-list">
          {runs.slice(0, 10).map((run) => (
            <li key={run.id}>
              <span>{formatRunTimestamp(run.created_at)}</span>
              <button type="button" className="ghost" onClick={() => loadRun(run)} disabled={loading || runsLoading}>
                Load
              </button>
            </li>
          ))}
          {!runsLoading && runs.length === 0 ? <li className="wizard-history-empty">No saved runs yet.</li> : null}
        </ul>
      </section>

      <div className="wizard-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className="wizard-step-list">
        {steps.map((step, idx) => {
          const isCurrent = idx === stepIndex;
          const isCompleted = idx < stepIndex;
          const canJumpForward = idx > stepIndex ? canAdvance : true;

          return (
            <li key={step.id}>
              <button
                type="button"
                className={`wizard-step-button ${isCurrent ? 'active' : ''} ${isCompleted ? 'complete' : ''}`}
                onClick={() => setStepIndex(idx)}
                disabled={loading || !canJumpForward}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <strong>{step.title}</strong>
                <span>{step.hint}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <form className="wizard-card" onSubmit={calculateAndSave}>
        {stepIndex === 0 && (
          <div className="wizard-fields">
            <label>
              Base Year
              <input
                type="number"
                min="1900"
                max="3000"
                value={form.baseYear}
                onChange={(event) => updateField('baseYear', event.target.value)}
              />
            </label>
            <label>
              Base Revenue
              <input
                type="number"
                min="0"
                value={form.baseRevenue}
                onChange={(event) => updateField('baseRevenue', event.target.value)}
              />
            </label>
            <label>
              Revenue Growth %
              <input
                type="number"
                step="0.1"
                min="-100"
                value={form.revenueGrowthPercent}
                onChange={(event) => updateField('revenueGrowthPercent', event.target.value)}
              />
            </label>
            <label>
              Base COGS %
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.baseCogsPercent}
                onChange={(event) => updateField('baseCogsPercent', event.target.value)}
              />
            </label>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="wizard-fields">
            <label>
              Base Fixed Expenses
              <input
                type="number"
                min="0"
                value={form.baseFixedExpenses}
                onChange={(event) => updateField('baseFixedExpenses', event.target.value)}
              />
            </label>
            <label>
              Fixed Expense Growth %
              <input
                type="number"
                step="0.1"
                min="-100"
                value={form.fixedExpenseGrowthPercent}
                onChange={(event) => updateField('fixedExpenseGrowthPercent', event.target.value)}
              />
            </label>
            <label>
              Tax Rate % (Optional)
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Leave blank to skip"
                value={form.taxRatePercent}
                onChange={(event) => updateField('taxRatePercent', event.target.value)}
              />
            </label>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="client-review-grid">
            <article>
              <span>Projection Window</span>
              <strong>
                {number(form.baseYear, 0)} to {number(parseNumber(form.baseYear) + 4, 0)}
              </strong>
            </article>
            <article>
              <span>Base Revenue</span>
              <strong>{currency(form.baseRevenue)}</strong>
            </article>
            <article>
              <span>Revenue Growth</span>
              <strong>{percent(form.revenueGrowthPercent)}</strong>
            </article>
            <article>
              <span>Base COGS %</span>
              <strong>{percent(form.baseCogsPercent)}</strong>
            </article>
            <article>
              <span>Base Fixed Expenses</span>
              <strong>{currency(form.baseFixedExpenses)}</strong>
            </article>
            <article>
              <span>Fixed Expense Growth</span>
              <strong>{percent(form.fixedExpenseGrowthPercent)}</strong>
            </article>
            <article>
              <span>Tax Rate</span>
              <strong>{parseOptionalNumber(form.taxRatePercent) === null ? 'Not provided' : percent(form.taxRatePercent)}</strong>
            </article>
            <article>
              <span>Current Run</span>
              <strong>{runId ? `Loaded run ${runId.slice(0, 8)}...` : 'New run (unsaved)'}</strong>
            </article>
          </div>
        )}

        <div className="wizard-actions">
          <button
            type="button"
            className="ghost"
            disabled={loading || stepIndex === 0}
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
          >
            Back
          </button>
          {stepIndex < steps.length - 1 ? (
            <button type="button" disabled={loading || !canAdvance} onClick={() => setStepIndex((prev) => prev + 1)}>
              Continue
            </button>
          ) : (
            <button type="submit" disabled={loading}>
              {loading ? 'Running...' : 'Run 5 Year Projections'}
            </button>
          )}
          <button type="button" disabled={!result || pdfLoading} onClick={downloadPdf}>
            {pdfLoading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>

        {error ? <p className="wizard-error">{error}</p> : null}
        {pdfError ? <p className="wizard-error">{pdfError}</p> : null}
      </form>

      {result ? (
        <section className="wizard-result">
          <div className="wizard-kpis">
            <article>
              <span>Start Year Revenue</span>
              <strong>{currency(result.years?.[0]?.revenue)}</strong>
            </article>
            <article>
              <span>Year 5 Revenue</span>
              <strong>{currency(result.years?.[4]?.revenue)}</strong>
            </article>
            <article>
              <span>Year 5 EBITDA</span>
              <strong>{currency(result.years?.[4]?.ebitda)}</strong>
            </article>
            <article>
              <span>Year 5 Net Income</span>
              <strong>{currency(result.years?.[4]?.netIncome)}</strong>
            </article>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>COGS</th>
                  <th>Gross Profit</th>
                  <th>Gross Margin %</th>
                  <th>Fixed Expenses</th>
                  <th>EBITDA</th>
                  <th>EBITDA Margin %</th>
                  <th>Taxes</th>
                  <th>Net Income</th>
                </tr>
              </thead>
              <tbody>
                {(result.years || []).map((row) => (
                  <tr key={`result-${row.year}`}>
                    <td>{row.year}</td>
                    <td>{currency(row.revenue)}</td>
                    <td>{currency(row.cogs)}</td>
                    <td>{currency(row.grossProfit)}</td>
                    <td>{percent(row.grossMarginPct)}</td>
                    <td>{currency(row.fixedExpenses)}</td>
                    <td>{currency(row.ebitda)}</td>
                    <td>{percent(row.ebitdaMarginPct)}</td>
                    <td>{currency(row.taxes)}</td>
                    <td>{currency(row.netIncome)}</td>
                  </tr>
                ))}
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

          {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}
        </section>
      ) : null}
    </section>
  );
}
