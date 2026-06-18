'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import { patchFinancialSnapshot } from '@/lib/client/patchFinancialSnapshot';
import { buildFeederLineItem, pushFeederLineToPLComparisons } from '@/lib/client/pushFeederToPL';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';
import useWorksheetShellRunLoader from '@/lib/client/useWorksheetShellRunLoader';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function makeDefaultMonths(categoryDefault) {
  return MONTH_LABELS.map(() => ({
    lines: [{ category: categoryDefault, description: '', amount: '' }],
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

export default function TwelveMonthAnalysisWizard({ clientId, config }) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [months, setMonths] = useState(() => makeDefaultMonths(config.categories[0]?.value || 'other'));
  const [activeMonth, setActiveMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushAudit, setPushAudit] = useState('');

  const annualPreview = useMemo(
    () =>
      months.reduce((sum, month) => {
        const monthTotal = (month.lines || []).reduce((mSum, line) => mSum + parseNumber(line.amount), 0);
        return sum + monthTotal;
      }, 0),
    [months],
  );

  const shellForm = useMemo(() => ({ year, months }), [year, months]);
  useWorksheetShellForm(shellForm);

  function loadRun(run) {
    if (!run) return;
    setYear(String(run.inputs?.year || new Date().getFullYear()));
    setMonths(
      run.inputs?.months?.length === 12
        ? run.inputs.months
        : makeDefaultMonths(config.categories[0]?.value || 'other'),
    );
    setResult(run.outputs || null);
    setError('');
  }

  useWorksheetShellRunLoader(loadRun);

  function updateLine(monthIndex, lineIndex, field, value) {
    setMonths((prev) =>
      prev.map((month, mIdx) => {
        if (mIdx !== monthIndex) return month;
        const lines = (month.lines || []).map((line, lIdx) =>
          lIdx === lineIndex ? { ...line, [field]: value } : line,
        );
        return { ...month, lines };
      }),
    );
  }

  function addLine(monthIndex) {
    setMonths((prev) =>
      prev.map((month, mIdx) => {
        if (mIdx !== monthIndex) return month;
        return {
          ...month,
          lines: [...(month.lines || []), { category: config.categories[0]?.value || 'other', description: '', amount: '' }],
        };
      }),
    );
  }

  async function calculateAndSave(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        year: parseNumber(year),
        analysisType: config.analysisType,
        months: months.map((month) => ({
          lines: (month.lines || []).map((line) => ({
            category: line.category,
            description: line.description,
            amount: parseNumber(line.amount),
          })),
        })),
      };

      const calculationResponse = await fetch('/api/worksheets/twelve-month-analysis/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Calculation failed.');
      }

      setResult(calculationData.result);

      await fetch('/api/worksheets/twelve-month-analysis/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          analysis_type: config.analysisType,
          inputs: payload,
          outputs: calculationData.result,
        }),
      });

      await patchFinancialSnapshot(clientId, config.worksheetKey, {
        [`${config.analysisType}AnnualTotal`]: calculationData.result?.annualTotal,
      });
    } catch (err) {
      setError(err.message || 'Unable to complete monthly analysis run.');
    } finally {
      setLoading(false);
    }
  }

  async function pushToPLComparisons() {
    if (!result?.annualTotal) return;
    setPushLoading(true);
    setPushAudit('');
    setError('');
    try {
      const lineItem = buildFeederLineItem(config, result.annualTotal);
      await pushFeederLineToPLComparisons(clientId, lineItem);
      setPushAudit(`Pushed ${config.title} annual total to P&L Comparisons.`);
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
        `/api/worksheets/twelve-month-analysis/runs?client_id=${encodeURIComponent(clientId)}&analysis_type=${encodeURIComponent(config.analysisType)}&limit=1`,
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (!cancelled && response.ok && data.ok && data.runs?.[0]) {
        const run = data.runs[0];
        setYear(String(run.inputs?.year || new Date().getFullYear()));
        setMonths(run.inputs?.months?.length === 12 ? run.inputs.months : makeDefaultMonths(config.categories[0]?.value));
        setResult(run.outputs || null);
      }
    }
    loadRuns();
    return () => {
      cancelled = true;
    };
  }, [clientId, config.analysisType, config.categories]);

  const currentMonth = months[activeMonth] || { lines: [] };

  return (
    <section className="panel worksheet-wizard">
      <header className="wizard-header">
        <p className="wizard-kicker">Analyst Wizard</p>
        <h2>{config.title}</h2>
        <p>{config.description}</p>
      </header>

      <form className="wizard-form" onSubmit={calculateAndSave}>
        <WorksheetInput label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />

        <div className="wizard-step-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {MONTH_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={index === activeMonth ? 'wizard-step-button active' : 'wizard-step-button'}
              onClick={() => setActiveMonth(index)}
            >
              {label}
            </button>
          ))}
        </div>

        <h3>{MONTH_LABELS[activeMonth]}</h3>
        <div className="wizard-grid">
          {(currentMonth.lines || []).map((line, lineIndex) => (
            <div key={`${activeMonth}-${lineIndex}`} className="wizard-grid-row">
              <label>
                Category
                <select
                  value={line.category}
                  onChange={(e) => updateLine(activeMonth, lineIndex, 'category', e.target.value)}
                >
                  {config.categories.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <WorksheetInput
                label="Description"
                value={line.description || ''}
                onChange={(e) => updateLine(activeMonth, lineIndex, 'description', e.target.value)}
              />
              <WorksheetInput
                label="Amount"
                type="number"
                min="0"
                value={line.amount ?? ''}
                onChange={(e) => updateLine(activeMonth, lineIndex, 'amount', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="wizard-actions">
          <button type="button" className="ghost" onClick={() => addLine(activeMonth)}>
            Add line
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Running...' : 'Run & Save'}
          </button>
          <button type="button" className="ghost" disabled={!result || pushLoading} onClick={pushToPLComparisons}>
            {pushLoading ? 'Pushing...' : 'Push to P&L Comparisons'}
          </button>
        </div>

        <p className="wizard-meta">Draft annual total: {currency(annualPreview)}</p>
        {pushAudit ? <p className="wizard-meta">{pushAudit}</p> : null}
        {error ? <p className="wizard-error">{error}</p> : null}
      </form>

      {result ? (
        <section className="wizard-result">
          <article>
            <span>Annual Total</span>
            <strong>{currency(result.annualTotal)}</strong>
          </article>
        </section>
      ) : null}
    </section>
  );
}
