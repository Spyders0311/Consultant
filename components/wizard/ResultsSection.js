'use client';

import { formatValue, getPath } from '@/lib/format';

function display(value, column) {
  if (column.format) return column.format(value);
  return formatValue(value, column.type);
}

/**
 * Declarative results renderer: KPI cards, result tables, warning notes,
 * meta lines, and the saved-run id. results.render(result, ctx) overrides
 * the whole body for bespoke layouts.
 */
export default function ResultsSection({ results, result, runId }) {
  if (!result) return null;

  if (results?.render) {
    return (
      <section className="wizard-result">
        {results.render(result, { formatValue, getPath })}
        {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}
      </section>
    );
  }

  const kpis = results?.kpis || [];
  const tables = results?.tables || [];
  const notesKey = results?.notesKey || 'warnings';
  const notes = result?.[notesKey] || [];
  const meta = results?.meta || [];

  return (
    <section className="wizard-result">
      {results?.title ? <h2>{results.title}</h2> : null}

      {kpis.length ? (
        <div className="wizard-kpis">
          {kpis.map((kpi) => (
            <article key={`${kpi.key}:${kpi.label}`}>
              <span>{kpi.label}</span>
              <strong>{display(getPath(result, kpi.key), kpi)}</strong>
            </article>
          ))}
        </div>
      ) : null}

      {tables.map((table) => {
        const rows = getPath(result, table.rowsKey) || [];
        if (!rows.length) return null;
        const columns = table.dynamicColumns
          ? Object.keys(rows[0] || {}).map((key) => ({
              key,
              label: key,
              format: (value) => formatValue(value, typeof value === 'number' ? 'decimal' : 'text'),
            }))
          : table.columns;
        return (
          <div className="table-wrap" key={table.rowsKey}>
            {table.title ? <h3>{table.title}</h3> : null}
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${table.rowsKey}-${index + 1}`}>
                    {columns.map((column) => (
                      <td key={column.key} className={column.type && column.type !== 'text' ? 'cell-num' : undefined}>
                        {display(getPath(row, column.key), column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {meta.map((entry) => {
        const value = getPath(result, entry.key);
        if (value === null || value === undefined || value === '') return null;
        return (
          <p className="wizard-meta" key={entry.key}>
            {entry.label}: {entry.format ? entry.format(value) : String(value)}
          </p>
        );
      })}

      {notes.length ? (
        <ul className="warnings">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {runId ? <p className="wizard-meta">Saved run ID: {runId}</p> : null}
    </section>
  );
}
