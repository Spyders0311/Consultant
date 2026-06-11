'use client';

import { useMemo, useState } from 'react';
import FieldGrid from '@/components/wizard/FieldGrid';
import CollectionTable from '@/components/wizard/CollectionTable';
import ResultsSection from '@/components/wizard/ResultsSection';
import RunHistoryPanel from '@/components/wizard/RunHistoryPanel';
import usePrefillableForm from '@/lib/client/usePrefillableForm';
import useWorksheetRuns from '@/lib/client/useWorksheetRuns';
import usePdfDownload from '@/lib/client/usePdfDownload';
import { currency, parseNumber, parseOptionalNumber, percent, formatRunTimestamp } from '@/lib/format';

const helpers = { num: parseNumber, opt: parseOptionalNumber, currency, percent };

function makeDefaultForm(config, initialData) {
  const form = {};
  for (const [name, field] of Object.entries(config.fields || {})) {
    form[name] = field.default ?? '';
  }
  for (const [key, collection] of Object.entries(config.collections || {})) {
    form[key] = (collection.defaultRows || []).map((row) => ({ ...row }));
  }
  if (config.initialOverrides && initialData) {
    Object.assign(form, config.initialOverrides(initialData));
  }
  return form;
}

function normalizeScalar(field, value) {
  if (field.type === 'number') {
    return field.optional ? parseOptionalNumber(value) : parseNumber(value);
  }
  return String(value ?? '').trim();
}

function normalizePayload(config, form) {
  const payload = {};
  for (const [name, field] of Object.entries(config.fields || {})) {
    payload[name] = normalizeScalar(field, form[name]);
  }
  for (const [key, collection] of Object.entries(config.collections || {})) {
    payload[key] = (form[key] || []).map((row, index) => {
      const normalized = {};
      for (const field of collection.fields) {
        const fallback =
          field.name === 'period' || field.name === 'weekLabel' ? `${collection.rowLabel} ${index + 1}` : '';
        normalized[field.name] = normalizeScalar(field, row[field.name] ?? fallback);
      }
      return normalized;
    });
  }
  return payload;
}

function mergeRunForm(config, inputs) {
  const base = makeDefaultForm(config);
  const merged = { ...base, ...(inputs || {}) };
  for (const key of Object.keys(config.collections || {})) {
    merged[key] = Array.isArray(inputs?.[key]) ? inputs[key] : base[key];
  }
  return merged;
}

