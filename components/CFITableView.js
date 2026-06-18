'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import { DERIVED_RATIO_LABELS } from '@/lib/worksheets/derivedRatioConfigs';
import { CFI_TABLE_SECTIONS } from '@/lib/worksheets/cfiTableModel';
import {
  buildBalanceSheetRows,
  buildCfiReportingPeriod,
  buildCfiSummaryMetrics,
  buildCycleDriverRows,
  buildFinancialRatiosPayload,
  buildIncomeStatementRows,
  CFI_RATIO_KEYS,
} from '@/lib/worksheets/cfiTableModel';

function currency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

function formatMetricValue(metric) {
  if (metric.format === 'currency') return currency(metric.value);
  if (metric.format === 'percent') {
    if (metric.value == null || Number.isNaN(Number(metric.value))) return '—';
    return `${Number(metric.value).toFixed(1)}%`;
  }
  if (metric.format === 'days') {
    if (metric.value == null || Number.isNaN(Number(metric.value))) return '—';
    return `${Number(metric.value).toFixed(1)} days`;
  }
  return String(metric.value ?? '—');
}

function formatRatioValue(key, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  if (key.toLowerCase().includes('pct') || key.toLowerCase().includes('margin')) {
    return `${Number(value).toFixed(1)}%`;
  }
  if (key.toLowerCase().includes('days')) {
    return `${Number(value).toFixed(1)} days`;
  }
  return Number(value).toFixed(2);
}

/**
 * @param {{
 *   form: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   result?: Record<string, unknown>|null,
 *   linkedPlYear?: Record<string, unknown>|null,
 *   linkedBsYear?: Record<string, unknown>|null,
 *   linkedBsComputed?: Record<string, unknown>|null,
 *   staleFields?: string[],
 *   sectionIndex?: number,
 *   onSectionChange?: (index: number) => void,
 * }} props
 */
