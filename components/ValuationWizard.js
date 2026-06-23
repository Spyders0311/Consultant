'use client';

import { useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import { VALUATION_CONFIGS } from '@/lib/worksheets/valuationConfigs';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';

function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

export default function ValuationWizard({ clientId, sheetKey, clientRow = null }) {
  const config = VALUATION_CONFIGS[sheetKey];
  const [form, setForm] = useState({
    annualRevenue: clientRow?.current_annual_revenue || '',
    ebitda: '',
    ebitdaMultiple: config.defaultMultiple,
    assetAdjustment: '',
    improvementPremiumPct: config.defaultPremiumPct || '',
    totalDebt: '',
    cash: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useWorksheetShellForm(useMemo(() => form, [form]));

  async function calculate() {
    setLoading(true);
    setError('');
    try {
      const payload = {
        scenario: config.scenario,
        annualRevenue: Number(form.annualRevenue || 0),
        ebitda: Number(form.ebitda || 0),
        ebitdaMultiple: Number(form.ebitdaMultiple || config.defaultMultiple),
        assetAdjustment: Number(form.assetAdjustment || 0),
        improvementPremiumPct: form.improvementPremiumPct ? Number(form.improvementPremiumPct) : null,
        totalDebt: Number(form.totalDebt || 0),
        cash: Number(form.cash || 0),
      };
      const response = await fetch('/api/worksheets/valuation/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Valuation failed.');
      setResult(data.result);

      if (clientId) {
        await fetch('/api/worksheets/valuation/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, scenario: config.scenario, inputs: payload, outputs: data.result }),
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to calculate valuation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <h1>{config.title}</h1>
      </header>
      {[
        { name: 'annualRevenue', label: 'Annual Revenue', type: 'number' },
        { name: 'ebitda', label: 'EBITDA (optional)', type: 'number' },
        { name: 'ebitdaMultiple', label: 'EBITDA Multiple', type: 'number' },
        { name: 'assetAdjustment', label: 'Asset Adjustment', type: 'number' },
        { name: 'improvementPremiumPct', label: 'Improvement Premium %', type: 'number' },
        { name: 'totalDebt', label: 'Total Debt', type: 'number' },
        { name: 'cash', label: 'Cash', type: 'number' },
      ].map((field) => (
        <label key={field.name} className="wizard-field">
          <span>{field.label}</span>
          <WorksheetInput
            type={field.type}
            value={form[field.name]}
            onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
          />
        </label>
      ))}
      <button type="button" disabled={loading} onClick={calculate}>
        {loading ? 'Calculating...' : 'Calculate Valuation'}
      </button>
      {error ? <p className="wizard-error">{error}</p> : null}
      {result ? (
        <div className="wizard-kpis">
          <article>
            <span>Enterprise Value</span>
            <strong>{currency(result.enterpriseValue)}</strong>
          </article>
          <article>
            <span>Equity Value</span>
            <strong>{currency(result.equityValue)}</strong>
          </article>
        </div>
      ) : null}
    </section>
  );
}
