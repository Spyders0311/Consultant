'use client';

import { useMemo, useState } from 'react';

const steps = [
  { id: 'company', title: 'Company Info', hint: 'Basic profile details for report context.' },
  { id: 'revenue', title: 'Revenue & COGS', hint: 'Top-line assumptions and cost of goods sold.' },
  { id: 'fixed', title: 'Fixed Expenses', hint: 'Recurring operating costs to carry each year.' },
  { id: 'market', title: 'Market Assumptions', hint: 'Macroeconomic and risk assumptions.' },
];

const defaultForm = {
  companyName: '',
  industry: '',
  horizonYears: 5,
  currentAnnualRevenue: 2500000,
  cogsPercent: 52,
  revenueGrowthPercent: 9,
  fixedPayroll: 420000,
  fixedRentUtilities: 95000,
  fixedOther: 130000,
  fixedExpenseGrowthPercent: 3,
  marketGrowthPercent: 4,
  targetMarketSharePercent: 2.5,
  inflationPercent: 2.5,
  taxRatePercent: 25,
  discountRatePercent: 12,
};

function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function AnalystWizard() {
  const [form, setForm] = useState(defaultForm);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pdfError, setPdfError] = useState('');

  const progress = ((stepIndex + 1) / steps.length) * 100;

  const canAdvance = useMemo(() => {
    if (stepIndex === 0) return form.companyName.trim().length > 0 && form.industry.trim().length > 0;
    if (stepIndex === 1) return parseNumber(form.currentAnnualRevenue) > 0;
    if (stepIndex === 2) return parseNumber(form.fixedPayroll) >= 0;
    return parseNumber(form.discountRatePercent) > 0;
  }, [form, stepIndex]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitWizard(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        companyName: form.companyName.trim(),
        industry: form.industry.trim(),
        horizonYears: parseNumber(form.horizonYears),
        revenue: {
          currentAnnualRevenue: parseNumber(form.currentAnnualRevenue),
          cogsPercent: parseNumber(form.cogsPercent),
          revenueGrowthPercent: parseNumber(form.revenueGrowthPercent),
        },
        fixedExpenses: {
          payroll: parseNumber(form.fixedPayroll),
          rentUtilities: parseNumber(form.fixedRentUtilities),
          other: parseNumber(form.fixedOther),
          fixedExpenseGrowthPercent: parseNumber(form.fixedExpenseGrowthPercent),
        },
        marketAssumptions: {
          marketGrowthPercent: parseNumber(form.marketGrowthPercent),
          targetMarketSharePercent: parseNumber(form.targetMarketSharePercent),
          inflationPercent: parseNumber(form.inflationPercent),
          taxRatePercent: parseNumber(form.taxRatePercent),
          discountRatePercent: parseNumber(form.discountRatePercent),
        },
      };

      const response = await fetch('/api/analyst-wizard/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Calculation request failed.');
      setResult(data.result);
    } catch (err) {
      setError(err.message);
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
        body: JSON.stringify({ model: 'analyst-wizard', result }),
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
      link.download = 'bms-analyst-wizard-report.pdf';
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
        <p className="wizard-kicker">Analyst Wizard</p>
        <h1>Guided Financial Intake</h1>
        <p>
          Analyst worksheet. Answer one section at a time. The backend handles the protected math logic and sends back
          projections.
        </p>
      </header>

      <div className="wizard-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className="wizard-step-list">
        {steps.map((step, idx) => {
          const isCurrent = idx === stepIndex;
          const isCompleted = idx < stepIndex;
          const canJumpForward = idx > stepIndex ? canAdvance : true;

          return (
            <li key={step.id}>
              <button
                type="button"
                className={`wizard-step-button ${isCurrent ? 'active' : ''} ${isCompleted ? 'complete' : ''}`}
                onClick={() => setStepIndex(idx)}
                disabled={loading || !canJumpForward}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <strong>{step.title}</strong>
                <span>{step.hint}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <form className="wizard-card" onSubmit={submitWizard}>
        {stepIndex === 0 && (
          <div className="wizard-fields">
            <label>
              Company Name
              <input value={form.companyName} onChange={(e) => updateField('companyName', e.target.value)} />
            </label>
            <label>
              Industry
              <input value={form.industry} onChange={(e) => updateField('industry', e.target.value)} />
            </label>
            <label>
              Forecast Horizon (Years)
              <input
                type="number"
                min="3"
                max="10"
                value={form.horizonYears}
                onChange={(e) => updateField('horizonYears', e.target.value)}
              />
            </label>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="wizard-fields">
            <label>
              Current Annual Revenue
              <input
                type="number"
                min="0"
                value={form.currentAnnualRevenue}
                onChange={(e) => updateField('currentAnnualRevenue', e.target.value)}
              />
            </label>
            <label>
              COGS (% of Revenue)
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.cogsPercent}
                onChange={(e) => updateField('cogsPercent', e.target.value)}
              />
            </label>
            <label>
              Internal Revenue Growth (%)
              <input
                type="number"
                min="-50"
                max="100"
                step="0.1"
                value={form.revenueGrowthPercent}
                onChange={(e) => updateField('revenueGrowthPercent', e.target.value)}
              />
            </label>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="wizard-fields">
            <label>
              Annual Payroll
              <input
                type="number"
                min="0"
                value={form.fixedPayroll}
                onChange={(e) => updateField('fixedPayroll', e.target.value)}
              />
            </label>
            <label>
              Annual Rent + Utilities
              <input
                type="number"
                min="0"
                value={form.fixedRentUtilities}
                onChange={(e) => updateField('fixedRentUtilities', e.target.value)}
              />
            </label>
            <label>
              Other Fixed Operating Costs
              <input
                type="number"
                min="0"
                value={form.fixedOther}
                onChange={(e) => updateField('fixedOther', e.target.value)}
              />
            </label>
            <label>
              Fixed Expense Growth (%)
              <input
                type="number"
                min="-20"
                max="30"
                step="0.1"
                value={form.fixedExpenseGrowthPercent}
                onChange={(e) => updateField('fixedExpenseGrowthPercent', e.target.value)}
              />
            </label>
          </div>
        )}

        {stepIndex === 3 && (
          <div className="wizard-fields">
            <label>
              Market Growth (%)
              <input
                type="number"
                min="-20"
                max="40"
                step="0.1"
                value={form.marketGrowthPercent}
                onChange={(e) => updateField('marketGrowthPercent', e.target.value)}
              />
            </label>
            <label>
              Target Market Share Improvement (%)
              <input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={form.targetMarketSharePercent}
                onChange={(e) => updateField('targetMarketSharePercent', e.target.value)}
              />
            </label>
            <label>
              Inflation (%)
              <input
                type="number"
                min="-5"
                max="20"
                step="0.1"
                value={form.inflationPercent}
                onChange={(e) => updateField('inflationPercent', e.target.value)}
              />
            </label>
            <label>
              Effective Tax Rate (%)
              <input
                type="number"
                min="0"
                max="60"
                step="0.1"
                value={form.taxRatePercent}
                onChange={(e) => updateField('taxRatePercent', e.target.value)}
              />
            </label>
            <label>
              Discount Rate (%)
              <input
                type="number"
                min="1"
                max="40"
                step="0.1"
                value={form.discountRatePercent}
                onChange={(e) => updateField('discountRatePercent', e.target.value)}
              />
            </label>
          </div>
        )}

        <div className="wizard-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={stepIndex === 0 || loading}
          >
            Back
          </button>

          {stepIndex < steps.length - 1 ? (
            <button type="button" onClick={() => setStepIndex((prev) => prev + 1)} disabled={!canAdvance || loading}>
              Continue
            </button>
          ) : (
            <button type="submit" disabled={loading}>
              {loading ? 'Calculating...' : 'Run Secure Calculation'}
            </button>
          )}
        </div>

        {error ? <p className="wizard-error">{error}</p> : null}
      </form>

      {result ? (
        <section className="wizard-result">
          <div className="wizard-actions">
            <button type="button" onClick={downloadPdf} disabled={pdfLoading}>
              {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
          {pdfError ? <p className="wizard-error">{pdfError}</p> : null}

          <div className="wizard-kpis">
            <article>
              <span>Enterprise Value (NPV)</span>
              <strong>{currency(result.summary.enterpriseValueNpv)}</strong>
            </article>
            <article>
              <span>Year 1 EBITDA Margin</span>
              <strong>{percent(result.summary.yearOneEbitdaMarginPercent)}</strong>
            </article>
            <article>
              <span>Cumulative Free Cash Flow</span>
              <strong>{currency(result.summary.cumulativeFreeCashFlow)}</strong>
            </article>
            <article>
              <span>Blended Growth Rate</span>
              <strong>{percent(result.summary.blendedGrowthRatePercent)}</strong>
            </article>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>Gross Profit</th>
                  <th>EBITDA</th>
                  <th>Free Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {result.projections.map((row) => (
                  <tr key={row.year}>
                    <td>{row.year}</td>
                    <td>{currency(row.revenue)}</td>
                    <td>{currency(row.grossProfit)}</td>
                    <td>{currency(row.ebitda)}</td>
                    <td>{currency(row.freeCashFlow)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="wizard-meta">
            Engine: {result.engineVersion} | Workbook fingerprint: {result.workbook.sha256.slice(0, 12)}...
          </p>
        </section>
      ) : null}
    </section>
  );
}
