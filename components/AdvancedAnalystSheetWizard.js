'use client';

import { useEffect, useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';

const SHEET_CONFIGS = {
  '12-month-p-l-comparisons': {
    title: '12 Month P&L Comparisons',
    source: '12 MONTH P&L COMPARISONS',
    collectionKey: 'months',
    rowCount: 12,
    defaultRowLabel: 'Month',
    summaryFields: [
      ['totalRevenue', 'Total Revenue', 'currency'],
      ['totalGrossProfit', 'Gross Profit', 'currency'],
      ['grossMarginPct', 'Gross Margin', 'percent'],
      ['totalNetIncome', 'Net Income', 'currency'],
    ],
    rowFields: [
      ['period', 'Period', 'text'],
      ['revenue', 'Revenue', 'currency'],
      ['directLabor', 'Direct Labor', 'currency'],
      ['materials', 'Materials', 'currency'],
      ['subcontractors', 'Sub Contractors', 'currency'],
      ['miscDirectCost', 'Misc Direct Cost', 'currency'],
      ['payroll', 'Total Payroll', 'currency'],
      ['operatingExpenses', 'Operating Expense', 'currency'],
    ],
  },
  'p-l-comparisons-min-max': {
    title: 'P&L Comparisons Min Max',
    source: 'P&L COMPARISONS MIN MAX',
    collectionKey: 'years',
    rowCount: 4,
    defaultRowLabel: 'Year',
    summaryFields: [
      ['periodCount', 'Periods', 'number'],
      ['highestRevenue', 'Highest Revenue', 'currency'],
      ['lowestRevenue', 'Lowest Revenue', 'currency'],
    ],
    rowFields: [
      ['year', 'Year', 'number'],
      ['revenue', 'Revenue', 'currency'],
      ['cogs', 'COGS', 'currency'],
      ['operatingExpenses', 'Operating Exp.', 'currency'],
      ['otherExpenses', 'Other Exp.', 'currency'],
    ],
  },
  'misc-direct-expenses': {
    title: 'Misc Direct Expenses',
    source: 'MISC DIRECT EXPENSES',
    collectionKey: 'expenses',
    rowCount: 12,
    defaultRowLabel: 'Direct Expense',
    summaryFields: [
      ['totalBudget', 'Budget', 'currency'],
      ['totalActual', 'Actual', 'currency'],
      ['totalVariance', 'Variance', 'currency'],
      ['variancePct', 'Variance %', 'percent'],
    ],
    rowFields: [
      ['category', 'Category', 'text'],
      ['budget', 'Budget', 'currency'],
      ['actual', 'Actual', 'currency'],
    ],
  },
  'misc-indirect-expenses': {
    title: 'Misc Indirect Expenses',
    source: 'MISC INDIRECT EXPENSES',
    collectionKey: 'expenses',
    rowCount: 12,
    defaultRowLabel: 'Indirect Expense',
    summaryFields: [
      ['totalBudget', 'Budget', 'currency'],
      ['totalActual', 'Actual', 'currency'],
      ['totalVariance', 'Variance', 'currency'],
      ['variancePct', 'Variance %', 'percent'],
    ],
    rowFields: [
      ['category', 'Category', 'text'],
      ['budget', 'Budget', 'currency'],
      ['actual', 'Actual', 'currency'],
    ],
  },
  'z-score-private-heavy-assets': {
    title: 'Z Score - Private Heavy Assets',
    source: 'Z SCORE -PRIVATE & HEAVY ASSETS',
    scalarFields: [
      ['netSales', 'Net Sales'],
      ['currentAssets', 'Current Assets'],
      ['currentLiabilities', 'Current Liabilities'],
      ['annualIncomeFromOperations', 'Annual Income From Operations'],
      ['interestExpense', 'Interest Expense'],
      ['treasuryStock', 'Treasury Stock'],
      ['retainedEarnings', 'Retained Earnings'],
      ['totalAssets', 'Total Assets'],
      ['totalLiabilities', 'Total Liabilities'],
    ],
    summaryFields: [
      ['zScore', 'Z-Score', 'decimal'],
      ['zone', 'Risk Zone', 'text'],
    ],
  },
  'comparative-activity-ratios': {
    title: 'Comparative Activity Ratios',
    source: 'COMPARATIVE ACTIVITY RATIOS',
    scalarFields: [
      ['monthsInPeriod', '# Months in Period'],
      ['cash', 'Cash'],
      ['currentAssets', 'Current Assets'],
      ['inventory', 'Inventory'],
      ['currentLiabilities', 'Current Liabilities'],
      ['revenue', 'Revenue'],
      ['cogs', 'COGS'],
      ['annualMaterialCost', 'Annual Material Cost'],
      ['accountsReceivable', 'Accounts Receivable'],
      ['accountsPayable', 'Accounts Payable'],
      ['fixedAssets', 'Fixed Assets'],
      ['totalAssets', 'Total Assets'],
      ['totalLiabilities', 'Total Liabilities'],
      ['equity', 'Equity / Net Worth'],
      ['dailyExpenses', 'Daily Expenses'],
    ],
    summaryFields: [
      ['currentRatio', 'Current Ratio', 'decimal'],
      ['quickRatio', 'Quick Ratio', 'decimal'],
      ['assetTurnover', 'Asset Turnover', 'decimal'],
      ['debtRatio', 'Debt Ratio', 'decimal'],
    ],
  },
};

function makeRows(config) {
  return Array.from({ length: config.rowCount || 0 }, (_, index) => {
    const row = {};
    for (const [key, , type] of config.rowFields || []) {
      row[key] = type === 'text' ? `${config.defaultRowLabel} ${index + 1}` : '';
    }
    return row;
  });
}

function makeInitialInputs(config) {
  if (config.collectionKey) {
    return { [config.collectionKey]: makeRows(config) };
  }

  return Object.fromEntries((config.scalarFields || []).map(([key]) => [key, '']));
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeInputs(config, inputs) {
  if (config.collectionKey) {
    const rows = Array.isArray(inputs?.[config.collectionKey]) ? inputs[config.collectionKey] : [];
    return {
      [config.collectionKey]: rows.map((row) => {
        const normalized = {};
        for (const [key, , type] of config.rowFields || []) {
          normalized[key] = type === 'text' ? String(row?.[key] || '') : parseNumber(row?.[key]);
        }
        return normalized;
      }),
    };
  }

  return Object.fromEntries((config.scalarFields || []).map(([key]) => [key, parseNumber(inputs?.[key])]));
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return 'n/a';
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      Number(value),
    );
  }
  if (type === 'percent') return `${Number(value).toFixed(1)}%`;
  if (type === 'decimal') return Number(value).toFixed(2);
  if (type === 'number') return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(Number(value));
  return String(value);
}

