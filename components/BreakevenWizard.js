'use client';

import { useMemo, useState } from 'react';

const steps = [
  { id: 'revenue', title: 'Revenue & COGS', hint: 'Define annual sales and direct costs.' },
  { id: 'fixed', title: 'Fixed Expenses', hint: 'Set annual overhead that must be covered.' },
  { id: 'capacity', title: 'Work Capacity', hint: 'Convert annual breakeven into daily/hourly targets.' },
  { id: 'review', title: 'Review & Run', hint: 'Confirm assumptions and run calculation.' },
];

const defaultForm = {
  annualRevenue: 1250000,
  cogsAmount: 700000,
  fixedExpensesAmount: 320000,
  workDaysPerYear: 250,
  workHoursPerDay: 8,
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

export default function BreakevenWizard({ clientId }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [error, setError] = useState('');
  const [pdfError, setPdfError] = useState('');

  const progress = ((stepIndex + 1) / steps.length) * 100;

  const canAdvance = useMemo(() => {
    if (stepIndex === 0) return parseNumber(form.annualRevenue) > 0;
    if (stepIndex === 1) return parseNumber(form.fixedExpensesAmount) >= 0;
    if (stepIndex === 2) return parseNumber(form.workDaysPerYear) > 0 && parseNumber(form.workHoursPerDay) > 0;
    return true;
  }, [form, stepIndex]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function calculateAndSave(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        annualRevenue: parseNumber(form.annualRevenue),
        cogsAmount: parseNumber(form.cogsAmount),
        fixedExpensesAmount: parseNumber(form.fixedExpensesAmount),
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
      setRunId(runData.id || '');
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
        <p>Walk through assumptions, run protected backend calculations, and export a consultant-ready PDF.</p>
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
              <input
                type="number"
                min="0"
                value={form.annualRevenue}
                onChange={(event) => updateField('annualRevenue', event.target.value)}
              />
            </label>
            <label>
              COGS Amount
              <input
                type="number"
                min="0"
                value={form.cogsAmount}
                onChange={(event) => updateField('cogsAmount', event.target.value)}
              />
            </label>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="wizard-fields">
            <label>
              Fixed Expenses (Annual)
              <input
                type="number"
                min="0"
                value={form.fixedExpensesAmount}
                onChange={(event) => updateField('fixedExpensesAmount', event.target.value)}
              />
            </label>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="wizard-fields">
            <label>
              Work Days Per Year
              <input
                type="number"
                min="1"
                value={form.workDaysPerYear}
                onChange={(event) => updateField('workDaysPerYear', event.target.value)}
              />
            </label>
            <label>
              Work Hours Per Day
              <input
                type="number"
                min="1"
                value={form.workHoursPerDay}
                onChange={(event) => updateField('workHoursPerDay', event.target.value)}
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
              <span>Work Capacity</span>
              <strong>
                {parseNumber(form.workDaysPerYear)} days x {parseNumber(form.workHoursPerDay)} hrs
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
    </section>
  );
}
