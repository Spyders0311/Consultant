'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import PLLineItemsEditor from '@/components/worksheet/PLLineItemsEditor';
import { patchFinancialSnapshot } from '@/lib/client/patchFinancialSnapshot';
import { fetchFinancialSnapshot } from '@/lib/client/fetchFinancialSnapshot';
import { buildSnapshotPatch } from '@/lib/worksheets/snapshotWriteFields';
import { rollupPLLineItems } from '@/lib/worksheets/plRollup';
import PortBridgePanel from '@/components/worksheet/PortBridgePanel';
import useWorksheetStepDraft from '@/lib/client/useWorksheetStepDraft';
import useWorksheetShellRunLoader from '@/lib/client/useWorksheetShellRunLoader';
import { pushTwelveMonthPLToAnnual } from '@/lib/client/pushFeederToPL';

const steps = [
  { id: 'grid', title: 'Enter 4 Years', hint: 'Use summary buckets or detailed line items per year.' },
  { id: 'review', title: 'Review & Run', hint: 'Validate assumptions, then run.' },
  { id: 'results', title: 'Results', hint: 'View trends, load history, and export PDF.' },
];

function makeDefaultYears() {
  return Array.from({ length: 4 }, () => ({
    year: '',
    revenue: '',
    cogs: '',
    operatingExpenses: '',
    otherExpenses: '',
    lineItems: [],
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

export default function PLComparisonsWizard({ clientId, clientRow = null }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [years, setYears] = useState(makeDefaultYears);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [inputMode, setInputMode] = useState('buckets');
  const [activeYearIndex, setActiveYearIndex] = useState(0);
  const [snapshotPrefilled, setSnapshotPrefilled] = useState(false);

  const draftPayload = useMemo(() => ({ years, inputMode, activeYearIndex }), [years, inputMode, activeYearIndex]);
  useWorksheetStepDraft({
    clientId,
    worksheetKey: 'p-l-comparisons',
    stepIndex,
    setStepIndex,
    draftPayload,
    onRestoreDraft: (draft) => {
      if (Array.isArray(draft.years)) {
        setYears(draft.years);
      }
      if (typeof draft.inputMode === 'string') {
        setInputMode(draft.inputMode);
      }
      if (typeof draft.activeYearIndex === 'number') {
        setActiveYearIndex(draft.activeYearIndex);
      }
    },
  });

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

  function updateYearLineItems(index, lineItems) {
    const rollup = rollupPLLineItems(
      lineItems.map((line) => ({ category: line.category, amount: Number(line.amount) || 0 })),
    );
    setYears((prev) =>
      prev.map((row, rowIdx) =>
        rowIdx === index
          ? {
              ...row,
              lineItems,
              revenue: rollup.revenue || row.revenue,
              cogs: rollup.cogs || row.cogs,
              operatingExpenses: rollup.operatingExpenses || row.operatingExpenses,
              otherExpenses: rollup.otherExpenses || row.otherExpenses,
            }
          : row,
      ),
    );
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
      lineItems: Array.isArray(row?.lineItems) ? row.lineItems : [],
    }));

    const hasLineItems = normalized.some((row) => row.lineItems.length > 0);
    setInputMode(hasLineItems ? 'lineItems' : 'buckets');

    setYears(normalized.length === 4 ? normalized : makeDefaultYears());
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setStepIndex(2);
    setError('');
    setPdfError('');
  }

  useWorksheetShellRunLoader(loadRun);

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
    async function prefillFromSnapshot() {
      if (!clientId || snapshotPrefilled) return;
      try {
        const data = await fetchFinancialSnapshot(clientId);
        const snap = data.snapshot || {};
        const latestIndex = 3;
        setYears((prev) => {
          const next = [...prev];
          const row = { ...next[latestIndex] };
          let changed = false;
          if (!row.revenue && snap.annualRevenue != null) {
            row.revenue = snap.annualRevenue;
            changed = true;
          }
          if (!row.cogs && snap.annualCogs != null) {
            row.cogs = snap.annualCogs;
            changed = true;
          }
          if (!row.operatingExpenses && snap.annualOperatingExpenses != null) {
            row.operatingExpenses = snap.annualOperatingExpenses;
            changed = true;
          }
          if (!row.otherExpenses && snap.annualOtherExpenses != null) {
            row.otherExpenses = snap.annualOtherExpenses;
            changed = true;
          }
          if (changed) next[latestIndex] = row;
          return changed ? next : prev;
        });
        if (!cancelled) setSnapshotPrefilled(true);
      } catch {
        // best-effort
      }
    }
    prefillFromSnapshot();
    return () => {
      cancelled = true;
    };
  }, [clientId, snapshotPrefilled]);

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

  async function generateFourYearHistory() {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const [miscDirectRes, miscIndirectRes] = await Promise.all([
        fetch(`/api/worksheets/misc-direct-expenses/runs?client_id=${encodeURIComponent(clientId)}&limit=1`),
        fetch(`/api/worksheets/misc-indirect-expenses/runs?client_id=${encodeURIComponent(clientId)}&limit=1`),
      ]);
      const [miscDirectData, miscIndirectData] = await Promise.all([miscDirectRes.json(), miscIndirectRes.json()]);

      const response = await fetch('/api/worksheets/four-year-history/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: mapClientRowToApiClient(clientRow),
          miscDirect: miscDirectData.runs?.[0]?.outputs || null,
          miscIndirect: miscIndirectData.runs?.[0]?.outputs || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to generate 4-year history.');

      const plYears = data.result?.plYears || [];
      if (plYears.length === 4) {
        setYears(
          plYears.map((row) => ({
            year: row.year,
            revenue: row.revenue,
            cogs: row.cogs,
            operatingExpenses: row.operatingExpenses,
            otherExpenses: row.otherExpenses,
          })),
        );
      }
    } catch (err) {
      setHistoryError(err.message || 'Unable to generate 4-year history.');
    } finally {
      setHistoryLoading(false);
    }
  }

  function handlePortBridgePatch(patch) {
    if (patch?.plLines) {
      const rolled = rollupPLLineItems(patch.plLines);
      setYears((prev) => {
        const next = [...prev];
        const idx = next.length - 1;
        next[idx] = {
          ...next[idx],
          lineItems: patch.plLines,
          revenue: rolled.revenue,
          cogs: rolled.cogs,
          operatingExpenses: rolled.operatingExpenses,
          otherExpenses: rolled.otherExpenses,
        };
        return next;
      });
      setInputMode('lineItems');
      setHistoryError('');
    }
  }

  async function importFromF1000() {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const response = await fetch(
        `/api/worksheets/workbook-ports/runs?client_id=${encodeURIComponent(clientId)}&workbook_key=f-1000-pl&limit=1`,
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to load F-1000 run.');
      const run = data.runs?.[0];
      const lines = run?.inputs?.plLines || [];
      if (!lines.length) throw new Error('F-1000 run has no P&L lines.');

      const rollup = { revenue: 0, cogs: 0, operatingExpenses: 0, otherExpenses: 0 };
      for (const line of lines) {
        const amount = Number(line.amount || 0);
        const category = String(line.category || '').toLowerCase();
        if (category === 'revenue') rollup.revenue += amount;
        else if (category === 'cogs') rollup.cogs += amount;
        else if (category === 'opex') rollup.operatingExpenses += amount;
        else rollup.otherExpenses += amount;
      }

      setYears((prev) => {
        const next = [...prev];
        const target = next[next.length - 1] || makeDefaultYears()[3];
        next[next.length - 1] = {
          ...target,
          revenue: rollup.revenue,
          cogs: rollup.cogs,
          operatingExpenses: rollup.operatingExpenses,
          otherExpenses: rollup.otherExpenses,
        };
        return next;
      });
    } catch (err) {
      setHistoryError(err.message || 'Unable to import from F-1000.');
    } finally {
      setHistoryLoading(false);
    }
  }

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
          lineItems: (row.lineItems || []).map((line) => ({
            category: line.category,
            description: line.description || '',
            amount: parseNumber(line.amount),
          })),
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
      const latest = payload.years[payload.years.length - 1];
      await patchFinancialSnapshot(
        clientId,
        'p-l-comparisons',
        buildSnapshotPatch('p-l-comparisons', payload, calculationData.result),
      );
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
          <div>
            <div className="wizard-history-actions">
              <button
                type="button"
                className={inputMode === 'buckets' ? 'wizard-step-button active' : 'ghost'}
                onClick={() => setInputMode('buckets')}
              >
                Summary buckets
              </button>
              <button
                type="button"
                className={inputMode === 'lineItems' ? 'wizard-step-button active' : 'ghost'}
                onClick={() => setInputMode('lineItems')}
              >
                Line items
              </button>
            </div>

            {inputMode === 'buckets' ? (
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
            <div className="wizard-history-actions">
              <button type="button" className="ghost" disabled={historyLoading} onClick={generateFourYearHistory}>
                {historyLoading ? 'Generating...' : 'Generate 4-Year History'}
              </button>
              <button type="button" className="ghost" disabled={historyLoading} onClick={importFromF1000}>
                Import from F-1000
              </button>
            </div>
            <PortBridgePanel clientId={clientId} worksheetKey="p-l-comparisons" onApplyPatch={handlePortBridgePatch} />
            {historyError ? <p className="wizard-error">{historyError}</p> : null}
          </div>
            ) : (
              <div>
                <div className="wizard-step-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {years.map((row, idx) => (
                    <button
                      key={`year-tab-${idx}`}
                      type="button"
                      className={activeYearIndex === idx ? 'wizard-step-button active' : 'ghost'}
                      onClick={() => setActiveYearIndex(idx)}
                    >
                      Year {idx + 1}{row.year ? ` (${row.year})` : ''}
                    </button>
                  ))}
                </div>
                <WorksheetInput
                  label="Year"
                  type="number"
                  min="1900"
                  value={years[activeYearIndex]?.year ?? ''}
                  onChange={(e) => updateYearCell(activeYearIndex, 'year', e.target.value)}
                />
                <PLLineItemsEditor
                  yearLabel={`Year ${activeYearIndex + 1}`}
                  lineItems={years[activeYearIndex]?.lineItems || []}
                  onChange={(items) => updateYearLineItems(activeYearIndex, items)}
                />
                <div className="wizard-history-actions">
                  <button type="button" className="ghost" disabled={historyLoading} onClick={generateFourYearHistory}>
                    {historyLoading ? 'Generating...' : 'Generate 4-Year History'}
                  </button>
                  <button type="button" className="ghost" disabled={historyLoading} onClick={importFromF1000}>
                    Import from F-1000
                  </button>
                </div>
                {historyError ? <p className="wizard-error">{historyError}</p> : null}
              </div>
            )}
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
