'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';

const weekFields = [
  ['cashReceipts', 'Receipts'],
  ['newSales', 'New Sales'],
  ['payroll', 'Payroll'],
  ['materials', 'Materials'],
  ['rentUtilities', 'Rent/Utilities'],
  ['loanPayments', 'Loans'],
  ['creditCardPayments', 'Cards'],
  ['otherDisbursements', 'Other'],
];

function defaultWeeks() {
  return Array.from({ length: 6 }, (_, index) => ({
    weekLabel: `Week ${index + 1}`,
    cashReceipts: '',
    newSales: '',
    payroll: '',
    materials: '',
    rentUtilities: '',
    loanPayments: '',
    creditCardPayments: '',
    otherDisbursements: '',
  }));
}

function defaultFormValues() {
  return {
    beginningCash: '',
    lineOfCreditLimit: '',
    beginningLineOfCreditBalance: '',
    minimumCashReserve: '',
    notes: '',
    weeks: defaultWeeks(),
  };
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

function formatRunTimestamp(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function WeeklyCashFlowWizard({ clientId }) {
  const [form, setForm] = useState(() => defaultFormValues());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [error, setError] = useState('');

  const canRun = useMemo(
    () => form.weeks.some((week) => parseNumber(week.cashReceipts) > 0 || weekFields.some(([field]) => parseNumber(week[field]) > 0)),
    [form.weeks],
  );

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateWeek(index, name, value) {
    setForm((prev) => ({
      ...prev,
      weeks: prev.weeks.map((week, weekIndex) => (weekIndex === index ? { ...week, [name]: value } : week)),
    }));
  }

  function addWeek() {
    setForm((prev) => ({
      ...prev,
      weeks: [
        ...prev.weeks,
        {
          ...defaultWeeks()[0],
          weekLabel: `Week ${prev.weeks.length + 1}`,
        },
      ].slice(0, 13),
    }));
  }

  function loadRun(run) {
    if (!run) return;
    setForm({ ...defaultFormValues(), ...(run.inputs || {}) });
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setError('');
  }

  function resetToNewRun() {
    setForm(defaultFormValues());
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
        const response = await fetch(`/api/worksheets/weekly-cash-flow/runs?client_id=${encodeURIComponent(clientId)}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load weekly cash flow history.');
        }
        if (!cancelled) setRuns(data.runs || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load weekly cash flow history.');
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
        beginningCash: parseNumber(form.beginningCash),
        lineOfCreditLimit: parseNumber(form.lineOfCreditLimit),
        beginningLineOfCreditBalance: parseNumber(form.beginningLineOfCreditBalance),
        minimumCashReserve: parseNumber(form.minimumCashReserve),
        notes: String(form.notes || '').trim(),
        weeks: form.weeks.map((week, index) => ({
          weekLabel: String(week.weekLabel || `Week ${index + 1}`).trim(),
          cashReceipts: parseNumber(week.cashReceipts),
          newSales: parseNumber(week.newSales),
          payroll: parseNumber(week.payroll),
          materials: parseNumber(week.materials),
          rentUtilities: parseNumber(week.rentUtilities),
          loanPayments: parseNumber(week.loanPayments),
          creditCardPayments: parseNumber(week.creditCardPayments),
          otherDisbursements: parseNumber(week.otherDisbursements),
        })),
      };

      const calculationResponse = await fetch('/api/worksheets/weekly-cash-flow/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Weekly cash flow calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/weekly-cash-flow/runs', {
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
      setError(err.message || 'Unable to complete weekly cash flow run.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Financial Tools</p>
        <h1>Weekly Cash Flow Forecast</h1>
        <p>
          Initial app port of the F-900b cash flow workbook. Forecast receipts, disbursements, cash reserve shortfalls,
          and line-of-credit usage by week.
        </p>
      </header>

      <form className="wizard-card" onSubmit={calculateAndSave}>
        <div className="wizard-fields">
          <label>
            Beginning Cash
            <WorksheetInput
              type="number"
              min="0"
              value={form.beginningCash}
              onChange={(event) => updateField('beginningCash', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Line of Credit Limit
            <WorksheetInput
              type="number"
              min="0"
              value={form.lineOfCreditLimit}
              onChange={(event) => updateField('lineOfCreditLimit', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Beginning LOC Balance
            <WorksheetInput
              type="number"
              min="0"
              value={form.beginningLineOfCreditBalance}
              onChange={(event) => updateField('beginningLineOfCreditBalance', event.target.value)}
              disabled={loading}
            />
          </label>
          <label>
            Minimum Cash Reserve
            <WorksheetInput
              type="number"
              min="0"
              value={form.minimumCashReserve}
              onChange={(event) => updateField('minimumCashReserve', event.target.value)}
              disabled={loading}
            />
          </label>
        </div>

        <div className="table-wrap worksheet-grid-table">
          <table>
            <thead>
              <tr>
                <th>Week</th>
                {weekFields.map(([, label]) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.weeks.map((week, index) => (
                <tr key={`week-${index + 1}`}>
                  <td>
                    <WorksheetInput
                      type="text"
                      value={week.weekLabel}
                      onChange={(event) => updateWeek(index, 'weekLabel', event.target.value)}
                      disabled={loading}
                    />
                  </td>
                  {weekFields.map(([field]) => (
                    <td key={field}>
                      <WorksheetInput
                        type="number"
                        min="0"
                        value={week[field]}
                        onChange={(event) => updateWeek(index, field, event.target.value)}
                        disabled={loading}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label>
          Notes
          <textarea
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Optional assumptions, timing notes, or collection concerns."
            disabled={loading}
          />
        </label>

        <div className="actions">
          <button type="button" className="ghost" onClick={addWeek} disabled={loading || form.weeks.length >= 13}>
            Add Week
          </button>
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
          <h2>Cash Flow Summary</h2>
          <div className="wizard-kpis">
            <article>
              <span>Ending Cash</span>
              <strong>{currency(result.endingCash)}</strong>
            </article>
            <article>
              <span>Ending LOC Balance</span>
              <strong>{currency(result.endingLineOfCreditBalance)}</strong>
            </article>
            <article>
              <span>Lowest Cash</span>
              <strong>{currency(result.lowestCashBalance)}</strong>
            </article>
            <article>
              <span>Peak LOC Use</span>
              <strong>{currency(result.peakLineOfCreditUse)}</strong>
            </article>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Receipts</th>
                  <th>Disbursements</th>
                  <th>Net Cash</th>
                  <th>LOC Draw</th>
                  <th>LOC Repay</th>
                  <th>Ending Cash</th>
                </tr>
              </thead>
              <tbody>
                {(result.weeks || []).map((week) => (
                  <tr key={week.weekLabel}>
                    <td>{week.weekLabel}</td>
                    <td>{currency(week.cashReceipts)}</td>
                    <td>{currency(week.totalDisbursements)}</td>
                    <td>{currency(week.netCashFlow)}</td>
                    <td>{currency(week.lineOfCreditDraw)}</td>
                    <td>{currency(week.lineOfCreditRepayment)}</td>
                    <td>{currency(week.endingCash)}</td>
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
        {!runsLoading && runs.length === 0 ? <p>No weekly cash flow runs saved yet.</p> : null}
        <div className="run-list">
          {runs.map((run) => (
            <button type="button" className="run-list-item" key={run.id} onClick={() => loadRun(run)}>
              <strong>{formatRunTimestamp(run.created_at)}</strong>
              <span>{currency(run.outputs?.endingCash)} ending cash</span>
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}
