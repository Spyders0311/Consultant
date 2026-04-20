'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';

const steps = [
  { id: 'revenue-margin', title: 'Revenue / Margin', hint: 'Enter annual revenue and COGS.' },
  { id: 'fixed-expenses', title: 'Fixed Expenses', hint: 'Set annual fixed overhead burden.' },
  { id: 'working-capital', title: 'Working Capital Drivers', hint: 'Set DSO, DIO, and DPO assumptions.' },
  { id: 'capacity', title: 'Capacity', hint: 'Set work days and work hours assumptions.' },
  { id: 'review', title: 'Review & Run', hint: 'Validate assumptions and run baseline intake.' },
];

const defaultForm = {
  annualRevenue: '',
  annualCogs: '',
  annualFixedExpenses: '',
  daysSalesOutstanding: '',
  daysInventoryOnHand: '',
  daysPayablesOutstanding: '',
  workDaysPerYear: '',
  workHoursPerDay: '',
  optionalNotes: '',
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

function number(value, maximumFractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(Number(value));
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

export default function CurrentFinancialInformationWizard({ clientId }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(defaultForm);
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
      return parseNumber(form.annualRevenue) >= 0 && parseNumber(form.annualCogs) >= 0;
    }
    if (stepIndex === 1) {
      return parseNumber(form.annualFixedExpenses) >= 0;
    }
    if (stepIndex === 2) {
      return (
        parseNumber(form.daysSalesOutstanding) >= 0 &&
        parseNumber(form.daysInventoryOnHand) >= 0 &&
        parseNumber(form.daysPayablesOutstanding) >= 0
      );
    }
    if (stepIndex === 3) {
      return parseNumber(form.workDaysPerYear) > 0 && parseNumber(form.workHoursPerDay) > 0;
    }
    return true;
  }, [form, stepIndex]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function loadRun(run) {
    if (!run) return;
    setForm({ ...defaultForm, ...(run.inputs || {}) });
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setStepIndex(steps.length - 1);
    setError('');
    setPdfError('');
  }

  function resetToNewRun() {
    setForm(defaultForm);
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
          `/api/worksheets/current-financial-information/runs?client_id=${encodeURIComponent(clientId)}`,
          {
            cache: 'no-store',
          },
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load current financial information history.');
        }

        const fetchedRuns = data.runs || [];
        if (cancelled) return;
        setRuns(fetchedRuns);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load current financial information history.');
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
        annualRevenue: parseNumber(form.annualRevenue),
        annualCogs: parseNumber(form.annualCogs),
        annualFixedExpenses: parseNumber(form.annualFixedExpenses),
        daysSalesOutstanding: parseNumber(form.daysSalesOutstanding),
        daysInventoryOnHand: parseNumber(form.daysInventoryOnHand),
        daysPayablesOutstanding: parseNumber(form.daysPayablesOutstanding),
        workDaysPerYear: parseNumber(form.workDaysPerYear),
        workHoursPerDay: parseNumber(form.workHoursPerDay),
        optionalNotes: String(form.optionalNotes || '').trim(),
      };

      const calculationResponse = await fetch('/api/worksheets/current-financial-information/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Current financial information calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/current-financial-information/runs', {
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
      setError(err.message || 'Unable to complete current financial information run.');
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
        body: JSON.stringify({
          model: 'current-financial-information',
          result: {
            ...result,
            assumptions: {
              annualRevenue: parseNumber(form.annualRevenue),
              annualCogs: parseNumber(form.annualCogs),
              annualFixedExpenses: parseNumber(form.annualFixedExpenses),
              daysSalesOutstanding: parseNumber(form.daysSalesOutstanding),
              daysInventoryOnHand: parseNumber(form.daysInventoryOnHand),
              daysPayablesOutstanding: parseNumber(form.daysPayablesOutstanding),
              workDaysPerYear: parseNumber(form.workDaysPerYear),
              workHoursPerDay: parseNumber(form.workHoursPerDay),
              optionalNotes: String(form.optionalNotes || '').trim(),
            },
            clientId,
            runId,
          },
        }),
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
      link.download = 'bms-current-financial-information-report.pdf';
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
        <h1>Current Financial Information</h1>
        <p>Capture baseline margin, breakeven load, and working capital posture in one intake run.</p>
      </header>

      <section className="wizard-history" aria-label="Current financial information run history">
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
              Annual Revenue
              <WorksheetInput
                type="number"
                min="0"
                value={form.annualRevenue}
                onChange={(event) => updateField('annualRevenue', event.target.value)}
                placeholder="e.g. 1250000"
              />
            </label>
            <label>
              Annual COGS
              <WorksheetInput
                type="number"
                min="0"
                value={form.annualCogs}
                onChange={(event) => updateField('annualCogs', event.target.value)}
                placeholder="e.g. 700000"
              />
            </label>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="wizard-fields">
            <label>
              Annual Fixed Expenses
              <WorksheetInput
                type="number"
                min="0"
                value={form.annualFixedExpenses}
                onChange={(event) => updateField('annualFixedExpenses', event.target.value)}
                placeholder="e.g. 320000"
              />
            </label>
            <label>
              Optional Notes
              <textarea
                rows={5}
                value={form.optionalNotes}
                onChange={(event) => updateField('optionalNotes', event.target.value)}
                placeholder="Context for assumptions or known outliers."
              />
            </label>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="wizard-fields">
            <label>
              Days Sales Outstanding (DSO)
              <WorksheetInput
                type="number"
                min="0"
                value={form.daysSalesOutstanding}
                onChange={(event) => updateField('daysSalesOutstanding', event.target.value)}
                placeholder="e.g. 45"
              />
            </label>
            <label>
              Days Inventory On Hand (DIO)
              <WorksheetInput
                type="number"
                min="0"
                value={form.daysInventoryOnHand}
                onChange={(event) => updateField('daysInventoryOnHand', event.target.value)}
                placeholder="e.g. 38"
              />
            </label>
            <label>
              Days Payables Outstanding (DPO)
              <WorksheetInput
                type="number"
                min="0"
                value={form.daysPayablesOutstanding}
                onChange={(event) => updateField('daysPayablesOutstanding', event.target.value)}
                placeholder="e.g. 30"
              />
            </label>
          </div>
        )}

        {stepIndex === 3 && (
          <div className="wizard-fields">
            <label>
              Work Days Per Year
              <WorksheetInput
                type="number"
                min="1"
                value={form.workDaysPerYear}
                onChange={(event) => updateField('workDaysPerYear', event.target.value)}
                placeholder="e.g. 250"
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
              />
            </label>
          </div>
        )}

        {stepIndex === 4 && (
          <div className="client-review-grid">
            <article>
              <span>Annual Revenue</span>
              <strong>{currency(form.annualRevenue)}</strong>
            </article>
            <article>
              <span>Annual COGS</span>
              <strong>{currency(form.annualCogs)}</strong>
            </article>
            <article>
              <span>Annual Fixed Expenses</span>
              <strong>{currency(form.annualFixedExpenses)}</strong>
            </article>
            <article>
              <span>Cycle Days</span>
              <strong>
                DSO {number(form.daysSalesOutstanding)} + DIO {number(form.daysInventoryOnHand)} - DPO{' '}
                {number(form.daysPayablesOutstanding)}
              </strong>
            </article>
            <article>
              <span>Capacity</span>
              <strong>
                {parseNumber(form.workDaysPerYear)} days x {parseNumber(form.workHoursPerDay)} hrs
              </strong>
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
              {loading ? 'Running...' : 'Calculate + Save'}
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
              <span>Gross Margin Amount</span>
              <strong>{currency(result.grossMarginAmount)}</strong>
            </article>
            <article>
              <span>Gross Margin Percent</span>
              <strong>{percent(result.grossMarginPercent)}</strong>
            </article>
            <article>
              <span>Breakeven Revenue</span>
              <strong>{currency(result.breakevenRevenue)}</strong>
            </article>
            <article>
              <span>Net Working Capital</span>
              <strong>{currency(result.netWorkingCapital)}</strong>
            </article>
          </div>

          <div className="wizard-kpis">
            <article>
              <span>A/R Investment</span>
              <strong>{currency(result.arInvestment)}</strong>
            </article>
            <article>
              <span>Inventory Investment</span>
              <strong>{currency(result.inventoryInvestment)}</strong>
            </article>
            <article>
              <span>A/P Financing</span>
              <strong>{currency(result.apFinancing)}</strong>
            </article>
            <article>
              <span>Cash Conversion Cycle</span>
              <strong>{number(result.cashConversionCycle, 2)} days</strong>
            </article>
          </div>

          <div className="wizard-kpis">
            <article>
              <span>Breakeven Daily</span>
              <strong>{currency(result.breakevenDaily)}</strong>
            </article>
            <article>
              <span>Breakeven Weekly</span>
              <strong>{currency(result.breakevenWeekly)}</strong>
            </article>
            <article>
              <span>Breakeven Monthly</span>
              <strong>{currency(result.breakevenMonthly)}</strong>
            </article>
            <article>
              <span>Breakeven Hourly</span>
              <strong>{currency(result.breakevenHourly)}</strong>
            </article>
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
