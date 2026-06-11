'use client';

import { formatRunTimestamp, formatValue, getPath } from '@/lib/format';

function metricLabel(metric, outputs) {
  if (!metric) return null;
  return `${formatValue(getPath(outputs, metric.key), metric.type)} ${metric.label}`;
}

/**
 * Saved-run history with continue-last / start-new shortcuts and optional
 * extra actions (cross-worksheet prefill pulls).
 */
export default function RunHistoryPanel({
  title,
  runs,
  runsLoading,
  disabled,
  metric,
  onLoadRun,
  onStartNew,
  extraActions = [],
  audit,
}) {
  return (
    <section className="wizard-history" aria-label={title || 'Run history'}>
      <div className="wizard-history-actions">
        <button
          type="button"
          className="ghost"
          onClick={() => onLoadRun(runs[0])}
          disabled={disabled || runsLoading || runs.length === 0}
        >
          Continue last run
        </button>
        <button type="button" className="ghost" onClick={onStartNew} disabled={disabled || runsLoading}>
          Start new run
        </button>
        {extraActions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="ghost"
            onClick={action.onClick}
            disabled={disabled || action.disabled}
          >
            {action.label}
          </button>
        ))}
      </div>
      {audit ? <p className="wizard-meta">{audit}</p> : null}
      <ul className="wizard-history-list">
        {runs.slice(0, 10).map((run) => (
          <li key={run.id}>
            <span>
              {formatRunTimestamp(run.created_at)}
              {metric ? <span className="wizard-history-metric"> · {metricLabel(metric, run.outputs)}</span> : null}
            </span>
            <button type="button" className="ghost" onClick={() => onLoadRun(run)} disabled={disabled || runsLoading}>
              Load
            </button>
          </li>
        ))}
        {runsLoading ? <li className="wizard-history-empty">Loading history…</li> : null}
        {!runsLoading && runs.length === 0 ? <li className="wizard-history-empty">No saved runs yet.</li> : null}
      </ul>
    </section>
  );
}
