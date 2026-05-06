'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';

const steps = [
  { id: 'company', title: 'Company Profile', hint: 'Set core company and location details.' },
  { id: 'contact', title: 'Primary Contact', hint: 'Capture who we should coordinate with.' },
  { id: 'review', title: 'Review & Run', hint: 'Generate normalized output and save run.' },
];

function normalizePrefill(initialClientInfo) {
  return {
    companyName: initialClientInfo?.companyName || '',
    industry: initialClientInfo?.industry || '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    locationCity: '',
    locationState: '',
    notes: '',
  };
}

function cleanText(value) {
  return String(value || '').trim();
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

export default function BasicClientInfoWizard({ clientId, initialClientInfo = null }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(() => normalizePrefill(initialClientInfo));
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
    if (stepIndex === 0) return cleanText(form.companyName).length > 0 || cleanText(form.industry).length > 0;
    if (stepIndex === 1) {
      return (
        cleanText(form.primaryContactName).length > 0 ||
        cleanText(form.primaryContactEmail).length > 0 ||
        cleanText(form.primaryContactPhone).length > 0
      );
    }
    return true;
  }, [form, stepIndex]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function loadRun(run) {
    if (!run) return;
    setForm({ ...normalizePrefill(initialClientInfo), ...(run.inputs || {}) });
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setStepIndex(steps.length - 1);
    setError('');
    setPdfError('');
  }

  function resetToNewRun() {
    setForm(normalizePrefill(initialClientInfo));
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
        const response = await fetch(`/api/worksheets/basic-client-info/runs?client_id=${encodeURIComponent(clientId)}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load basic client info history.');
        }

        const fetchedRuns = data.runs || [];
        if (cancelled) return;

        setRuns(fetchedRuns);
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
      const payload = {
        companyName: cleanText(form.companyName),
        industry: cleanText(form.industry),
        primaryContactName: cleanText(form.primaryContactName),
        primaryContactEmail: cleanText(form.primaryContactEmail),
        primaryContactPhone: cleanText(form.primaryContactPhone),
        locationCity: cleanText(form.locationCity),
        locationState: cleanText(form.locationState),
        notes: cleanText(form.notes),
      };

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
      setStepIndex(steps.length - 1);
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

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Analyst Program</p>
        <h1>Basic Client Info</h1>
        <p>Capture and normalize core client profile details, save run history, and export a PDF snapshot.</p>
      </header>

      <div className="wizard-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className="wizard-step-list">
        {steps.map((step, idx) => {
          const isCurrent = idx === stepIndex;
          const isComplete = idx < stepIndex;

          return (
            <li key={step.id}>
              <button
                type="button"
                className={`wizard-step-button ${isCurrent ? 'active' : ''} ${isComplete ? 'complete' : ''}`.trim()}
                onClick={() => setStepIndex(idx)}
                disabled={loading}
              >
                <strong>{step.title}</strong>
                <span>{step.hint}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <form className="wizard-card" onSubmit={calculateAndSave}>
        {stepIndex === 0 ? (
          <div className="wizard-fields">
            <label>
              Company Name
              <WorksheetInput
                type="text"
                value={form.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
                placeholder="Acme Services LLC"
                disabled={loading}
              />
            </label>
            <label>
              Industry
              <WorksheetInput
                type="text"
                value={form.industry}
                onChange={(event) => updateField('industry', event.target.value)}
                placeholder="Commercial Services"
                disabled={loading}
              />
            </label>
            <label>
              Location City
              <WorksheetInput
                type="text"
                value={form.locationCity}
                onChange={(event) => updateField('locationCity', event.target.value)}
                placeholder="Chicago"
                disabled={loading}
              />
            </label>
            <label>
              Location State
              <WorksheetInput
                type="text"
                value={form.locationState}
                onChange={(event) => updateField('locationState', event.target.value)}
                placeholder="IL"
                disabled={loading}
              />
            </label>
          </div>
        ) : null}

        {stepIndex === 1 ? (
          <div className="wizard-fields">
            <label>
              Primary Contact Name
              <WorksheetInput
                type="text"
                value={form.primaryContactName}
                onChange={(event) => updateField('primaryContactName', event.target.value)}
                placeholder="Jane Doe"
                disabled={loading}
              />
            </label>
            <label>
              Primary Contact Email
              <WorksheetInput
                type="email"
                value={form.primaryContactEmail}
                onChange={(event) => updateField('primaryContactEmail', event.target.value)}
                placeholder="jane@acme.com"
                disabled={loading}
              />
            </label>
            <label>
              Primary Contact Phone
              <WorksheetInput
                type="text"
                value={form.primaryContactPhone}
                onChange={(event) => updateField('primaryContactPhone', event.target.value)}
                placeholder="(312) 555-0100"
                disabled={loading}
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Optional context for consultant prep."
                disabled={loading}
              />
            </label>
          </div>
        ) : null}

        {stepIndex === 2 ? (
          <>
            <div className="wizard-fields">
              <label>
                Company Name
                <WorksheetInput
                  type="text"
                  value={form.companyName}
                  onChange={(event) => updateField('companyName', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label>
                Industry
                <WorksheetInput
                  type="text"
                  value={form.industry}
                  onChange={(event) => updateField('industry', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label>
                Primary Contact Name
                <WorksheetInput
                  type="text"
                  value={form.primaryContactName}
                  onChange={(event) => updateField('primaryContactName', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label>
                Primary Contact Email
                <WorksheetInput
                  type="email"
                  value={form.primaryContactEmail}
                  onChange={(event) => updateField('primaryContactEmail', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label>
                Primary Contact Phone
                <WorksheetInput
                  type="text"
                  value={form.primaryContactPhone}
                  onChange={(event) => updateField('primaryContactPhone', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label>
                Location City
                <WorksheetInput
                  type="text"
                  value={form.locationCity}
                  onChange={(event) => updateField('locationCity', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label>
                Location State
                <WorksheetInput
                  type="text"
                  value={form.locationState}
                  onChange={(event) => updateField('locationState', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Notes
                <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} disabled={loading} />
              </label>
            </div>
            <p className="wizard-meta">Click Calculate+Save to normalize fields and persist this run.</p>
          </>
        ) : null}

        <div className="wizard-actions">
          <button type="button" className="ghost" onClick={() => setStepIndex((idx) => Math.max(0, idx - 1))} disabled={loading || stepIndex === 0}>
            Back
          </button>
          {stepIndex < steps.length - 1 ? (
            <button type="button" onClick={() => setStepIndex((idx) => Math.min(steps.length - 1, idx + 1))} disabled={loading || !canAdvance}>
              Next
            </button>
          ) : (
            <button type="submit" disabled={loading}>
              {loading ? 'Running...' : 'Calculate+Save'}
            </button>
          )}
          <button type="button" className="ghost" onClick={downloadPdf} disabled={pdfLoading || !result}>
            {pdfLoading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>

        {error ? <p className="wizard-error">{error}</p> : null}
        {pdfError ? <p className="wizard-error">{pdfError}</p> : null}
      </form>

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

          {Array.isArray(result.warnings) && result.warnings.length > 0 ? (
            <ul className="warnings">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p className="wizard-meta" style={{ marginTop: 0 }}>
              No contact warnings.
            </p>
          )}

          <p className="wizard-meta" style={{ marginBottom: 0 }}>
            Run ID: {runId || 'unsaved'}
          </p>
        </section>
      ) : null}

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
