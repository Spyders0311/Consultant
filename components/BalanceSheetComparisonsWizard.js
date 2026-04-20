'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';

const steps = [
  { id: 'grid', title: 'Enter 4 Years', hint: 'Input the core balance sheet lines by year.' },
  { id: 'review', title: 'Review & Run', hint: 'Validate assumptions and run calculations.' },
  { id: 'results', title: 'Results', hint: 'Review outputs, run checks, and export PDF.' },
];

const lineItems = [
  { key: 'cash', label: 'Cash' },
  { key: 'ar', label: 'Accounts Receivable' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'otherCurrentAssets', label: 'Other Current Assets' },
  { key: 'fixedAssets', label: 'Fixed Assets' },
  { key: 'otherAssets', label: 'Other Assets' },
  { key: 'ap', label: 'Accounts Payable' },
  { key: 'otherCurrentLiabilities', label: 'Other Current Liabilities' },
  { key: 'longTermDebt', label: 'Long-Term Debt' },
  { key: 'otherLiabilities', label: 'Other Liabilities' },
  { key: 'equity', label: 'Equity' },
];

function makeDefaultYears() {
  return Array.from({ length: 4 }, (_, idx) => ({
    year: '',
    cash: '',
    ar: '',
    inventory: '',
    otherCurrentAssets: '',
    fixedAssets: '',
    otherAssets: '',
    ap: '',
    otherCurrentLiabilities: '',
    longTermDebt: '',
    otherLiabilities: '',
    equity: '',
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

function ratio(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return Number(value).toFixed(2);
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

export default function BalanceSheetComparisonsWizard({ clientId }) {
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
      return years.length === 4 && years.every((row) => parseNumber(row.year) > 1900);
    }
    if (stepIndex === 1) return true;
    return Boolean(result);
  }, [stepIndex, years, result]);

  function updateYearCell(index, field, value) {
    setYears((prev) => prev.map((row, rowIdx) => (rowIdx === index ? { ...row, [field]: value } : row)));
  }

  function normalizeInputYears(inputYears) {
    const normalized = inputYears.slice(0, 4).map((row) => ({
      year: parseNumber(row?.year),
      cash: parseNumber(row?.cash),
      ar: parseNumber(row?.ar),
      inventory: parseNumber(row?.inventory),
      otherCurrentAssets: parseNumber(row?.otherCurrentAssets),
      fixedAssets: parseNumber(row?.fixedAssets),
      otherAssets: parseNumber(row?.otherAssets),
      ap: parseNumber(row?.ap),
      otherCurrentLiabilities: parseNumber(row?.otherCurrentLiabilities),
      longTermDebt: parseNumber(row?.longTermDebt),
      otherLiabilities: parseNumber(row?.otherLiabilities),
      equity: parseNumber(row?.equity),
    }));

    return normalized.length === 4 ? normalized : makeDefaultYears();
  }

  function loadRun(run) {
    if (!run) return;
    const inputYears = Array.isArray(run.inputs?.years) ? run.inputs.years : [];

    setYears(normalizeInputYears(inputYears));
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
        const response = await fetch(
          `/api/worksheets/balance-sheet-comparisons/runs?client_id=${encodeURIComponent(clientId)}`,
          {
            cache: 'no-store',
          },
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load balance sheet comparison history.');
        }

        const fetchedRuns = data.runs || [];
        if (cancelled) return;

        setRuns(fetchedRuns);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load balance sheet comparison history.');
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
          cash: parseNumber(row.cash),
          ar: parseNumber(row.ar),
          inventory: parseNumber(row.inventory),
          otherCurrentAssets: parseNumber(row.otherCurrentAssets),
          fixedAssets: parseNumber(row.fixedAssets),
          otherAssets: parseNumber(row.otherAssets),
          ap: parseNumber(row.ap),
          otherCurrentLiabilities: parseNumber(row.otherCurrentLiabilities),
          longTermDebt: parseNumber(row.longTermDebt),
          otherLiabilities: parseNumber(row.otherLiabilities),
          equity: parseNumber(row.equity),
        })),
      };

      const calculationResponse = await fetch('/api/worksheets/balance-sheet-comparisons/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Balance sheet comparison calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/balance-sheet-comparisons/runs', {
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
      setError(err.message || 'Unable to complete balance sheet comparison run.');
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
        body: JSON.stringify({ model: 'balance-sheet-comparisons', result: { ...result, clientId, runId } }),
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
      link.download = 'bms-balance-sheet-comparisons-report.pdf';
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
        <h1>Balance Sheet Comparisons</h1>
        <p>Enter four years of key balance sheet lines, run backend checks, and export a consultant-ready PDF.</p>
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
        {stepIndex === 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  {lineItems.map((item) => (
                    <th key={`head-${item.key}`}>{item.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map((row, idx) => (
                  <tr key={`edit-${row.year}-${idx}`}>
                    <td>
                      <WorksheetInput
                        type="number"
                        min="1900"
                        value={row.year}
                        onChange={(event) => updateYearCell(idx, 'year', event.target.value)}
                        placeholder="e.g. 2026"
                      />
                    </td>
                    {lineItems.map((item) => (
                      <td key={`cell-${item.key}-${idx}`}>
                        <WorksheetInput
                          type="number"
                          min="0"
                          value={row[item.key]}
                          onChange={(event) => updateYearCell(idx, item.key, event.target.value)}
                          placeholder="e.g. 250000"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {stepIndex === 1 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  {lineItems.map((item) => (
                    <th key={`review-head-${item.key}`}>{item.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map((row, idx) => (
                  <tr key={`review-${row.year}-${idx}`}>
                    <td>{parseNumber(row.year)}</td>
                    {lineItems.map((item) => (
                      <td key={`review-${item.key}-${idx}`}>{currency(row[item.key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {stepIndex === 2 && result ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Total Current Assets</th>
                  <th>Total Assets</th>
                  <th>Total Current Liabilities</th>
                  <th>Total Liabilities</th>
                  <th>Working Capital</th>
                  <th>Current Ratio</th>
                  <th>Debt to Equity</th>
                  <th>Balance Difference</th>
                  <th>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {(result.years || []).map((row) => (
                  <tr key={`result-${row.year}`}>
                    <td>{row.year}</td>
                    <td>{currency(row.totalCurrentAssets)}</td>
                    <td>{currency(row.totalAssets)}</td>
                    <td>{currency(row.totalCurrentLiabilities)}</td>
                    <td>{currency(row.totalLiabilities)}</td>
                    <td>{currency(row.workingCapital)}</td>
                    <td>{ratio(row.currentRatio)}</td>
                    <td>{ratio(row.debtToEquity)}</td>
                    <td>{currency(row?.checks?.balanceDifference)}</td>
                    <td>{Array.isArray(row.warnings) && row.warnings.length > 0 ? row.warnings.join(' ') : 'None'}</td>
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
              {loading ? 'Running...' : 'Run Balance Sheet Comparison'}
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
              <span>Latest Total Assets</span>
              <strong>{currency(result.years?.[result.years.length - 1]?.totalAssets)}</strong>
            </article>
            <article>
              <span>Latest Current Ratio</span>
              <strong>{ratio(result.years?.[result.years.length - 1]?.currentRatio)}</strong>
            </article>
            <article>
              <span>Latest Debt to Equity</span>
              <strong>{ratio(result.years?.[result.years.length - 1]?.debtToEquity)}</strong>
            </article>
          </div>

          {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}
        </section>
      ) : null}

      <section className="wizard-history" aria-label="Balance sheet comparison run history">
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
