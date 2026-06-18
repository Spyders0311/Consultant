'use client';

import { useEffect, useState } from 'react';
import ProgressDonut from '@/components/hub/ProgressDonut';
import { fetchWorksheetRuns } from '@/lib/client/fetchWorksheetRuns';
import { getRequiredFieldCompletion } from '@/lib/worksheets/requiredFields';

function formatRunTimestamp(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * @param {{
 *   clientId: string,
 *   worksheetKey: string,
 *   formValues?: Record<string, unknown>,
 *   completionPercent?: number|null,
 *   onSelectRun?: (run: Record<string, unknown>) => void,
 * }} props
 */
export default function WorksheetStatusRail({
  clientId,
  worksheetKey,
  formValues = {},
  completionPercent = null,
  onSelectRun,
}) {
  const [runs, setRuns] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [runsLoading, setRunsLoading] = useState(true);
  const [runsError, setRunsError] = useState('');

  const completion = getRequiredFieldCompletion(worksheetKey, formValues);
  const percent = completionPercent ?? completion.percent;
  const hasRequiredRules = completion.total > 0;

  useEffect(() => {
    let cancelled = false;

    async function loadRuns() {
      setRunsLoading(true);
      setRunsError('');
      try {
        const data = await fetchWorksheetRuns(clientId, worksheetKey, { limit: 3 });
        if (!cancelled) {
          setRuns(data);
        }
      } catch (error) {
        if (!cancelled) {
          setRunsError(error instanceof Error ? error.message : 'Unable to load recent runs.');
          setRuns([]);
        }
      } finally {
        if (!cancelled) {
          setRunsLoading(false);
        }
      }
    }

    loadRuns();

    return () => {
      cancelled = true;
    };
  }, [clientId, worksheetKey]);

  return (
    <aside className="worksheet-status-rail" aria-label="Worksheet status">
      <section className="hub-rail-panel worksheet-status-rail__panel">
        <h3>Completion</h3>
        <div className="worksheet-status-rail__completion">
          <ProgressDonut percent={percent} label="Required fields complete" size={84} />
          <div>
            {hasRequiredRules ? (
              <p>
                <strong>{completion.completed}</strong> of <strong>{completion.total}</strong> required fields
              </p>
            ) : (
              <p>Required-field manifest not configured for this worksheet yet.</p>
            )}
            <p className="worksheet-status-rail__hint">{percent}% complete</p>
          </div>
        </div>
      </section>

      <section className="hub-rail-panel worksheet-status-rail__panel">
        <h3>Recent runs</h3>
        {runsLoading ? <p>Loading runs…</p> : null}
        {runsError ? <p className="worksheet-status-rail__error">{runsError}</p> : null}
        {!runsLoading && !runsError && runs.length === 0 ? (
          <p>No saved runs yet. Calculate and save to see history here.</p>
        ) : null}
        {!runsLoading && runs.length > 0 ? (
          <ul className="worksheet-status-rail__runs">
            {runs.map((run) => {
              const runId = String(run.id || '');
              const timestamp = formatRunTimestamp(run.created_at || run.updated_at);

              return (
                <li key={runId || timestamp}>
                  {onSelectRun ? (
                    <button type="button" className="worksheet-status-rail__run-btn" onClick={() => onSelectRun(run)}>
                      <span className="worksheet-status-rail__run-time">{timestamp}</span>
                      {runId ? <span className="worksheet-status-rail__run-id">Run {runId.slice(0, 8)}</span> : null}
                    </button>
                  ) : (
                    <div className="worksheet-status-rail__run-static">
                      <span className="worksheet-status-rail__run-time">{timestamp}</span>
                      {runId ? <span className="worksheet-status-rail__run-id">Run {runId.slice(0, 8)}</span> : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="hub-rail-panel worksheet-status-rail__panel worksheet-status-rail__panel--placeholder">
        <h3>Validation</h3>
        <p>Cross-field checks and blocking issues will appear here in a future release.</p>
      </section>
    </aside>
  );
}
