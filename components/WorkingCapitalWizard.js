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
import SnapshotStatusBanner from '@/components/worksheet/SnapshotStatusBanner';
import PortBridgePanel from '@/components/worksheet/PortBridgePanel';

const steps = [
  { id: 'annual', title: 'Annual Inputs', hint: 'Set annual revenue and COGS.' },
  { id: 'days', title: 'Cycle Days', hint: 'Set DSO, DIO, and DPO assumptions.' },
  { id: 'growth', title: 'Growth Scenarios', hint: 'Optional multi-year WC funding projection.' },
  { id: 'review', title: 'Review & Run', hint: 'Confirm assumptions and run calculation.' },
];

const defaultForm = {
  annualRevenue: '',
  annualCogs: '',
  daysSalesOutstanding: '',
  daysInventoryOnHand: '',
  daysPayablesOutstanding: '',
  revenueGrowthPercent: '',
  cogsGrowthPercent: '',
  projectionYears: '0',
};

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function round1(value) {
  return Math.round(Number(value) * 10) / 10;
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

export default function WorkingCapitalWizard({ clientId }) {
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
    worksheetKey: 'working-capital-analysis',
    applyPrefill,
    currentForm: form,
    onlyEmpty: true,
  });

  const draftPayload = useMemo(() => ({ form }), [form]);
  useWorksheetStepDraft({
    clientId,
    worksheetKey: 'working-capital-analysis',
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
    if (stepIndex === 0) return parseNumber(form.annualRevenue) >= 0 && parseNumber(form.annualCogs) >= 0;
    if (stepIndex === 1) {
      return (
        parseNumber(form.daysSalesOutstanding) >= 0 &&
        parseNumber(form.daysInventoryOnHand) >= 0 &&
        parseNumber(form.daysPayablesOutstanding) >= 0
      );
    }
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
        const response = await fetch(`/api/worksheets/working-capital/runs?client_id=${encodeURIComponent(clientId)}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load working capital history.');
        }

        const fetchedRuns = data.runs || [];
        if (cancelled) return;
        setRuns(fetchedRuns);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load working capital history.');
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
      const [plResponse, bsResponse] = await Promise.all([
        fetch(`/api/worksheets/pl-comparisons/runs?client_id=${encodeURIComponent(clientId)}&limit=1`, {
          cache: 'no-store',
        }),
        fetch(`/api/worksheets/balance-sheet-comparisons/runs?client_id=${encodeURIComponent(clientId)}&limit=1`, {
          cache: 'no-store',
        }),
      ]);

      const [plData, bsData] = await Promise.all([plResponse.json(), bsResponse.json()]);

      if (!plResponse.ok || !plData.ok) {
        throw new Error(plData.error || 'Unable to load P&L Comparisons runs.');
      }
      if (!bsResponse.ok || !bsData.ok) {
        throw new Error(bsData.error || 'Unable to load Balance Sheet Comparisons runs.');
      }

      const plRun = plData.runs?.[0] || null;
      const bsRun = bsData.runs?.[0] || null;
      const latestPlYear = pickLatestYearRow(plRun?.inputs?.years);
      const latestBsYear = pickLatestYearRow(bsRun?.inputs?.years);
      const primaryReady = Boolean(plRun && bsRun && latestPlYear && latestBsYear);

      if (primaryReady) {
        const patch = {};
        const missingFields = [];

        const revenue = Number(latestPlYear.revenue);
        const cogs = Number(latestPlYear.cogs);
        const ar = Number(latestBsYear.ar);
        const inventory = Number(latestBsYear.inventory);
        const ap = Number(latestBsYear.ap);

        if (isFiniteNumber(revenue)) {
          patch.annualRevenue = revenue;
        } else {
          missingFields.push('Annual Revenue');
        }

        if (isFiniteNumber(cogs)) {
          patch.annualCogs = cogs;
        } else {
          missingFields.push('Annual COGS');
        }

        if (isFiniteNumber(revenue) && revenue > 0 && isFiniteNumber(ar)) {
          patch.daysSalesOutstanding = round1((ar / revenue) * 365);
        } else {
          missingFields.push('Days Sales Outstanding (requires Revenue + A/R)');
        }

        if (isFiniteNumber(cogs) && cogs > 0 && isFiniteNumber(inventory)) {
          patch.daysInventoryOnHand = round1((inventory / cogs) * 365);
        } else {
          missingFields.push('Days Inventory On Hand (requires COGS + Inventory)');
        }

        if (isFiniteNumber(cogs) && cogs > 0 && isFiniteNumber(ap)) {
          patch.daysPayablesOutstanding = round1((ap / cogs) * 365);
        } else {
          missingFields.push('Days Payables Outstanding (requires COGS + A/P)');
        }

        if (Object.keys(patch).length === 0) {
          throw new Error(
            `Could not map any Working Capital fields from linked sheets. Missing: ${missingFields.join(', ')}`,
          );
        }

        applyPrefill(patch, 'P&L + Balance Sheet Comparisons');

        if (missingFields.length > 0) {
          setPullError(`Some fields were not prefilled: ${missingFields.join(', ')}.`);
        }

        setPullAudit(
          `Prefilled from P&L Comparisons run ${formatRunTimestamp(plRun.created_at)} and Balance Sheet Comparisons run ${formatRunTimestamp(bsRun.created_at)}`,
        );
        setStepIndex(0);
        return;
      }

      const missingSources = [];
      if (!plRun || !latestPlYear) missingSources.push('P&L Comparisons');
      if (!bsRun || !latestBsYear) missingSources.push('Balance Sheet Comparisons');

      const breakevenResponse = await fetch(
        `/api/worksheets/breakeven/runs?client_id=${encodeURIComponent(clientId)}&limit=1`,
        { cache: 'no-store' },
      );
      const breakevenData = await breakevenResponse.json();
      if (!breakevenResponse.ok || !breakevenData.ok) {
        throw new Error(breakevenData.error || 'Unable to load Breakeven runs for fallback prefill.');
      }

      const breakevenRun = breakevenData.runs?.[0];
      if (!breakevenRun) {
        throw new Error(
          `No linked P&L/Balance run pair found (${missingSources.join(
            ' + ',
          )} missing) and no Breakeven run available for fallback.`,
        );
      }

      const fallbackPatch = {};
      const fallbackMissing = [];
      const breakevenInputs = breakevenRun.inputs || {};

      if (isFiniteNumber(breakevenInputs.annualRevenue)) {
        fallbackPatch.annualRevenue = Number(breakevenInputs.annualRevenue);
      } else {
        fallbackMissing.push('Annual Revenue');
      }

      if (isFiniteNumber(breakevenInputs.cogsAmount)) {
        fallbackPatch.annualCogs = Number(breakevenInputs.cogsAmount);
      } else {
        fallbackMissing.push('Annual COGS');
      }

      if (Object.keys(fallbackPatch).length === 0) {
        throw new Error(
          `Fallback Breakeven run found (${formatRunTimestamp(
            breakevenRun.created_at,
          )}) but Annual Revenue/COGS were unavailable.`,
        );
      }

      applyPrefill(fallbackPatch, 'Breakeven fallback');
      setPullAudit(
        `Prefilled via Breakeven fallback run ${formatRunTimestamp(
          breakevenRun.created_at,
        )} because linked ${missingSources.join(' + ')} data was unavailable.`,
      );
      setPullError(
        `Used Breakeven fallback: DSO, DIO, and DPO were not prefilled (they require Balance Sheet values).${
          fallbackMissing.length > 0 ? ` Also missing from Breakeven run: ${fallbackMissing.join(', ')}.` : ''
        }`,
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
        annualCogs: parseNumber(form.annualCogs),
        daysSalesOutstanding: parseNumber(form.daysSalesOutstanding),
        daysInventoryOnHand: parseNumber(form.daysInventoryOnHand),
        daysPayablesOutstanding: parseNumber(form.daysPayablesOutstanding),
        revenueGrowthPercent: parseNumber(form.revenueGrowthPercent) || null,
        cogsGrowthPercent: parseNumber(form.cogsGrowthPercent) || null,
        projectionYears: parseNumber(form.projectionYears),
      };

      const calculationResponse = await fetch('/api/worksheets/working-capital/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Working capital calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/working-capital/runs', {
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
      await patchFinancialSnapshot(
        clientId,
        'working-capital-analysis',
        buildSnapshotPatch('working-capital-analysis', payload, calculationData.result),
      );
      clearPrefillTracking();
    } catch (err) {
      setError(err.message || 'Unable to complete working capital run.');
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
        body: JSON.stringify({ model: 'working-capital', result: { ...result, clientId, runId } }),
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
      link.download = 'bms-working-capital-analysis-report.pdf';
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
        <h1>Working Capital Analysis</h1>
        <p>Model cash tied up in receivables and inventory, offset by payables financing, then export to PDF.</p>
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
              Annual COGS
              <WorksheetInput
                type="number"
                min="0"
                value={form.annualCogs}
                onChange={(event) => updateField('annualCogs', event.target.value)}
                placeholder="e.g. 700000"
                isPrefilled={Boolean(prefilledFields.annualCogs)}
                isTouched={Boolean(touchedFields.annualCogs)}
              />
            </label>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="wizard-fields">
            <label>
              Days Sales Outstanding (DSO)
              <WorksheetInput
                type="number"
                min="0"
                value={form.daysSalesOutstanding}
                onChange={(event) => updateField('daysSalesOutstanding', event.target.value)}
                placeholder="e.g. 45"
                isPrefilled={Boolean(prefilledFields.daysSalesOutstanding)}
                isTouched={Boolean(touchedFields.daysSalesOutstanding)}
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
                isPrefilled={Boolean(prefilledFields.daysInventoryOnHand)}
                isTouched={Boolean(touchedFields.daysInventoryOnHand)}
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
                isPrefilled={Boolean(prefilledFields.daysPayablesOutstanding)}
                isTouched={Boolean(touchedFields.daysPayablesOutstanding)}
              />
            </label>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="wizard-fields">
            <label>
              Revenue Growth % (annual)
              <WorksheetInput
                type="number"
                step="0.1"
                value={form.revenueGrowthPercent}
                onChange={(e) => updateField('revenueGrowthPercent', e.target.value)}
                placeholder="e.g. 8"
              />
            </label>
            <label>
              COGS Growth % (annual, optional)
              <WorksheetInput
                type="number"
                step="0.1"
                value={form.cogsGrowthPercent}
                onChange={(e) => updateField('cogsGrowthPercent', e.target.value)}
                placeholder="Defaults to revenue growth"
              />
            </label>
            <label>
              Projection Years (0–5)
              <WorksheetInput
                type="number"
                min="0"
                max="5"
                value={form.projectionYears}
                onChange={(e) => updateField('projectionYears', e.target.value)}
                placeholder="0 = base year only"
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
              <span>Annual COGS</span>
              <strong>{currency(form.annualCogs)}</strong>
            </article>
            <article>
              <span>Cash Conversion Cycle Inputs</span>
              <strong>
                DSO {number(form.daysSalesOutstanding)} + DIO {number(form.daysInventoryOnHand)} - DPO{' '}
                {number(form.daysPayablesOutstanding)}
              </strong>
            </article>
            <article>
              <span>Current Run</span>
              <strong>{runId ? `Loaded run ${runId.slice(0, 8)}...` : 'New run (unsaved)'}</strong>
            </article>
            {parseNumber(form.projectionYears) > 0 ? (
              <article>
                <span>Growth Scenarios</span>
                <strong>
                  {parseNumber(form.projectionYears)} yr @ {percent(parseNumber(form.revenueGrowthPercent))} revenue
                  {form.cogsGrowthPercent ? ` / ${percent(parseNumber(form.cogsGrowthPercent))} COGS` : ''}
                </strong>
              </article>
            ) : null}
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
              {loading ? 'Running...' : 'Run Working Capital Analysis'}
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
              <span>Net Working Capital</span>
              <strong>{currency(result.netWorkingCapital)}</strong>
            </article>
          </div>

          <div className="wizard-kpis">
            <article>
              <span>Cash Conversion Cycle</span>
              <strong>{number(result.cashConversionCycle, 2)} days</strong>
            </article>
            <article>
              <span>Working Capital % of Revenue</span>
              <strong>{percent(result.workingCapitalPercentOfRevenue)}</strong>
            </article>
          </div>

          {(result.warnings || []).length > 0 ? (
            <ul className="warnings">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          {Array.isArray(result.scenarios) && result.scenarios.length > 0 ? (
            <div className="table-wrap">
              <h3>Working Capital Growth Scenarios</h3>
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Revenue</th>
                    <th>Net WC</th>
                    <th>Δ WC</th>
                    <th>Cumulative Funding</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scenarios.map((row) => (
                    <tr key={row.yearOffset}>
                      <td>+{row.yearOffset}</td>
                      <td>{currency(row.revenue)}</td>
                      <td>{currency(row.netWorkingCapital)}</td>
                      <td>{currency(row.deltaWorkingCapital)}</td>
                      <td>{currency(row.cumulativeFundingNeed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}
        </section>
      ) : null}

      <section className="wizard-history" aria-label="Working capital run history">
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
            {pullLoading ? 'Pulling...' : 'Pull from P&L + Balance Sheet'}
          </button>
        </div>
        <PortBridgePanel clientId={clientId} worksheetKey="working-capital-analysis" onApplyPatch={handlePortBridgePatch} />
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
