'use client';

import { useEffect, useMemo, useState } from 'react';
import BasicClientInfoAccordion from '@/components/BasicClientInfoAccordion';
import useWorksheetStepDraft from '@/lib/client/useWorksheetStepDraft';
import useWorksheetShellRunLoader from '@/lib/client/useWorksheetShellRunLoader';
import {
  BASIC_CLIENT_INFO_SECTIONS,
  buildBasicClientInfoSectionStatuses,
} from '@/lib/worksheets/basicClientInfoSections';
import {
  buildBasicClientInfoCalculationPayload,
  mapClientRowToBasicClientInfoForm,
} from '@/lib/worksheets/clientProfile';

function formatRunTimestamp(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function BasicClientInfoWizard({ clientId, initialClientInfo = null }) {
  const [openSectionIndex, setOpenSectionIndex] = useState(0);
  const [form, setForm] = useState(() => mapClientRowToBasicClientInfoForm(initialClientInfo));
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfError, setPdfError] = useState('');

  const draftPayload = useMemo(() => ({ form }), [form]);
  useWorksheetStepDraft({
    clientId,
    worksheetKey: 'basic-client-info',
    stepIndex: openSectionIndex,
    setStepIndex: setOpenSectionIndex,
    draftPayload,
    onRestoreDraft: (draft) => {
      if (draft.form && typeof draft.form === 'object') {
        setForm((prev) => ({ ...prev, ...draft.form }));
      }
    },
  });

  const sectionStatuses = useMemo(
    () => buildBasicClientInfoSectionStatuses(form, Boolean(runId || result)),
    [form, runId, result],
  );

  const completedSections = useMemo(
    () => Object.values(sectionStatuses).filter((status) => status === 'complete').length,
    [sectionStatuses],
  );

  const progress = Math.round((completedSections / BASIC_CLIENT_INFO_SECTIONS.length) * 100);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function loadRun(run) {
    if (!run) return;
    setForm({ ...mapClientRowToBasicClientInfoForm(initialClientInfo), ...(run.inputs || {}) });
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setOpenSectionIndex(BASIC_CLIENT_INFO_SECTIONS.length - 1);
    setError('');
    setPdfError('');
  }

  useWorksheetShellRunLoader(loadRun);

  function resetToNewRun() {
    setForm(mapClientRowToBasicClientInfoForm(initialClientInfo));
    setResult(null);
    setRunId('');
    setOpenSectionIndex(0);
    setError('');
    setPdfError('');
  }

  useEffect(() => {
    setForm((prev) => ({ ...mapClientRowToBasicClientInfoForm(initialClientInfo), ...prev }));
  }, [initialClientInfo]);

  useEffect(() => {
    let cancelled = false;

    async function fetchRuns() {
      if (!clientId) return;
      setRunsLoading(true);
      try {
        const response = await fetch(`/api/worksheets/basic-client-info/runs?client_id=${encodeURIComponent(clientId)}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load basic client info history.');
        }

        if (!cancelled) {
          setRuns(data.runs || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load basic client info history.');
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
      const payload = buildBasicClientInfoCalculationPayload(form);

      const calculationResponse = await fetch('/api/worksheets/basic-client-info/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Basic client info calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/basic-client-info/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, inputs: { ...form, ...payload }, outputs: calculationData.result }),
      });
      const runData = await runResponse.json();
      if (!runResponse.ok || !runData.ok) {
        throw new Error(runData.error || 'Calculation succeeded but saving run failed.');
      }

      const savedRun = {
        id: runData.id || '',
        created_at: new Date().toISOString(),
        inputs: { ...form, ...payload },
        outputs: calculationData.result,
      };
      setRunId(savedRun.id);
      setRuns((prev) => [savedRun, ...prev.filter((run) => run.id !== savedRun.id)].slice(0, 10));
      setOpenSectionIndex(BASIC_CLIENT_INFO_SECTIONS.length - 1);
    } catch (err) {
      setError(err.message || 'Unable to complete basic client info run.');
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
        body: JSON.stringify({ model: 'basic-client-info', result: { ...result, clientId, runId } }),
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
      link.download = 'bms-basic-client-info-report.pdf';
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

  const reviewSlot = (
    <>
      <div className="wizard-fields">
        <label>
          Company Name
          <input type="text" value={form.companyName} readOnly />
        </label>
        <label>
          Industry
          <input type="text" value={form.industry} readOnly />
        </label>
        <label>
          Primary Contact
          <input type="text" value={form.primaryContactName} readOnly />
        </label>
        <label>
          Location
          <input
            type="text"
            value={[form.locationCity, form.locationState].filter(Boolean).join(', ')}
            readOnly
          />
        </label>
      </div>
      <p className="wizard-meta">Click Calculate+Save to normalize fields and persist this run.</p>
      <div className="wizard-actions">
        <button type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Calculate+Save'}
        </button>
        <button type="button" className="ghost" onClick={downloadPdf} disabled={pdfLoading || !result}>
          {pdfLoading ? 'Preparing PDF...' : 'Download PDF'}
        </button>
      </div>
      {error ? <p className="wizard-error">{error}</p> : null}
      {pdfError ? <p className="wizard-error">{pdfError}</p> : null}
      {result ? (
        <section className="wizard-result" aria-live="polite">
          <h2 style={{ marginTop: 0 }}>Normalized Summary</h2>
          <div className="wizard-kpis" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <article>
              <span>Company</span>
              <strong>{result.companyName || 'n/a'}</strong>
            </article>
            <article>
              <span>Industry</span>
              <strong>{result.industry || 'n/a'}</strong>
            </article>
            <article>
              <span>Primary Contact</span>
              <strong>{result.primaryContactName || 'n/a'}</strong>
            </article>
            <article>
              <span>Location</span>
              <strong>{[result.locationCity, result.locationState].filter(Boolean).join(', ') || 'n/a'}</strong>
            </article>
          </div>
          <div className="card" style={{ marginBottom: 10 }}>
            <h3 style={{ marginTop: 0 }}>Summary Block</h3>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{result.summaryBlock || 'n/a'}</pre>
          </div>
          <p className="wizard-meta" style={{ marginBottom: 0 }}>
            Run ID: {runId || 'unsaved'}
          </p>
        </section>
      ) : null}
    </>
  );

  return (
    <section className="wizard-shell bci-wizard">
      <header className="wizard-header">
        <p className="wizard-kicker">Analyst Program</p>
        <h1>Basic Client Info</h1>
        <p>Complete the seven profile sections, then save a normalized client info run.</p>
      </header>

      <div className="wizard-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="wizard-meta bci-wizard__progress-copy">
        {completedSections} of {BASIC_CLIENT_INFO_SECTIONS.length} sections complete
      </p>

      <form className="wizard-card" onSubmit={calculateAndSave}>
        <BasicClientInfoAccordion
          form={form}
          onFieldChange={updateField}
          openSectionIndex={openSectionIndex}
          onSectionToggle={setOpenSectionIndex}
          sectionStatuses={sectionStatuses}
          loading={loading}
          reviewSlot={reviewSlot}
        />
      </form>

      <section className="wizard-history" aria-label="Basic client info run history">
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
