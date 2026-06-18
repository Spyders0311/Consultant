'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import PLLineItemsEditor from '@/components/worksheet/PLLineItemsEditor';
import { patchFinancialSnapshot } from '@/lib/client/patchFinancialSnapshot';
import { pushTwelveMonthPLToAnnual } from '@/lib/client/pushFeederToPL';
import { rollupPLLineItems } from '@/lib/worksheets/plRollup';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';
import useWorksheetShellRunLoader from '@/lib/client/useWorksheetShellRunLoader';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function makeDefaultMonths() {
  return MONTH_LABELS.map(() => ({
    revenue: '',
    cogs: '',
    operatingExpenses: '',
    otherExpenses: '',
    lineItems: [],
  }));
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

export default function TwelveMonthPLComparisonsWizard({ clientId }) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [months, setMonths] = useState(makeDefaultMonths);
  const [inputMode, setInputMode] = useState('buckets');
  const [activeMonth, setActiveMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pushAudit, setPushAudit] = useState('');

  const shellForm = useMemo(() => ({ year, months, inputMode }), [year, months, inputMode]);
  useWorksheetShellForm(shellForm);

  function loadRun(run) {
    if (!run) return;
    setYear(String(run.inputs?.year || new Date().getFullYear()));
    setMonths(run.inputs?.months?.length === 12 ? run.inputs.months : makeDefaultMonths());
    setResult(run.outputs || null);
    const hasLineItems = (run.inputs?.months || []).some((m) => (m.lineItems || []).length > 0);
    if (hasLineItems) setInputMode('lineItems');
    setError('');
  }

  useWorksheetShellRunLoader(loadRun);

  const annualPreview = useMemo(() => {
    return months.reduce(
      (acc, month) => {
        if (inputMode === 'lineItems' && month.lineItems?.length) {
          const rolled = rollupPLLineItems(month.lineItems);
          acc.revenue += rolled.revenue;
          acc.cogs += rolled.cogs;
          acc.operatingExpenses += rolled.operatingExpenses;
          acc.otherExpenses += rolled.otherExpenses;
        } else {
          acc.revenue += parseNumber(month.revenue);
          acc.cogs += parseNumber(month.cogs);
          acc.operatingExpenses += parseNumber(month.operatingExpenses);
          acc.otherExpenses += parseNumber(month.otherExpenses);
        }
        return acc;
      },
      { revenue: 0, cogs: 0, operatingExpenses: 0, otherExpenses: 0 },
    );
  }, [months, inputMode]);

  function updateMonth(index, field, value) {
    setMonths((prev) => prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)));
  }

  function updateMonthLineItems(index, lineItems) {
    const rolled = rollupPLLineItems(lineItems.map((l) => ({ category: l.category, amount: parseNumber(l.amount) })));
    setMonths((prev) =>
      prev.map((row, idx) =>
        idx === index
          ? {
              ...row,
              lineItems,
              revenue: rolled.revenue,
              cogs: rolled.cogs,
              operatingExpenses: rolled.operatingExpenses,
              otherExpenses: rolled.otherExpenses,
            }
          : row,
      ),
    );
  }

  function buildPayload() {
    return {
      year: parseNumber(year),
      months: months.map((month) => ({
        revenue: parseNumber(month.revenue),
        cogs: parseNumber(month.cogs),
        operatingExpenses: parseNumber(month.operatingExpenses),
        otherExpenses: parseNumber(month.otherExpenses),
        lineItems: (month.lineItems || []).map((line) => ({
          category: line.category,
          description: line.description || '',
          amount: parseNumber(line.amount),
        })),
      })),
    };
  }

  async function calculateAndSave(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = buildPayload();

      const calculationResponse = await fetch('/api/worksheets/twelve-month-pl-comparisons/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Calculation failed.');
      }

      setResult(calculationData.result);

      await fetch('/api/worksheets/twelve-month-pl-comparisons/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, inputs: payload, outputs: calculationData.result }),
      });

      await patchFinancialSnapshot(clientId, 'twelve-month-pl-comparisons', {
        annualRevenue: calculationData.result?.annual?.revenue,
        annualCogs: calculationData.result?.annual?.cogs,
        annualOperatingExpenses: calculationData.result?.annual?.operatingExpenses,
        annualOtherExpenses: calculationData.result?.annual?.otherExpenses,
      });
    } catch (err) {
      setError(err.message || 'Unable to complete twelve month P&L run.');
    } finally {
      setLoading(false);
    }
  }

  async function pushToAnnualPL() {
    setPushLoading(true);
    setPushAudit('');
    setError('');
    try {
      const payload = buildPayload();
      await pushTwelveMonthPLToAnnual(clientId, payload);
      setPushAudit('Annual totals pushed to P&L Comparisons latest year.');
    } catch (err) {
      setError(err.message || 'Unable to push to P&L Comparisons.');
    } finally {
      setPushLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadRuns() {
      if (!clientId) return;
      const response = await fetch(
        `/api/worksheets/twelve-month-pl-comparisons/runs?client_id=${encodeURIComponent(clientId)}&limit=1`,
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (!cancelled && response.ok && data.ok && data.runs?.[0]) {
        const run = data.runs[0];
        setYear(String(run.inputs?.year || new Date().getFullYear()));
        setMonths(run.inputs?.months?.length === 12 ? run.inputs.months : makeDefaultMonths());
        setResult(run.outputs || null);
        const hasLineItems = (run.inputs?.months || []).some((m) => (m.lineItems || []).length > 0);
        if (hasLineItems) setInputMode('lineItems');
      }
    }
    loadRuns();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <section className="panel worksheet-wizard">
      <header className="wizard-header">
        <p className="wizard-kicker">Analyst Wizard</p>
        <h2>12 MONTH P&L COMPARISONS</h2>
        <p>Enter monthly summary buckets or line items; annual rollup feeds P&L comparisons.</p>
      </header>

      <form className="wizard-form" onSubmit={calculateAndSave}>
        <WorksheetInput label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />

        <div className="wizard-history-actions">
          <button
            type="button"
            className={inputMode === 'buckets' ? 'wizard-step-button active' : 'ghost'}
            onClick={() => setInputMode('buckets')}
          >
            Summary buckets
          </button>
          <button
            type="button"
            className={inputMode === 'lineItems' ? 'wizard-step-button active' : 'ghost'}
            onClick={() => setInputMode('lineItems')}
          >
            Line items
          </button>
        </div>

        <div className="wizard-step-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {MONTH_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={index === activeMonth ? 'wizard-step-button active' : 'ghost'}
              onClick={() => setActiveMonth(index)}
            >
              {label}
            </button>
          ))}
        </div>

        {inputMode === 'buckets' ? (
          <div className="wizard-grid">
            <WorksheetInput
              label="Revenue"
              type="number"
              value={months[activeMonth]?.revenue ?? ''}
              onChange={(e) => updateMonth(activeMonth, 'revenue', e.target.value)}
            />
            <WorksheetInput
              label="COGS"
              type="number"
              value={months[activeMonth]?.cogs ?? ''}
              onChange={(e) => updateMonth(activeMonth, 'cogs', e.target.value)}
            />
            <WorksheetInput
              label="OpEx"
              type="number"
              value={months[activeMonth]?.operatingExpenses ?? ''}
              onChange={(e) => updateMonth(activeMonth, 'operatingExpenses', e.target.value)}
            />
            <WorksheetInput
              label="Other"
              type="number"
              value={months[activeMonth]?.otherExpenses ?? ''}
              onChange={(e) => updateMonth(activeMonth, 'otherExpenses', e.target.value)}
            />
          </div>
        ) : (
          <PLLineItemsEditor
            yearLabel={MONTH_LABELS[activeMonth]}
            lineItems={months[activeMonth]?.lineItems || []}
            onChange={(items) => updateMonthLineItems(activeMonth, items)}
          />
        )}

        <p className="wizard-meta">
          Draft annual — Revenue {currency(annualPreview.revenue)} · COGS {currency(annualPreview.cogs)}
        </p>

        <div className="wizard-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Running...' : 'Run & Save'}
          </button>
          <button type="button" className="ghost" disabled={pushLoading || !clientId} onClick={pushToAnnualPL}>
            {pushLoading ? 'Pushing...' : 'Push to P&L Comparisons'}
          </button>
        </div>
        {pushAudit ? <p className="wizard-meta">{pushAudit}</p> : null}
        {error ? <p className="wizard-error">{error}</p> : null}
      </form>

      {result?.annual ? (
        <section className="wizard-result">
          <article>
            <span>Annual Revenue</span>
            <strong>{currency(result.annual.revenue)}</strong>
          </article>
          <article>
            <span>Annual Net Income</span>
            <strong>{currency(result.annual.netIncome)}</strong>
          </article>
        </section>
      ) : null}
    </section>
  );
}
