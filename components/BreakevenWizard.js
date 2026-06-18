'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import usePrefillableForm from '@/lib/client/usePrefillableForm';
import useFinancialSnapshotPrefill from '@/lib/client/useFinancialSnapshotPrefill';
import useWorksheetStepDraft from '@/lib/client/useWorksheetStepDraft';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';
import useWorksheetShellRunLoader from '@/lib/client/useWorksheetShellRunLoader';
import { patchFinancialSnapshot } from '@/lib/client/patchFinancialSnapshot';
import { buildSnapshotPatch } from '@/lib/worksheets/snapshotWriteFields';
import { pullBreakevenFromAllSources } from '@/lib/worksheets/worksheetPullHelpers';
import SnapshotStatusBanner from '@/components/worksheet/SnapshotStatusBanner';
import PortBridgePanel from '@/components/worksheet/PortBridgePanel';

const steps = [
  { id: 'revenue', title: 'Revenue & COGS', hint: 'Define annual sales and direct costs.' },
  { id: 'cost-stack', title: 'Cost Stack', hint: 'Optional labor, indirect, and G&A layers.' },
  { id: 'fixed', title: 'Fixed Expenses', hint: 'Set annual overhead that must be covered.' },
  { id: 'capacity', title: 'Work Capacity', hint: 'Convert annual breakeven into daily/hourly targets.' },
  { id: 'review', title: 'Review & Run', hint: 'Confirm assumptions and run calculation.' },
];

