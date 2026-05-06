'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import usePrefillableForm from '@/lib/client/usePrefillableForm';

const steps = [
  { id: 'revenue', title: 'Revenue & Direct Costs', hint: 'Define sales, COGS, labor, and profit.' },
  { id: 'fixed', title: 'Fixed & Indirect Costs', hint: 'Split costs the way the BMS workbook does.' },
  { id: 'capacity', title: 'Period & Capacity', hint: 'Convert breakeven into period, daily, and hourly targets.' },
  { id: 'review', title: 'Review & Run', hint: 'Confirm assumptions and run calculation.' },
];

const defaultForm = {
  annualRevenue: '',
  cogsAmount: '',
  profitAmount: '',
  laborAmount: '',
  fixedExpensesAmount: '',
  indirectCostsAmount: '',
  generalAdministrativeCostsAmount: '',
  monthsInPeriod: '12',
  workDaysPerYear: '250',
  workHoursPerDay: '8',
};

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function pickLatestYearRow(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  return rows.reduce((latest, row) => {
    if (!latest) return row;
    const rowYear = Number(row?.year);
    const latestYear = Number(latest?.year);
    if (Number.isFinite(rowYear) && Number.isFinite(latestYear)) {
      return rowYear >= latestYear ? row : latest;
    }
    return row;
  }, null);
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

export default function BreakevenWizard({ clientId }) {
  const [stepIndex, setStepIndex] = useState(0);
  const { form, setFieldValue, resetForm, applyPrefill, clearPrefillTracking, prefilledFields, touchedFields } =
    usePrefillableForm(defaultForm);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pullLoading, setPullLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [pullError, setPullError] = useState('');
  const [pullAudit, setPullAudit] = useState('');

  const progress = ((stepIndex + 1) / steps.length) * 100;

  const canAdvance = useMemo(() => {
    if (stepIndex === 0) return parseNumber(form.annualRevenue) > 0;
    if (stepIndex === 1) {
      return (
        parseNumber(form.fixedExpensesAmount) >= 0 ||
        parseNumber(form.indirectCostsAmount) >= 0 ||
        parseNumber(form.generalAdministrativeCostsAmount) >= 0
      );
    }
    if (stepIndex === 2) return parseNumber(form.workDaysPerYear) > 0 && parseNumber(form.workHoursPerDay) > 0;
    return true;
  }, [form, stepIndex]);

  function updateField(name, value) {
    setFieldValue(name, value);
  }

  function loadRun(run) {
    if (!run) return;
    resetForm({ ...defaultForm, ...(run.inputs || {}) });
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setStepIndex(steps.length - 1);
    setError('');
    setPdfError('');
    setPullError('');
    setPullAudit('');
  }

  function resetToNewRun() {
    resetForm(defaultForm);
    setResult(null);
    setRunId('');
    setStepIndex(0);
    setError('');
    setPdfError('');
    setPullError('');
    setPullAudit('');
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchRuns() {
      if (!clientId) return;
      setRunsLoading(true);
      try {
        const response = await fetch(`/api/worksheets/breakeven/runs?client_id=${encodeURIComponent(clientId)}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load breakeven history.');
        }

        const fetchedRuns = data.runs || [];
        if (cancelled) return;
        setRuns(fetchedRuns);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load breakeven history.');
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

  async function pullLinkedData() {
    if (!clientId) return;

    setPullLoading(true);
    setPullError('');
    setError('');

    try {
      const response = await fetch(
        `/api/worksheets/pl-comparisons/runs?client_id=${encodeURIComponent(clientId)}&limit=1`,
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to load P&L Comparisons runs.');
      }

      const sourceRun = data.runs?.[0];
      if (!sourceRun) {
        throw new Error('No P&L Comparisons runs found to prefill from.');
      }

      const latestYear = pickLatestYearRow(sourceRun?.inputs?.years);
      if (!latestYear) {
        throw new Error('Latest P&L run has no 4-year input grid to map from.');
      }

      const patch = {};
      const missingFields = [];

      if (isFiniteNumber(latestYear.revenue)) {
        patch.annualRevenue = Number(latestYear.revenue);
      } else {
        missingFields.push('Annual Revenue');
      }

      if (isFiniteNumber(latestYear.cogs)) {
        patch.cogsAmount = Number(latestYear.cogs);
      } else {
        missingFields.push('COGS Amount');
      }

      if (isFiniteNumber(latestYear.operatingExpenses) && isFiniteNumber(latestYear.otherExpenses)) {
        patch.indirectCostsAmount = Number(latestYear.operatingExpenses);
        patch.generalAdministrativeCostsAmount = Number(latestYear.otherExpenses);
        patch.fixedExpensesAmount = Number(latestYear.otherExpenses);
      } else {
        missingFields.push('Indirect and G&A costs');
      }

      if (isFiniteNumber(latestYear.netProfit)) {
        patch.profitAmount = Number(latestYear.netProfit);
      }

      if (Object.keys(patch).length === 0) {
        throw new Error(`Could not map any Breakeven fields from P&L Comparisons. Missing: ${missingFields.join(', ')}`);
      }

      applyPrefill(patch, 'P&L Comparisons');

      if (missingFields.length > 0) {
        setPullError(`Some fields were not prefilled: ${missingFields.join(', ')}.`);
      }

      setPullAudit(`Prefilled from P&L Comparisons run ${formatRunTimestamp(sourceRun.created_at)}`);
      setStepIndex(0);
    } catch (err) {
      setPullError(err.message || 'Unable to prefill from P&L Comparisons.');
    } finally {
      setPullLoading(false);
    }
  }

  async function calculateAndSave(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        annualRevenue: parseNumber(form.annualRevenue),
        cogsAmount: parseNumber(form.cogsAmount),
        profitAmount: parseOptionalNumber(form.profitAmount),
        laborAmount: parseOptionalNumber(form.laborAmount),
        fixedExpensesAmount: parseNumber(form.fixedExpensesAmount),
        indirectCostsAmount: parseOptionalNumber(form.indirectCostsAmount),
        generalAdministrativeCostsAmount: parseOptionalNumber(form.generalAdministrativeCostsAmount),
        monthsInPeriod: parseOptionalNumber(form.monthsInPeriod),
        workDaysPerYear: parseNumber(form.workDaysPerYear),
        workHoursPerDay: parseNumber(form.workHoursPerDay),
      };

      const calculationResponse = await fetch('/api/worksheets/breakeven/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Breakeven calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/breakeven/runs', {
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
      clearPrefillTracking();
    } catch (err) {
      setError(err.message || 'Unable to complete breakeven run.');
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
        body: JSON.stringify({ model: 'breakeven', result: { ...result, clientId, runId } }),
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
      link.download = 'bms-breakeven-analysis-report.pdf';
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
        <h1>Breakeven Analysis</h1>
        <p>
          Source-aligned BMS breakeven workflow. The app rebuilds the workbook formulas server-side and keeps the
          original spreadsheets as provenance.
        </p>
      </header>

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
              Annual Revenue
              <WorksheetInput
                type="number"
                min="0"
                value={form.annualRevenue}
                onChange={(event) => updateField('annualRevenue', event.target.value)}
                placeholder="e.g. 1250000"
                isPrefilled={Boolean(prefilledFields.annualRevenue)}
                isTouched={Boolean(touchedFields.annualRevenue)}
              />
            </label>
            <label>
              COGS Amount
              <WorksheetInput
                type="number"
                min="0"
                value={form.cogsAmount}
                onChange={(event) => updateField('cogsAmount', event.target.value)}
                placeholder="e.g. 700000"
                isPrefilled={Boolean(prefilledFields.cogsAmount)}
                isTouched={Boolean(touchedFields.cogsAmount)}
              />
            </label>
            <label>
              Net Profit
              <WorksheetInput
                type="number"
                min="0"
                value={form.profitAmount}
                onChange={(event) => updateField('profitAmount', event.target.value)}
                placeholder="Optional, from BMS standalone breakeven"
                isPrefilled={Boolean(prefilledFields.profitAmount)}
                isTouched={Boolean(touchedFields.profitAmount)}
              />
            </label>
            <label>
              Direct Labor
              <WorksheetInput
                type="number"
                min="0"
                value={form.laborAmount}
                onChange={(event) => updateField('laborAmount', event.target.value)}
                placeholder="Optional direct labor"
                isPrefilled={Boolean(prefilledFields.laborAmount)}
                isTouched={Boolean(touchedFields.laborAmount)}
              />
            </label>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="wizard-fields">
            <label>
              Fixed Expenses
              <WorksheetInput
                type="number"
                min="0"
                value={form.fixedExpensesAmount}
                onChange={(event) => updateField('fixedExpensesAmount', event.target.value)}
                placeholder="Standalone fixed cost bucket"
                isPrefilled={Boolean(prefilledFields.fixedExpensesAmount)}
                isTouched={Boolean(touchedFields.fixedExpensesAmount)}
              />
            </label>
            <label>
              Indirect Costs
              <WorksheetInput
                type="number"
                min="0"
                value={form.indirectCostsAmount}
                onChange={(event) => updateField('indirectCostsAmount', event.target.value)}
                placeholder="Analyst Program L3"
                isPrefilled={Boolean(prefilledFields.indirectCostsAmount)}
                isTouched={Boolean(touchedFields.indirectCostsAmount)}
              />
            </label>
            <label>
              General & Administrative Costs
              <WorksheetInput
                type="number"
                min="0"
                value={form.generalAdministrativeCostsAmount}
                onChange={(event) => updateField('generalAdministrativeCostsAmount', event.target.value)}
                placeholder="Analyst Program L4"
                isPrefilled={Boolean(prefilledFields.generalAdministrativeCostsAmount)}
                isTouched={Boolean(touchedFields.generalAdministrativeCostsAmount)}
              />
            </label>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="wizard-fields">
            <label>
              Months In Period
              <WorksheetInput
                type="number"
                min="1"
                value={form.monthsInPeriod}
                onChange={(event) => updateField('monthsInPeriod', event.target.value)}
                placeholder="e.g. 12"
                isPrefilled={Boolean(prefilledFields.monthsInPeriod)}
                isTouched={Boolean(touchedFields.monthsInPeriod)}
              />
            </label>
            <label>
              Work Days Per Year
              <WorksheetInput
                type="number"
                min="1"
                value={form.workDaysPerYear}
                onChange={(event) => updateField('workDaysPerYear', event.target.value)}
                placeholder="e.g. 250"
                isPrefilled={Boolean(prefilledFields.workDaysPerYear)}
                isTouched={Boolean(touchedFields.workDaysPerYear)}
              />
            </label>
            <label>
              Work Hours Per Day
              <WorksheetInput
                type="number"
                min="1"
                value={form.workHoursPerDay}
                onChange={(event) => updateField('workHoursPerDay', event.target.value)}
                placeholder="e.g. 8"
                isPrefilled={Boolean(prefilledFields.workHoursPerDay)}
                isTouched={Boolean(touchedFields.workHoursPerDay)}
              />
            </label>
          </div>
        )}

        {stepIndex === 3 && (
          <div className="client-review-grid">
            <article>
              <span>Annual Revenue</span>
              <strong>{currency(form.annualRevenue)}</strong>
            </article>
            <article>
              <span>COGS</span>
              <strong>{currency(form.cogsAmount)}</strong>
            </article>
            <article>
              <span>Fixed Expenses</span>
              <strong>{currency(form.fixedExpensesAmount)}</strong>
            </article>
            <article>
              <span>Indirect / G&A</span>
              <strong>
                {currency(form.indirectCostsAmount)} / {currency(form.generalAdministrativeCostsAmount)}
              </strong>
            </article>
            <article>
              <span>Work Capacity</span>
              <strong>
                {parseNumber(form.monthsInPeriod)} months · {parseNumber(form.workDaysPerYear)} days x{' '}
                {parseNumber(form.workHoursPerDay)} hrs
              </strong>
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
              {loading ? 'Running...' : 'Run Breakeven Analysis'}
            </button>
          )}
          <button type="button" disabled={!result || pdfLoading} onClick={downloadPdf}>
            {pdfLoading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>

        {error ? <p className="wizard-error">{error}</p> : null}
        {pullError ? <p className="wizard-error">{pullError}</p> : null}
        {pdfError ? <p className="wizard-error">{pdfError}</p> : null}
      </form>

      {result ? (
        <section className="wizard-result">
          <div className="wizard-kpis">
            <article>
              <span>Gross Margin ($)</span>
              <strong>{currency(result.grossMarginAmount)}</strong>
            </article>
            <article>
              <span>Gross Margin (%)</span>
              <strong>{percent(result.grossMarginPercent)}</strong>
            </article>
            <article>
              <span>Breakeven Revenue</span>
              <strong>{currency(result.breakevenRevenue)}</strong>
            </article>
            <article>
              <span>Breakeven % of Current Revenue</span>
              <strong>{percent(result.breakevenPercent)}</strong>
            </article>
          </div>

          <div className="wizard-kpis">
            <article>
              <span>Net Profit</span>
              <strong>{currency(result.netProfitAmount)}</strong>
            </article>
            <article>
              <span>Variable Costs</span>
              <strong>{currency(result.variableCostsAmount)}</strong>
            </article>
            <article>
              <span>Fixed Costs</span>
              <strong>{currency(result.fixedCostsAmount)}</strong>
            </article>
            <article>
              <span>Breakeven Days</span>
              <strong>{result.breakevenDays === null || result.breakevenDays === undefined ? 'n/a' : Number(result.breakevenDays).toFixed(1)}</strong>
            </article>
          </div>

          <div className="wizard-kpis">
            <article>
              <span>Breakeven Monthly</span>
              <strong>{currency(result.breakevenMonthly)}</strong>
            </article>
            <article>
              <span>Breakeven Weekly</span>
              <strong>{currency(result.breakevenWeekly)}</strong>
            </article>
            <article>
              <span>Breakeven Daily</span>
              <strong>{currency(result.breakevenDaily)}</strong>
            </article>
            <article>
              <span>Breakeven Hourly</span>
              <strong>{currency(result.breakevenHourly)}</strong>
            </article>
          </div>

          <p className="wizard-meta">Formula basis: {result.formulaBasis}</p>

          {(result.notes || []).length > 0 ? (
            <ul className="warnings">
              {result.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}

          {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}
        </section>
      ) : null}

      <section className="wizard-history" aria-label="Breakeven run history">
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
          <button type="button" className="ghost" onClick={pullLinkedData} disabled={loading || pullLoading || !clientId}>
            {pullLoading ? 'Pulling...' : 'Pull from P&L Comparisons'}
          </button>
        </div>
        {pullAudit ? <p className="wizard-meta">{pullAudit}</p> : null}
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