function formatRunTimestamp(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function resultColumns(result) {
  const sample = result?.rows?.[0] || {};
  return Object.keys(sample);
}

export default function AdvancedAnalystSheetWizard({ clientId, sheetKey }) {
  const config = SHEET_CONFIGS[sheetKey];
  const [inputs, setInputs] = useState(() => makeInitialInputs(config));
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState('');
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canRun = useMemo(() => {
    if (!config) return false;
    if (config.collectionKey) {
      return (inputs[config.collectionKey] || []).some((row) =>
        Object.entries(row).some(([key, value]) => key !== 'period' && key !== 'category' && parseNumber(value) !== 0),
      );
    }
    return Object.values(inputs).some((value) => parseNumber(value) !== 0);
  }, [config, inputs]);

  useEffect(() => {
    let cancelled = false;

    async function fetchRuns() {
      if (!clientId || !sheetKey) return;
      setRunsLoading(true);
      try {
        const response = await fetch(
          `/api/worksheets/advanced-analyst-sheet/runs?client_id=${encodeURIComponent(clientId)}&sheet_key=${encodeURIComponent(sheetKey)}`,
          { cache: 'no-store' },
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load saved runs.');
        }
        if (!cancelled) setRuns(data.runs || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load saved runs.');
      } finally {
        if (!cancelled) setRunsLoading(false);
      }
    }

    fetchRuns();
    return () => {
      cancelled = true;
    };
  }, [clientId, sheetKey]);

  if (!config) {
    return (
      <section className="panel">
        <h2>Unsupported worksheet</h2>
        <p>This advanced analyst worksheet has not been configured yet.</p>
      </section>
    );
  }

  function updateScalar(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function updateRow(index, key, value) {
    setInputs((prev) => ({
      ...prev,
      [config.collectionKey]: prev[config.collectionKey].map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    }));
  }

  function loadRun(run) {
    setInputs({ ...makeInitialInputs(config), ...(run.inputs || {}) });
    setResult(run.outputs || null);
    setRunId(run.id || '');
    setError('');
  }

  function resetToNewRun() {
    setInputs(makeInitialInputs(config));
    setResult(null);
    setRunId('');
    setError('');
  }

  async function calculateAndSave(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        sheetKey,
        inputs: normalizeInputs(config, inputs),
      };
      const calculationResponse = await fetch('/api/worksheets/advanced-analyst-sheet/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const calculationData = await calculationResponse.json();
      if (!calculationResponse.ok || !calculationData.ok) {
        throw new Error(calculationData.error || 'Advanced analyst sheet calculation failed.');
      }

      setResult(calculationData.result);

      const runResponse = await fetch('/api/worksheets/advanced-analyst-sheet/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          sheet_key: sheetKey,
          inputs: payload.inputs,
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
        inputs: payload.inputs,
        outputs: calculationData.result,
      };
      setRunId(savedRun.id);
      setRuns((prev) => [savedRun, ...prev.filter((run) => run.id !== savedRun.id)].slice(0, 10));
    } catch (err) {
      setError(err.message || 'Unable to complete worksheet run.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <p className="wizard-kicker">Analyst Program</p>
        <h1>{config.title}</h1>
        <p>Initial app port of {config.source}. Enter the source worksheet inputs, calculate, and save the run.</p>
      </header>

      <form className="wizard-card" onSubmit={calculateAndSave}>
        {config.collectionKey ? (
          <div className="table-wrap worksheet-grid-table">
            <table>
              <thead>
                <tr>
                  {config.rowFields.map(([, label]) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(inputs[config.collectionKey] || []).map((row, index) => (
                  <tr key={`${config.collectionKey}-${index + 1}`}>
                    {config.rowFields.map(([key, , type]) => (
                      <td key={key}>
                        <WorksheetInput
                          type={type === 'text' ? 'text' : 'number'}
                          value={row[key]}
                          onChange={(event) => updateRow(index, key, event.target.value)}
                          disabled={loading}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="wizard-fields">
            {config.scalarFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <WorksheetInput
                  type="number"
                  value={inputs[key]}
                  onChange={(event) => updateScalar(key, event.target.value)}
                  disabled={loading}
                />
              </label>
            ))}
          </div>
        )}

        <div className="actions">
          <button type="button" className="ghost" onClick={resetToNewRun} disabled={loading}>
            Reset
          </button>
          <button type="submit" disabled={loading || !canRun}>
            {loading ? 'Calculating...' : 'Calculate & Save'}
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </form>

      {result ? (
        <section className="wizard-results">
          <h2>Results</h2>
          <div className="wizard-kpis">
            {config.summaryFields.map(([key, label, type]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>{formatValue(result.summary?.[key], type)}</strong>
              </article>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {resultColumns(result).map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(result.rows || []).map((row, index) => (
                  <tr key={`result-${index + 1}`}>
                    {resultColumns(result).map((column) => (
                      <td key={column}>{formatValue(row[column], typeof row[column] === 'number' ? 'decimal' : 'text')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.warnings?.length ? <ul className="warnings">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
          {runId ? <p className="run-id">Saved run: {runId}</p> : null}
        </section>
      ) : null}

      <aside className="run-history">
        <h2>Recent Runs</h2>
        {runsLoading ? <p>Loading history...</p> : null}
        {!runsLoading && runs.length === 0 ? <p>No saved runs for this sheet yet.</p> : null}
        <div className="run-list">
          {runs.map((run) => (
            <button type="button" className="run-list-item" key={run.id} onClick={() => loadRun(run)}>
              <strong>{formatRunTimestamp(run.created_at)}</strong>
              <span>{config.title}</span>
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}