const defaultForm = {
  annualRevenue: '',
  cogsAmount: '',
  laborAmount: '',
  indirectCostsAmount: '',
  generalAdministrativeCostsAmount: '',
  profitAmount: '',
  monthsInPeriod: '12',
  calculationMethod: 'auto',
  fixedExpensesAmount: '',
  workDaysPerYear: '250',
  workHoursPerDay: '8',
};

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

  const { staleFields, snapshotMeta } = useFinancialSnapshotPrefill({
    clientId,
    worksheetKey: 'breakeven-analysis',
    applyPrefill,
    currentForm: form,
    onlyEmpty: true,
  });

  const draftPayload = useMemo(() => ({ form }), [form]);
  useWorksheetStepDraft({
    clientId,
    worksheetKey: 'breakeven-analysis',
    stepIndex,
    setStepIndex,
    draftPayload,
    onRestoreDraft: (draft) => {
      if (draft.form && typeof draft.form === 'object') {
        resetForm({ ...defaultForm, ...draft.form });
      }
    },
  });

  useWorksheetShellForm(form);

  const progress = ((stepIndex + 1) / steps.length) * 100;

  const canAdvance = useMemo(() => {
    if (stepIndex === 0) return parseNumber(form.annualRevenue) > 0;
    if (stepIndex === 1) return true;
    if (stepIndex === 2) return parseNumber(form.fixedExpensesAmount) >= 0;
    if (stepIndex === 3) return parseNumber(form.workDaysPerYear) > 0 && parseNumber(form.workHoursPerDay) > 0;
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

  useWorksheetShellRunLoader(loadRun);

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
      const { patch, missingFields, sources, auditRuns } = await pullBreakevenFromAllSources(clientId);

      if (!auditRuns.plRun) {
        throw new Error('No P&L Comparisons runs found to prefill from.');
      }

      if (Object.keys(patch).length === 0) {
        throw new Error(`Could not map any Breakeven fields. Missing: ${missingFields.join(', ')}`);
      }

      applyPrefill(patch, sources.join(' + ') || 'Linked worksheets');

      if (missingFields.length > 0) {
        setPullError(`Some fields were not prefilled: ${missingFields.join(', ')}.`);
      }

      setPullAudit(
        `Prefilled from ${sources.join(', ')} (P&L run ${formatRunTimestamp(auditRuns.plRun.created_at)})`,
      );
      setStepIndex(0);
    } catch (err) {
      setPullError(err.message || 'Unable to prefill from linked worksheets.');
    } finally {
      setPullLoading(false);
    }
  }

  function handlePortBridgePatch(patch, portKey) {
    applyPrefill(patch, portKey);
    setPullAudit(`Imported from workbook port ${portKey}.`);
  }

  async function calculateAndSave(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        annualRevenue: parseNumber(form.annualRevenue),
        cogsAmount: parseNumber(form.cogsAmount),
        laborAmount: parseNumber(form.laborAmount),
        indirectCostsAmount: parseNumber(form.indirectCostsAmount),
        generalAdministrativeCostsAmount: parseNumber(form.generalAdministrativeCostsAmount),
        profitAmount: form.profitAmount === '' ? null : parseNumber(form.profitAmount),
        monthsInPeriod: parseNumber(form.monthsInPeriod) || 12,
        calculationMethod: form.calculationMethod || 'auto',
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

      const savedRun = {
        id: runData.id || '',
        created_at: new Date().toISOString(),
        inputs: payload,
        outputs: calculationData.result,
      };
      setRunId(savedRun.id);
      setRuns((prev) => [savedRun, ...prev.filter((run) => run.id !== savedRun.id)].slice(0, 10));
      clearPrefillTracking();
      await patchFinancialSnapshot(
        clientId,
        'breakeven-analysis',
        buildSnapshotPatch('breakeven-analysis', payload, calculationData.result),
      );
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

      <SnapshotStatusBanner staleFields={staleFields} snapshotMeta={snapshotMeta} />

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
          </div>
        )}

        {stepIndex === 1 && (
          <div className="wizard-fields">
            <label>
              Direct Labor (optional)
              <WorksheetInput type="number" min="0" value={form.laborAmount} onChange={(e) => updateField('laborAmount', e.target.value)} />
            </label>
            <label>
              Indirect Costs (optional)
              <WorksheetInput type="number" min="0" value={form.indirectCostsAmount} onChange={(e) => updateField('indirectCostsAmount', e.target.value)} />
            </label>
            <label>
              G&A Costs (optional)
              <WorksheetInput type="number" min="0" value={form.generalAdministrativeCostsAmount} onChange={(e) => updateField('generalAdministrativeCostsAmount', e.target.value)} />
            </label>
            <label>
              Net Profit (office-tool method)
              <WorksheetInput type="number" min="0" value={form.profitAmount} onChange={(e) => updateField('profitAmount', e.target.value)} />
            </label>
            <label>
              Months In Period
              <WorksheetInput type="number" min="1" max="12" value={form.monthsInPeriod} onChange={(e) => updateField('monthsInPeriod', e.target.value)} />
            </label>
            <label>
              Calculation Method
              <select value={form.calculationMethod} onChange={(e) => updateField('calculationMethod', e.target.value)}>
                <option value="auto">Auto</option>
                <option value="gross_margin">Gross Margin</option>
                <option value="contribution">Contribution Margin</option>
                <option value="office_tool">Office Tool</option>
              </select>
            </label>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="wizard-fields">
            <label>
              Fixed Expenses (Annual)
              <WorksheetInput
                type="number"
                min="0"
                value={form.fixedExpensesAmount}
                onChange={(event) => updateField('fixedExpensesAmount', event.target.value)}
                placeholder="e.g. 320000"
                isPrefilled={Boolean(prefilledFields.fixedExpensesAmount)}
                isTouched={Boolean(touchedFields.fixedExpensesAmount)}
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
                isPrefilled={Boolean(prefilledFields.workDaysPerYear)}
                isTouched={Boolean(touchedFields.workHoursPerDay)}
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

        {stepIndex === 4 && (
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
            {pullLoading ? 'Pulling...' : 'Pull from all feeders'}
          </button>
        </div>
        <PortBridgePanel clientId={clientId} worksheetKey="breakeven-analysis" onApplyPatch={handlePortBridgePatch} />
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
