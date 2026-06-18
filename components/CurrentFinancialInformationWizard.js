'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CFITableView from '@/components/CFITableView';
import useFinancialSnapshotPrefill from '@/lib/client/useFinancialSnapshotPrefill';
import useWorksheetStepDraft from '@/lib/client/useWorksheetStepDraft';
import useWorksheetShellRunLoader from '@/lib/client/useWorksheetShellRunLoader';
import { patchFinancialSnapshot } from '@/lib/client/patchFinancialSnapshot';
import { buildSnapshotPatch } from '@/lib/worksheets/snapshotWriteFields';
import {
  fetchLatestRun,
  mapCFIFromSources,
  normalizePLYearRow,
  pickLatestYearRow,
} from '@/lib/worksheets/worksheetPullHelpers';
import SnapshotStatusBanner from '@/components/worksheet/SnapshotStatusBanner';

const defaultForm = {
  annualRevenue: '',
  annualCogs: '',
  annualFixedExpenses: '',
  laborAmount: '',
  indirectCostsAmount: '',
  generalAdministrativeCostsAmount: '',
  profitAmount: '',
  daysSalesOutstanding: '',
  daysInventoryOnHand: '',
  daysPayablesOutstanding: '',
  workDaysPerYear: '250',
  workHoursPerDay: '8',
  optionalNotes: '',
};

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const [pullLoading, setPullLoading] = useState(false);
  const [pullError, setPullError] = useState('');
  const [linkedPlYear, setLinkedPlYear] = useState(null);
  const [linkedBsYear, setLinkedBsYear] = useState(null);
  const [linkedBsComputed, setLinkedBsComputed] = useState(null);

  const applyPrefill = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const { staleFields, snapshotMeta } = useFinancialSnapshotPrefill({
    clientId,
    worksheetKey: 'current-financial-information',
    applyPrefill,
    currentForm: form,
    onlyEmpty: true,
  });

  const draftPayload = useMemo(() => ({ form }), [form]);
  useWorksheetStepDraft({
    clientId,
    worksheetKey: 'current-financial-information',
    stepIndex,
    setStepIndex,
    draftPayload,
    onRestoreDraft: (draft) => {
      if (draft.form && typeof draft.form === 'object') {
        setForm((prev) => ({ ...prev, ...draft.form }));
      }
    },
  });

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const loadRun = useCallback((run) => {
    if (!run) return;
    setForm({ ...defaultForm, ...(run.inputs || {}) });
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setError('');
    setPdfError('');
  }, []);

  useWorksheetShellRunLoader(loadRun);

  async function refreshLinkedSources() {
    if (!clientId) return;
    const [plRun, bsRun] = await Promise.all([
      fetchLatestRun(clientId, '/api/worksheets/pl-comparisons/runs'),
      fetchLatestRun(clientId, '/api/worksheets/balance-sheet-comparisons/runs'),
    ]);
    setLinkedPlYear(normalizePLYearRow(pickLatestYearRow(plRun?.inputs?.years)));
    setLinkedBsYear(pickLatestYearRow(bsRun?.inputs?.years));
    setLinkedBsComputed(pickLatestYearRow(bsRun?.outputs?.years));
  }

  function resetToNewRun() {
    setForm(defaultForm);
    setResult(null);
    setRunId('');
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
          { cache: 'no-store' },
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load current financial information history.');
        }

        if (!cancelled) {
          setRuns(data.runs || []);
        }
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
    refreshLinkedSources().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  async function pullLinkedData() {
    if (!clientId) return;
    setPullLoading(true);
    setPullError('');
    try {
      const [plRun, bsRun, beRun] = await Promise.all([
        fetchLatestRun(clientId, '/api/worksheets/pl-comparisons/runs'),
        fetchLatestRun(clientId, '/api/worksheets/balance-sheet-comparisons/runs'),
        fetchLatestRun(clientId, '/api/worksheets/breakeven/runs'),
      ]);

      const plYear = normalizePLYearRow(pickLatestYearRow(plRun?.inputs?.years));
      const bsYear = pickLatestYearRow(bsRun?.inputs?.years);
      const beInputs = beRun?.inputs;

      setLinkedPlYear(plYear);
      setLinkedBsYear(bsYear);
      setLinkedBsComputed(pickLatestYearRow(bsRun?.outputs?.years));

      const patch = mapCFIFromSources({ plYear, bsYear, beInputs });
      applyPrefill(
        Object.fromEntries(
          Object.entries(patch).map(([key, value]) => [key, value === undefined || value === null ? '' : String(value)]),
        ),
      );
    } catch (err) {
      setPullError(err.message || 'Unable to pull linked worksheet data.');
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
        annualCogs: parseNumber(form.annualCogs),
        annualFixedExpenses: parseNumber(form.annualFixedExpenses),
        laborAmount: parseNumber(form.laborAmount),
        indirectCostsAmount: parseNumber(form.indirectCostsAmount),
        generalAdministrativeCostsAmount: parseNumber(form.generalAdministrativeCostsAmount),
        profitAmount: form.profitAmount === '' ? null : parseNumber(form.profitAmount),
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
      await patchFinancialSnapshot(
        clientId,
        'current-financial-information',
        buildSnapshotPatch('current-financial-information', payload, calculationData.result),
      );
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
    <section className="wizard-shell cfi-wizard">
      <SnapshotStatusBanner staleFields={staleFields} snapshotMeta={snapshotMeta} />

      <form onSubmit={calculateAndSave}>
        <CFITableView
          form={form}
          onFieldChange={updateField}
          result={result}
          linkedPlYear={linkedPlYear}
          linkedBsYear={linkedBsYear}
          linkedBsComputed={linkedBsComputed}
          staleFields={staleFields}
          sectionIndex={stepIndex}
          onSectionChange={setStepIndex}
        />

        <div className="wizard-actions cfi-wizard__actions">
          <button type="button" className="ghost" onClick={pullLinkedData} disabled={pullLoading || !clientId}>
            {pullLoading ? 'Pulling...' : 'Pull from saved worksheets'}
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Running...' : 'Calculate + Save'}
          </button>
          <button type="button" disabled={!result || pdfLoading} onClick={downloadPdf}>
            {pdfLoading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>

        {error ? <p className="wizard-error">{error}</p> : null}
        {pdfError ? <p className="wizard-error">{pdfError}</p> : null}
      </form>

      {result && (result.warnings || []).length > 0 ? (
        <ul className="warnings">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}

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
        {pullError ? <p className="wizard-error">{pullError}</p> : null}
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
