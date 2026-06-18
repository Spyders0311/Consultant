'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import { WORKBOOK_PORT_CONFIGS, buildDefaultFormState } from '@/lib/workbookPortConfigs';
import { PORT_BRIDGE_TARGETS } from '@/lib/worksheets/portBridges';

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

function number(value, maximumFractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(Number(value));
}

function formatValue(value, format) {
  if (format === 'currency') return currency(value);
  if (format === 'percent') return percent(value);
  if (format === 'number') return number(value);
  if (value === null || value === undefined || value === '') return 'n/a';
  return String(value);
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

function parseScalarValue(field, value) {
  if (field.type === 'text' || field.type === 'date') {
    return value ?? '';
  }
  if (value === '' || value === null || value === undefined) {
    return 0;
  }
  return parseNumber(value);
}

function parseCollectionRow(field, value) {
  if (field.type === 'text' || field.type === 'date' || field.type === 'select') {
    return value ?? '';
  }
  if (value === '' || value === null || value === undefined) {
    return 0;
  }
  return parseNumber(value);
}

function buildPayload(form, config) {
  const payload = {};

  for (const field of config.scalarFields || []) {
    payload[field.name] = parseScalarValue(field, form[field.name]);
  }

  for (const collection of config.collections || []) {
    const rows = Array.isArray(form[collection.key]) ? form[collection.key] : [];
    payload[collection.key] = rows.map((row) => {
      const parsedRow = {};
      for (const field of collection.fields) {
        parsedRow[field.name] = parseCollectionRow(field, row?.[field.name]);
      }
      return parsedRow;
    });
  }

  return payload;
}

function normalizeLoadedForm(inputs, config) {
  const defaults = buildDefaultFormState(config);
  const next = { ...defaults };

  for (const field of config.scalarFields || []) {
    if (inputs?.[field.name] !== undefined && inputs?.[field.name] !== null) {
      next[field.name] = String(inputs[field.name]);
    }
  }

  for (const collection of config.collections || []) {
    const loadedRows = Array.isArray(inputs?.[collection.key]) ? inputs[collection.key] : [];
    if (loadedRows.length === 0) continue;

    next[collection.key] = loadedRows.map((row, index) => {
      const defaultRow =
        typeof collection.buildDefaultRow === 'function'
          ? collection.buildDefaultRow(index)
          : buildDefaultFormState({ collections: [collection] })[collection.key]?.[0] || {};

      const normalizedRow = { ...defaultRow };
      for (const field of collection.fields) {
        if (row?.[field.name] !== undefined && row?.[field.name] !== null) {
          normalizedRow[field.name] =
            field.type === 'text' || field.type === 'date' || field.type === 'select'
              ? String(row[field.name])
              : String(row[field.name]);
        }
      }
      return normalizedRow;
    });
  }

  return next;
}

function renderScalarInput(field, value, onChange) {
  if (field.type === 'select') {
    return (
      <select value={value} onChange={onChange}>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <WorksheetInput
      type={field.type === 'date' ? 'date' : field.type === 'text' ? 'text' : 'number'}
      min={field.type === 'number' || field.type === 'percent' ? '0' : undefined}
      value={value}
      onChange={onChange}
      placeholder={field.placeholder}
    />
  );
}

export default function WorkbookPortWizard({ clientId, workbookKey }) {
  const config = WORKBOOK_PORT_CONFIGS[workbookKey];
  const [form, setForm] = useState(() => buildDefaultFormState(config));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(buildDefaultFormState(WORKBOOK_PORT_CONFIGS[workbookKey]));
    setResult(null);
    setRunId('');
    setError('');
  }, [workbookKey]);

  const historyMetric = config?.historyMetric;

  const canRun = useMemo(() => {
    if (!config) return false;
    return true;
  }, [config]);

  function updateScalar(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
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

      const index = rows.length;
      let nextRow;
      if (typeof collection.buildDefaultRow === 'function') {
        nextRow = collection.buildDefaultRow(index);
      } else {
        nextRow = {};
        for (const field of collection.fields) {
          if (field.type === 'select') {
            nextRow[field.name] = field.options?.[0]?.value || '';
          } else if (field.name === 'weekLabel' || field.name === 'period') {
            nextRow[field.name] = `${collection.rowLabel} ${index + 1}`;
          } else {
            nextRow[field.name] = '';
          }
        }
      }

      return {
        ...prev,
        [collection.key]: [...rows, nextRow],
      };
    });
  }

  function removeCollectionRow(collectionKey, rowIndex, minRows = 0) {
    setForm((prev) => {
      const rows = prev[collectionKey] || [];
      if (rows.length <= minRows) return prev;
      return {
        ...prev,
        [collectionKey]: rows.filter((_, index) => index !== rowIndex),
      };
    });
  }

  function loadRun(run) {
    if (!run || !config) return;
    setForm(normalizeLoadedForm(run.inputs || {}, config));
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setError('');
  }

  function resetToNewRun() {
    setForm(buildDefaultFormState(config));
    setResult(null);
    setRunId('');
    setError('');
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchRuns() {
      if (!clientId || !workbookKey) return;
      setRunsLoading(true);
      try {
        const response = await fetch(
          `/api/worksheets/workbook-ports/runs?client_id=${encodeURIComponent(clientId)}&workbook_key=${encodeURIComponent(workbookKey)}`,
          { cache: 'no-store' },
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load run history.');
        }

        if (cancelled) return;
        setRuns(data.runs || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load run history.');
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
  }, [clientId, workbookKey]);

  async function calculateAndSave(event) {
    event.preventDefault();
    if (!config) return;

    setLoading(true);
    setError('');

    try {
      const inputs = buildPayload(form, config);
      const calculationResponse = await fetch('/api/worksheets/workbook-ports/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workbookKey, inputs }),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Workbook calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/workbook-ports/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          workbook_key: workbookKey,
          inputs,
          outputs: calculationData.result,
        }),
      });
      const runData = await runResponse.json();
      if (!runResponse.ok || !runData.ok) {
        throw new Error(runData.error || 'Calculation succeeded but saving run failed.');
      }

      const savedRun = {
        id: runData.id || '',
        created_at: new Date().toISOString(),
        workbook_key: workbookKey,
        inputs,
        outputs: calculationData.result,
      };
      setRunId(savedRun.id);
      setRuns((prev) => [savedRun, ...prev.filter((run) => run.id !== savedRun.id)].slice(0, 10));
    } catch (err) {
      setError(err.message || 'Unable to complete workbook run.');
    } finally {
      setLoading(false);
    }
  }

  if (!config) {
    return (
      <section className="panel">
        <h2>Workbook Not Available</h2>
        <p>No wizard configuration was found for &ldquo;{workbookKey}&rdquo;.</p>
      </section>
    );
  }

  const summary = result?.summary || {};
  const rows = result?.rows || [];
  const warnings = result?.warnings || [];

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">{config.kicker}</p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
        {config.source ? <p className="wizard-meta">Source workbook: {config.source}</p> : null}
      </header>

      <form className="wizard-card" onSubmit={calculateAndSave}>
        {(config.scalarFields || []).length > 0 ? (
          <div className="wizard-fields">
            {config.scalarFields.map((field) => (
              <label key={field.name}>
                {field.label}
                {renderScalarInput(field, form[field.name] ?? '', (event) =>
                  updateScalar(field.name, event.target.value),
                )}
              </label>
            ))}
          </div>
        ) : null}

        {(config.collections || []).map((collection) => {
          const collectionRows = form[collection.key] || [];
          return (
            <section key={collection.key} className="wizard-collection">
              <div className="wizard-collection-header">
                <h3>{collection.title}</h3>
                <button
                  type="button"
                  className="ghost"
                  disabled={loading || collectionRows.length >= collection.maxRows}
                  onClick={() => addCollectionRow(collection)}
                >
                  Add {collection.rowLabel}
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {collection.fields.map((field) => (
                        <th key={field.name}>{field.label}</th>
                      ))}
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {collectionRows.map((row, rowIndex) => (
                      <tr key={`${collection.key}-${rowIndex}`}>
                        {collection.fields.map((field) => (
                          <td key={field.name}>
                            {field.type === 'select' ? (
                              <select
                                value={row[field.name] ?? ''}
                                onChange={(event) =>
                                  updateCollectionRow(collection.key, rowIndex, field.name, event.target.value)
                                }
                              >
                                {(field.options || []).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <WorksheetInput
                                type={field.type === 'date' ? 'date' : field.type === 'text' ? 'text' : 'number'}
                                min={field.type === 'number' || field.type === 'percent' ? '0' : undefined}
                                value={row[field.name] ?? ''}
                                onChange={(event) =>
                                  updateCollectionRow(collection.key, rowIndex, field.name, event.target.value)
                                }
                              />
                            )}
                          </td>
                        ))}
                        <td>
                          <button
                            type="button"
                            className="ghost"
                            disabled={loading || collectionRows.length <= (collection.minRows ?? 0)}
                            onClick={() => removeCollectionRow(collection.key, rowIndex, collection.minRows ?? 0)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <div className="wizard-actions">
          <button type="submit" disabled={loading || !canRun}>
            {loading ? 'Running...' : `Run ${config.title}`}
          </button>
          <button type="button" className="ghost" onClick={resetToNewRun} disabled={loading || runsLoading}>
            Start new run
          </button>
        </div>

        {error ? <p className="wizard-error">{error}</p> : null}
      </form>

      {result ? (
        <section className="wizard-result">
          {(config.summaryFields || []).length > 0 ? (
            <div className="wizard-kpis">
              {config.summaryFields.map((field) => (
                <article key={field.key}>
                  <span>{field.label}</span>
                  <strong>{formatValue(summary[field.key], field.format)}</strong>
                </article>
              ))}
            </div>
          ) : null}

          {(config.tableFields || []).length > 0 && rows.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {config.tableFields.map((field) => (
                      <th key={field.key}>{field.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`result-row-${index}`}>
                      {config.tableFields.map((field) => (
                        <td key={field.key}>{formatValue(row?.[field.key], field.format)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <ul className="warnings">
              {warnings.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}

          {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}

          {PORT_BRIDGE_TARGETS[workbookKey] ? (
            <div className="port-bridge-panel">
              <p className="wizard-meta">
                Send this run to{' '}
                <a href={`/workspace/${clientId}/analyst-wizard/sheets/${PORT_BRIDGE_TARGETS[workbookKey].worksheetKey}`}>
                  {PORT_BRIDGE_TARGETS[workbookKey].label}
                </a>{' '}
                using Pull / Import from workbook port on that worksheet.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="wizard-history" aria-label="Workbook run history">
        <div className="wizard-history-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => loadRun(runs[0])}
            disabled={loading || runsLoading || runs.length === 0}
          >
            Continue last run
          </button>
        </div>
        <ul className="wizard-history-list">
          {runs.slice(0, 10).map((run) => {
            const metricValue = historyMetric ? run.outputs?.summary?.[historyMetric.key] : null;
            return (
              <li key={run.id}>
                <span>
                  {formatRunTimestamp(run.created_at)}
                  {historyMetric && metricValue !== undefined && metricValue !== null
                    ? ` — ${historyMetric.label}: ${formatValue(metricValue, historyMetric.format)}`
                    : ''}
                </span>
                <button type="button" className="ghost" onClick={() => loadRun(run)} disabled={loading || runsLoading}>
                  Load
                </button>
              </li>
            );
          })}
          {!runsLoading && runs.length === 0 ? <li className="wizard-history-empty">No saved runs yet.</li> : null}
        </ul>
      </section>
    </section>
  );
}