export default function CFITableView({
  form,
  onFieldChange,
  result = null,
  linkedPlYear = null,
  linkedBsYear = null,
  linkedBsComputed = null,
  staleFields = [],
  sectionIndex = 0,
  onSectionChange = null,
}) {
  const [ratios, setRatios] = useState(null);
  const [ratiosLoading, setRatiosLoading] = useState(false);
  const [ratiosError, setRatiosError] = useState('');

  const reporting = useMemo(
    () => buildCfiReportingPeriod(linkedPlYear, linkedBsYear),
    [linkedPlYear, linkedBsYear],
  );
  const incomeRows = useMemo(() => buildIncomeStatementRows(form, result), [form, result]);
  const balanceRows = useMemo(
    () => buildBalanceSheetRows(linkedBsYear, linkedBsComputed, result),
    [linkedBsYear, linkedBsComputed, result],
  );
  const cycleRows = useMemo(() => buildCycleDriverRows(form), [form]);
  const summaryMetrics = useMemo(() => buildCfiSummaryMetrics(result), [result]);

  useEffect(() => {
    const payload = buildFinancialRatiosPayload(
      form,
      linkedPlYear,
      linkedBsYear,
      linkedBsComputed,
      reporting.year,
    );

    if (!payload.plYear && !payload.bsYear) {
      setRatios(null);
      setRatiosError('');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setRatiosLoading(true);
      setRatiosError('');
      try {
        const response = await fetch('/api/worksheets/financial-ratios/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plYear: payload.plYear,
            bsYear: payload.bsYear,
            bsComputed: payload.bsComputed || {},
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to calculate ratios.');
        }
        if (!cancelled) {
          setRatios(data.result);
        }
      } catch (err) {
        if (!cancelled) {
          setRatios(null);
          setRatiosError(err instanceof Error ? err.message : 'Unable to calculate ratios.');
        }
      } finally {
        if (!cancelled) {
          setRatiosLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form, linkedPlYear, linkedBsYear, linkedBsComputed, reporting.year]);

  function renderAmount(row) {
    if (row.editable && row.field) {
      return (
        <WorksheetInput
          type="number"
          className="cfi-table-view__input"
          value={String(form[row.field] ?? '')}
          onChange={(event) => onFieldChange(row.field, event.target.value)}
          isStale={staleFields.includes(row.field)}
        />
      );
    }
    return <span className="cfi-table-view__amount">{currency(row.value)}</span>;
  }

  return (
    <div className="cfi-table-view workspace-hub">
      {onSectionChange ? (
        <nav className="cfi-table-view__section-nav" aria-label="CFI sections">
          {CFI_TABLE_SECTIONS.map((section, index) => (
            <button
              key={section.id}
              type="button"
              className={sectionIndex === index ? 'tab active' : 'tab'}
              onClick={() => onSectionChange(index)}
              aria-current={sectionIndex === index ? 'step' : undefined}
            >
              {section.title}
            </button>
          ))}
        </nav>
      ) : null}

      <header
        className={`cfi-table-view__period-bar${sectionIndex === 2 ? ' cfi-table-view__period-bar--active' : ''}`}
      >
        <div>
          <p className="cfi-table-view__period-label">Reporting period</p>
          <h2 className="cfi-table-view__period-title">{reporting.label}</h2>
          <p className="cfi-table-view__period-meta">{reporting.sourceNote}</p>
        </div>
        <dl className="cfi-table-view__cycle-strip">
          {cycleRows.slice(0, 3).map((row) => (
            <div key={row.key}>
              <dt>{row.label}</dt>
              <dd>
                {row.field ? (
                  <WorksheetInput
                    type="number"
                    min="0"
                    className="cfi-table-view__cycle-input"
                    value={String(form[row.field] ?? '')}
                    onChange={(event) => onFieldChange(row.field, event.target.value)}
                    isStale={staleFields.includes(row.field)}
                  />
                ) : (
                  '—'
                )}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="cfi-table-view__layout">
        <div className="cfi-table-view__tables">
          <section
            className={`cfi-table-view__panel${sectionIndex === 0 ? ' cfi-table-view__panel--active' : ''}`}
            aria-labelledby="cfi-income-heading"
          >
            <h3 id="cfi-income-heading">Income Statement</h3>
            <div className="cfi-table-view__table-wrap">
              <table className="cfi-table-view__table">
                <thead>
                  <tr>
                    <th scope="col">Line item</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeRows.map((row) => (
                    <tr
                      key={row.key}
                      className={[
                        row.emphasis ? 'cfi-table-view__row--emphasis' : '',
                        row.indent ? 'cfi-table-view__row--indent' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <th scope="row">{row.label}</th>
                      <td>{renderAmount(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            className={`cfi-table-view__panel${sectionIndex === 1 ? ' cfi-table-view__panel--active' : ''}`}
            aria-labelledby="cfi-balance-heading"
          >
            <h3 id="cfi-balance-heading">
              {linkedBsYear ? 'Balance Sheet' : 'Working Capital (estimated)'}
            </h3>
            <div className="cfi-table-view__table-wrap">
              <table className="cfi-table-view__table">
                <thead>
                  <tr>
                    <th scope="col">Line item</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceRows.map((row) => (
                    <tr key={row.key} className={row.emphasis ? 'cfi-table-view__row--emphasis' : ''}>
                      <th scope="row">{row.label}</th>
                      <td>{renderAmount(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!linkedBsYear ? (
              <p className="cfi-table-view__hint">
                Link a Balance Sheet Comparisons run to show full statement lines.
              </p>
            ) : null}
          </section>

          <section
            className={`cfi-table-view__panel${sectionIndex === 3 ? ' cfi-table-view__panel--active' : ''}`}
            aria-labelledby="cfi-capacity-heading"
          >
            <h3 id="cfi-capacity-heading">Capacity Assumptions</h3>
            <div className="cfi-table-view__table-wrap">
              <table className="cfi-table-view__table">
                <tbody>
                  {cycleRows.slice(3).map((row) => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      <td>{renderAmount(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <label className={`cfi-table-view__notes${sectionIndex === 4 ? ' cfi-table-view__panel--active' : ''}`}>
            Optional Notes
            <textarea
              rows={3}
              value={String(form.optionalNotes ?? '')}
              onChange={(event) => onFieldChange('optionalNotes', event.target.value)}
              placeholder="Context for assumptions or known outliers."
            />
          </label>
        </div>

        <aside
          className={`cfi-table-view__metrics${sectionIndex === 4 ? ' cfi-table-view__panel--active' : ''}`}
          aria-label="Key metrics"
        >
          <section className="hub-rail-panel">
            <h3>CFI Summary</h3>
            {summaryMetrics.length === 0 ? (
              <p className="cfi-table-view__hint">Run calculate to populate CFI summary metrics.</p>
            ) : (
              <dl className="cfi-table-view__metric-list">
                {summaryMetrics.map((metric) => (
                  <div key={metric.key}>
                    <dt>{metric.label}</dt>
                    <dd>{formatMetricValue(metric)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="hub-rail-panel">
            <h3>Financial Ratios</h3>
            {ratiosLoading ? <p className="cfi-table-view__hint">Updating ratios…</p> : null}
            {ratiosError ? <p className="wizard-error">{ratiosError}</p> : null}
            {!ratiosLoading && !ratios && !ratiosError ? (
              <p className="cfi-table-view__hint">Enter revenue or link P&amp;L / BS runs for live ratios.</p>
            ) : null}
            {ratios ? (
              <dl className="cfi-table-view__metric-list">
                {CFI_RATIO_KEYS.map((key) => (
                  <div key={key}>
                    <dt>{DERIVED_RATIO_LABELS[key] || key}</dt>
                    <dd>{formatRatioValue(key, ratios.ratios?.[key])}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
