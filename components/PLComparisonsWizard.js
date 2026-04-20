'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';

const steps = [
  { id: 'grid', title: 'Enter 4 Years', hint: 'Input revenue and expense buckets by year.' },
  { id: 'review', title: 'Review & Run', hint: 'Validate assumptions, then run.' },
  { id: 'results', title: 'Results', hint: 'View trends, load history, and export PDF.' },
];

function makeDefaultYears() {
  return Array.from({ length: 4 }, (_, idx) => ({
    year: '',
    revenue: '',
    cogs: '',
    operatingExpenses: '',
    otherExpenses: '',
  }));
}

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

export default function PLComparisonsWizard({ clientId }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [years, setYears] = useState(makeDefaultYears);
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
      return years.length === 4 && years.every((row) => parseNumber(row.year) > 1900 && parseNumber(row.revenue) >= 0);
    }
    if (stepIndex === 1) return true;
    return Boolean(result);
  }, [stepIndex, years, result]);

  function updateYearCell(index, field, value) {
    setYears((prev) => prev.map((row, rowIdx) => (rowIdx === index ? { ...row, [field]: value } : row)));
  }

  function loadRun(run) {
    if (!run) return;
    const inputYears = Array.isArray(run.inputs?.years) ? run.inputs.years : [];
    const normalized = inputYears.slice(0, 4).map((row) => ({
      year: parseNumber(row?.year),
      revenue: parseNumber(row?.revenue),
      cogs: parseNumber(row?.cogs),
      operatingExpenses: parseNumber(row?.operatingExpenses),
      otherExpenses: parseNumber(row?.otherExpenses),
    }));

    setYears(normalized.length === 4 ? normalized : makeDefaultYears());
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setStepIndex(2);
    setError('');
    setPdfError('');
  }

  function resetToNewRun() {
    setYears(makeDefaultYears());
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
        const response = await fetch(`/api/worksheets/pl-comparisons/runs?client_id=${encodeURIComponent(clientId)}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load P&L comparison history.');
        }

        const fetchedRuns = data.runs || [];
        if (cancelled) return;

        setRuns(fetchedRuns);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load P&L comparison history.');
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
        years: years.map((row) => ({
          year: parseNumber(row.year),
          revenue: parseNumber(row.revenue),
          cogs: parseNumber(row.cogs),
          operatingExpenses: parseNumber(row.operatingExpenses),
          otherExpenses: parseNumber(row.otherExpenses),
        })),
      };

      const calculationResponse = await fetch('/api/worksheets/pl-comparisons/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'P&L comparison calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/pl-comparisons/runs', {
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
      setStepIndex(2);
    } catch (err) {
      setError(err.message || 'Unable to complete P&L comparison run.');
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
        body: JSON.stringify({ model: 'pl-comparisons', result: { ...result, clientId, runId } }),
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
      link.download = 'bms-pl-comparisons-report.pdf';
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
        <h1>P&L Comparisons</h1>
        <p>Enter a four-year P&L view, run protected calculations, review trends, and export a consultant-ready PDF.</p>
      </header>

      <div className="wizard-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className="wizard-step-list">
        {steps.map((step, idx) => {
          const isCurrent = idx === stepIndex;
          const isCompleted = idx < stepIndex;
          const isResultsStep = idx === 2;
          const canJump = idx <= stepIndex || (idx === stepIndex + 1 && canAdvance) || (isResultsStep && Boolean(result));

          return (
            <li key={step.id}>
              <button
                type="button"
                className={`wizard-step-button ${isCurrent ? 'active' : ''} ${isCompleted ? 'complete' : ''}`}
                onClick={() => setStepIndex(idx)}
                disabled={loading || !canJump}
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
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>COGS</th>
                  <th>Operating Expenses</th>
                  <th>Other Expenses</th>
                </tr>
              </thead>
              <tbody>
                {years.map((row, idx) => (
                  <tr key={`${row.year}-${idx}`}>
                    <td>
                      <WorksheetInput
                        type="number"
                        min="1900"
                        value={row.year}
                        onChange={(event) => updateYearCell(idx, 'year', event.target.value)}
                        placeholder="e.g. 2026"
                      />
                    </td>
                    <td>
                      <WorksheetInput
                        type="number"
                        min="0"
                        value={row.revenue}
                        onChange={(event) => updateYearCell(idx, 'revenue', event.target.value)}
                        placeholder="e.g. 1250000"
                      />
                    </td>
                    <td>
                      <WorksheetInput
                        type="number"
                        min="0"
                        value={row.cogs}
                        onChange={(event) => updateYearCell(idx, 'cogs', event.target.value)}
                        placeholder="e.g. 700000"
                      />
                    </td>
                    <td>
                      <WorksheetInput
                        type="number"
                        min="0"
                        value={row.operatingExpenses}
                        onChange={(event) => updateYearCell(idx, 'operatingExpenses', event.target.value)}
                        placeholder="e.g. 220000"
                      />
                    </td>
                    <td>
                      <WorksheetInput
                        type="number"
                        min="0"
                        value={row.otherExpenses}
                        onChange={(event) => updateYearCell(idx, 'otherExpenses', event.target.value)}
                        placeholder="e.g. 80000"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>COGS</th>
                  <th>Operating Expenses</th>
                  <th>Other Expenses</th>
                </tr>
              </thead>
              <tbody>
                {years.map((row, idx) => (
                  <tr key={`review-${row.year}-${idx}`}>
                    <td>{parseNumber(row.year)}</td>
                    <td>{currency(row.revenue)}</td>
                    <td>{currency(row.cogs)}</td>
                    <td>{currency(row.operatingExpenses)}</td>
                    <td>{currency(row.otherExpenses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stepIndex === 2 && result ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Gross Profit</th>
                  <th>Gross Margin %</th>
                  <th>EBIT</th>
                  <th>EBIT Margin %</th>
                  <th>Net Income</th>
                  <th>Revenue YoY %</th>
                  <th>Net Income YoY %</th>
                </tr>
              </thead>
              <tbody>
                {(result.years || []).map((row) => (
                  <tr key={`result-${row.year}`}>
                    <td>{row.year}</td>
                    <td>{currency(row.grossProfit)}</td>
                    <td>{percent(row.grossMarginPct)}</td>
                    <td>{currency(row.ebit)}</td>
                    <td>{percent(row.ebitMarginPct)}</td>
                    <td>{currency(row.netIncome)}</td>
                    <td>{percent(row?.trend?.revenueYoYPct)}</td>
                    <td>{percent(row?.trend?.netIncomeYoYPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="wizard-actions">
          <button
            type="button"
            className="ghost"
            disabled={loading || stepIndex === 0}
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
          >
            Back
          </button>
          {stepIndex < 1 ? (
            <button type="button" disabled={loading || !canAdvance} onClick={() => setStepIndex((prev) => prev + 1)}>
              Continue
            </button>
          ) : stepIndex === 1 ? (
            <button type="submit" disabled={loading}>
              {loading ? 'Running...' : 'Run P&L Comparison'}
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={() => setStepIndex(1)}>
              Re-Run
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
              <span>Latest Year</span>
              <strong>{result.years?.[result.years.length - 1]?.year || 'n/a'}</strong>
            </article>
            <article>
              <span>Latest Gross Margin %</span>
              <strong>{percent(result.years?.[result.years.length - 1]?.grossMarginPct)}</strong>
            </article>
            <article>
              <span>Latest EBIT Margin %</span>
              <strong>{percent(result.years?.[result.years.length - 1]?.ebitMarginPct)}</strong>
            </article>
            <article>
              <span>Latest Net Income</span>
              <strong>{currency(result.years?.[result.years.length - 1]?.netIncome)}</strong>
            </article>
          </div>

          {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}
        </section>
      ) : null}

      <section className="wizard-history" aria-label="P&L comparison run history">
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
    </section>
  );
}