function hasMeaningfulInput(form) {
  return JSON.stringify(form).replace(/[\s"{}[\],:.-]/g, '').length > 0;
}

function ReviewGrid({ items }) {
  return (
    <div className="wizard-review-grid">
      {items.map((item) => (
        <article key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}

/**
 * Config-driven worksheet wizard: one engine renders every sheet from a
 * declarative config (fields, collections, steps, results, history, prefill).
 * See lib/worksheets/configs/ for the per-sheet definitions.
 */
export default function WorksheetWizard({ config, clientId, initialData }) {
  const initialForm = useMemo(() => makeDefaultForm(config, initialData), [config, initialData]);
  const { form, setForm, setFieldValue, resetForm, applyPrefill, clearPrefillTracking, prefilledFields, touchedFields } =
    usePrefillableForm(initialForm);

  const steps = config.steps;
  const isMultiStep = steps.length > 1;
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [error, setError] = useState('');
  const [pullLoadingId, setPullLoadingId] = useState('');
  const [pullError, setPullError] = useState('');
  const [pullAudit, setPullAudit] = useState('');

  const runsExtraParams = useMemo(() => config.api.runParams || {}, [config]);
  const { runs, runsLoading, runsError, saveRun } = useWorksheetRuns({
    endpoint: config.api.runs,
    clientId,
    extraParams: runsExtraParams,
  });
  const { downloadPdf, pdfLoading, pdfError, clearPdfError } = usePdfDownload();

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const canAdvance = useMemo(() => {
    if (!step?.validate) return true;
    return step.validate(form, helpers);
  }, [form, step]);

  const canSubmit = useMemo(() => {
    if (isMultiStep) return true;
    if (config.canRun) return config.canRun(form, helpers);
    return hasMeaningfulInput(form);
  }, [config, form, isMultiStep]);

  function clearMessages() {
    setError('');
    setPullError('');
    setPullAudit('');
    clearPdfError();
  }

  function loadRun(run) {
    if (!run) return;
    resetForm(mergeRunForm(config, run.inputs));
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setStepIndex(steps.length - 1);
    clearMessages();
  }

  function resetToNewRun() {
    resetForm(makeDefaultForm(config, initialData));
    setResult(null);
    setRunId('');
    setStepIndex(0);
    clearMessages();
  }

  function updateCollectionRow(collectionKey, rowIndex, name, value) {
    setForm((prev) => ({
      ...prev,
      [collectionKey]: (prev[collectionKey] || []).map((row, index) =>
        index === rowIndex ? { ...row, [name]: value } : row,
      ),
    }));
  }

  function addCollectionRow(collection) {
    setForm((prev) => {
      const rows = prev[collection.key] || [];
      if (rows.length >= collection.maxRows) return prev;
      const nextRow = {};
      for (const field of collection.fields) {
        nextRow[field.name] =
          field.type === 'select'
            ? field.options?.[0]?.value || ''
            : field.name === 'weekLabel' || field.name === 'period'
              ? `${collection.rowLabel} ${rows.length + 1}`
              : '';
      }
      return { ...prev, [collection.key]: [...rows, nextRow] };
    });
  }

  function removeCollectionRow(collectionKey, rowIndex) {
    setForm((prev) => ({
      ...prev,
      [collectionKey]: (prev[collectionKey] || []).filter((_, index) => index !== rowIndex),
    }));
  }

  async function runPrefill(action) {
    if (!clientId) return;
    setPullLoadingId(action.id);
    setPullError('');
    setError('');

    try {
      const params = new URLSearchParams({ client_id: clientId, ...(action.params || {}), limit: '1' });
      const response = await fetch(`${action.endpoint}?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Unable to load ${action.sourceLabel} runs.`);
      }

      const sourceRun = data.runs?.[0];
      if (!sourceRun) {
        throw new Error(`No ${action.sourceLabel} runs found to prefill from.`);
      }

      const { patch, missingFields = [] } = action.map(sourceRun);
      if (!patch || Object.keys(patch).length === 0) {
        throw new Error(
          `Could not map any fields from ${action.sourceLabel}.${missingFields.length ? ` Missing: ${missingFields.join(', ')}` : ''}`,
        );
      }

      applyPrefill(patch, action.sourceLabel);
      if (missingFields.length > 0) {
        setPullError(`Some fields were not prefilled: ${missingFields.join(', ')}.`);
      }
      setPullAudit(`Prefilled from ${action.sourceLabel} run ${formatRunTimestamp(sourceRun.created_at)}`);
      setStepIndex(0);
    } catch (err) {
      setPullError(err.message || `Unable to prefill from ${action.sourceLabel}.`);
    } finally {
      setPullLoadingId('');
    }
  }

  async function calculateAndSave(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = config.payload ? config.payload(form, helpers) : normalizePayload(config, form);
      const body = config.api.buildRequestBody ? config.api.buildRequestBody(payload) : payload;

      const calculationResponse = await fetch(config.api.calculate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || `${config.title} calculation failed.`);
      }

      setResult(calculationData.result);

      if (config.api.runs) {
        const savedRun = await saveRun({ inputs: payload, outputs: calculationData.result });
        setRunId(savedRun.id);
      }
      clearPrefillTracking();
    } catch (err) {
      setError(err.message || `Unable to complete ${config.title} run.`);
    } finally {
      setLoading(false);
    }
  }

  function handlePdf() {
    if (!result || !config.pdf) return;
    const pdfResult = config.pdf.buildResult
      ? config.pdf.buildResult(result, { clientId, runId, form })
      : { ...result, clientId, runId };
    downloadPdf({ model: config.pdf.model, result: pdfResult, filename: config.pdf.filename });
  }

  const stepContext = {
    form,
    setFieldValue,
    updateCollectionRow,
    prefilledFields,
    touchedFields,
    loading,
    helpers,
  };

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">{config.kicker}</p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
        {config.source ? <p className="wizard-meta">Source: {config.source}</p> : null}
      </header>

      {isMultiStep ? (
        <>
          <div className="wizard-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          <ol className="wizard-step-list">
            {steps.map((entry, idx) => {
              const isCurrent = idx === stepIndex;
              const isCompleted = idx < stepIndex;
              const canJumpForward = idx > stepIndex ? canAdvance : true;

              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={`wizard-step-button ${isCurrent ? 'active' : ''} ${isCompleted ? 'complete' : ''}`}
                    onClick={() => setStepIndex(idx)}
                    disabled={loading || !canJumpForward}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <strong>{entry.title}</strong>
                    <span>{entry.hint}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      ) : null}

      <form className="wizard-card" onSubmit={calculateAndSave}>
        {step.render ? (
          step.render(stepContext)
        ) : (
          <>
            {step.fieldNames?.length ? (
              <FieldGrid
                fields={config.fields}
                fieldNames={step.fieldNames}
                form={form}
                onChange={setFieldValue}
                disabled={loading}
                prefilledFields={prefilledFields}
                touchedFields={touchedFields}
              />
            ) : null}
            {(step.collections || []).map((key) => {
              const collection = { key, ...config.collections[key] };
              return (
                <CollectionTable
                  key={key}
                  collection={collection}
                  rows={form[key] || []}
                  onRowChange={(rowIndex, name, value) => updateCollectionRow(key, rowIndex, name, value)}
                  onAddRow={() => addCollectionRow(collection)}
                  onRemoveRow={(rowIndex) => removeCollectionRow(key, rowIndex)}
                  disabled={loading}
                />
              );
            })}
            {step.review ? <ReviewGrid items={config.review(form, helpers)} /> : null}
          </>
        )}

        <div className="wizard-actions">
          {isMultiStep ? (
            <button
              type="button"
              className="ghost"
              disabled={loading || stepIndex === 0}
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            >
              Back
            </button>
          ) : (
            <button type="button" className="ghost" onClick={resetToNewRun} disabled={loading}>
              Reset
            </button>
          )}
          {isMultiStep && stepIndex < steps.length - 1 ? (
            <button type="button" disabled={loading || !canAdvance} onClick={() => setStepIndex((prev) => prev + 1)}>
              Continue
            </button>
          ) : (
            <button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Running...' : config.submitLabel || `Run ${config.title}`}
            </button>
          )}
          {config.pdf ? (
            <button type="button" disabled={!result || pdfLoading} onClick={handlePdf}>
              {pdfLoading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
          ) : null}
        </div>

        {error ? <p className="wizard-error">{error}</p> : null}
        {runsError ? <p className="wizard-error">{runsError}</p> : null}
        {pullError ? <p className="wizard-error">{pullError}</p> : null}
        {pdfError ? <p className="wizard-error">{pdfError}</p> : null}
      </form>

      <ResultsSection results={config.results} result={result} runId={runId} />

      {config.api.runs ? (
        <RunHistoryPanel
          title={`${config.title} run history`}
          runs={runs}
          runsLoading={runsLoading}
          disabled={loading}
          metric={config.history?.metric}
          onLoadRun={loadRun}
          onStartNew={resetToNewRun}
          audit={pullAudit}
          extraActions={(config.prefill || []).map((action) => ({
            id: action.id,
            label: pullLoadingId === action.id ? 'Pulling...' : action.label,
            disabled: Boolean(pullLoadingId) || !clientId,
            onClick: () => runPrefill(action),
          }))}
        />
      ) : null}
    </section>
  );
}
