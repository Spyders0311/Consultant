'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

const tabs = ['Marketing', 'Analysis', 'Analyst Wizard', 'Consulting', 'Invoice/Billing', 'BMS Forms'];

const capBudgDefaults = {
  initialInvestment: 50000,
  opportunityCost: 7484,
  lifetime: 10,
  salvageValue: 10000,
  depreciationMethod: 2,
  taxCreditRate: 0.1,
  otherInvestment: 0,
  workingCapitalInitial: 10000,
  workingCapitalPercent: 0.25,
  workingCapitalSalvageFraction: 1,
  revenueYear1: 40000,
  variableExpensePercent: 0.5,
  fixedExpenseYear1: 0,
  taxRate: 0.4,
  discountApproach: 2,
  discountRateDirect: 0.1,
  beta: 0.9,
  riskFreeRate: 0.08,
  marketRiskPremium: 0.055,
  debtRatio: 0.3,
  costOfBorrowing: 0.09,
  revenueGrowthRatesText: '0.1,0.1,0.1,0.1,0,0,0,0,0',
  fixedExpenseGrowthRatesText: '',
};

const fcfeDefaults = {
  currentEarnings: 5.45,
  capitalSpending: 2,
  depreciation: 1.7469204927,
  changeWorkingCapital: 0.6,
  debtRatio: 0.2997,
  offsetCapexByDep: 'No',
  recomputeReinvestment: 'Yes',
  roePerpetuity: 0.12,
  useDirectCostOfEquity: 'No',
  directCostOfEquity: 0.12,
  beta: 1.1,
  riskFreeRate: 0.07,
  riskPremium: 0.055,
  expectedGrowth: 0.06,
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function asPercent(v) {
  return `${(Number(v || 0) * 100).toFixed(2)}%`;
}

function asCurrency(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function Field({ label, value, onChange, type = 'number', step = 'any' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function PortalApp({ consultantName, consultantEmail, tenantId }) {
  const [activeTab, setActiveTab] = useState('Analysis');
  const [capForm, setCapForm] = useState(capBudgDefaults);
  const [fcfeForm, setFcfeForm] = useState(fcfeDefaults);
  const [capResult, setCapResult] = useState(null);
  const [fcfeResult, setFcfeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Ready');
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const kpis = useMemo(() => {
    if (!capResult) return null;
    return [
      { label: 'NPV', value: asCurrency(capResult.summary.npv) },
      { label: 'IRR', value: asPercent(capResult.summary.irr) },
      { label: 'ROC', value: asPercent(capResult.summary.roc) },
      { label: 'Discount Rate', value: asPercent(capResult.summary.discountRateUsed) },
    ];
  }, [capResult]);

  async function postJSON(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed');
    return data.result;
  }

  async function runCapBudg(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('Running capital budgeting model...');
    try {
      const revenueGrowthRates = capForm.revenueGrowthRatesText
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map(num);
      const fixedExpenseGrowthRates = capForm.fixedExpenseGrowthRatesText
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map(num);

      const payload = {
        ...Object.fromEntries(
          Object.entries(capForm)
            .filter(([k]) => !k.endsWith('Text'))
            .map(([k, v]) => [k, num(v)]),
        ),
        revenueGrowthRates,
        fixedExpenseGrowthRates,
      };

      const result = await postJSON('/api/calculate/capbudg', payload);
      setCapResult(result);
      setMessage('Capital budgeting calculation complete.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function runFcfe(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('Running FCFE stable growth model...');
    try {
      const payload = {
        ...fcfeForm,
        currentEarnings: num(fcfeForm.currentEarnings),
        capitalSpending: num(fcfeForm.capitalSpending),
        depreciation: num(fcfeForm.depreciation),
        changeWorkingCapital: num(fcfeForm.changeWorkingCapital),
        debtRatio: num(fcfeForm.debtRatio),
        roePerpetuity: num(fcfeForm.roePerpetuity),
        directCostOfEquity: num(fcfeForm.directCostOfEquity),
        beta: num(fcfeForm.beta),
        riskFreeRate: num(fcfeForm.riskFreeRate),
        riskPremium: num(fcfeForm.riskPremium),
        expectedGrowth: num(fcfeForm.expectedGrowth),
      };

      const result = await postJSON('/api/calculate/fcfe', payload);
      setFcfeResult(result);
      setMessage('FCFE calculation complete.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf(model, result) {
    setLoading(true);
    setMessage('Building PDF report...');
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, result }),
      });
      if (!res.ok) throw new Error('Unable to generate PDF');
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `bms-${model}-report.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      setMessage('PDF downloaded.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace('/login');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="portal-wrap">
      <section className="session-bar">
        <div>
          <p className="eyebrow">Consultant Dashboard</p>
          <p className="session-text">
            {consultantName} ({consultantEmail}) · Tenant: <strong>{tenantId}</strong>
          </p>
        </div>
        <button type="button" className="ghost" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </section>

      <section className="hero">
        <p className="eyebrow">BMS Intelligent Portal</p>
        <h1>Secure Decision Engine</h1>
        <p>Spreadsheet-grade valuation logic runs on the server. The browser only sends inputs and receives results.</p>
      </section>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <p className="status">{loading ? 'Working...' : message}</p>

      {activeTab === 'Marketing' && (
        <section className="panel">
          <h2>Marketing Command Center</h2>
          <div className="grid two">
            <div className="card">
              <h3>Campaign Snapshot</h3>
              <p>Track positioning, channels, and message performance with one branded source of truth.</p>
            </div>
            <div className="card">
              <h3>Launch Brief</h3>
              <textarea placeholder="Write campaign narrative, target customer, and distribution plan..." />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'Analysis' && (
        <section className="panel">
          <h2>Analysis Models</h2>
          <div className="grid two">
            <form className="card" onSubmit={runCapBudg}>
              <h3>Project Equity / Capital Budgeting</h3>
              <div className="form-grid">
                <Field label="Initial Investment" value={capForm.initialInvestment} onChange={(v) => setCapForm((s) => ({ ...s, initialInvestment: v }))} />
                <Field label="Opportunity Cost" value={capForm.opportunityCost} onChange={(v) => setCapForm((s) => ({ ...s, opportunityCost: v }))} />
                <Field label="Lifetime (years)" value={capForm.lifetime} onChange={(v) => setCapForm((s) => ({ ...s, lifetime: v }))} step="1" />
                <Field label="Salvage Value" value={capForm.salvageValue} onChange={(v) => setCapForm((s) => ({ ...s, salvageValue: v }))} />
                <Field label="Revenue Year 1" value={capForm.revenueYear1} onChange={(v) => setCapForm((s) => ({ ...s, revenueYear1: v }))} />
                <Field label="Variable Expense %" value={capForm.variableExpensePercent} onChange={(v) => setCapForm((s) => ({ ...s, variableExpensePercent: v }))} />
                <Field label="Tax Rate" value={capForm.taxRate} onChange={(v) => setCapForm((s) => ({ ...s, taxRate: v }))} />
                <Field label="Beta" value={capForm.beta} onChange={(v) => setCapForm((s) => ({ ...s, beta: v }))} />
                <Field label="Risk-free Rate" value={capForm.riskFreeRate} onChange={(v) => setCapForm((s) => ({ ...s, riskFreeRate: v }))} />
                <Field label="Market Risk Premium" value={capForm.marketRiskPremium} onChange={(v) => setCapForm((s) => ({ ...s, marketRiskPremium: v }))} />
                <Field label="Debt Ratio" value={capForm.debtRatio} onChange={(v) => setCapForm((s) => ({ ...s, debtRatio: v }))} />
                <Field label="Cost of Borrowing" value={capForm.costOfBorrowing} onChange={(v) => setCapForm((s) => ({ ...s, costOfBorrowing: v }))} />
              </div>

              <label className="field">
                <span>Revenue Growth Rates (comma-separated from Year 2 onward)</span>
                <input
                  type="text"
                  value={capForm.revenueGrowthRatesText}
                  onChange={(e) => setCapForm((s) => ({ ...s, revenueGrowthRatesText: e.target.value }))}
                />
              </label>

              <label className="field">
                <span>Fixed Expense Growth Rates (optional, comma-separated)</span>
                <input
                  type="text"
                  value={capForm.fixedExpenseGrowthRatesText}
                  onChange={(e) => setCapForm((s) => ({ ...s, fixedExpenseGrowthRatesText: e.target.value }))}
                />
              </label>

              <div className="actions">
                <button type="submit" disabled={loading}>Run Model</button>
                <button type="button" className="ghost" onClick={() => capResult && downloadPdf('capbudg', capResult)} disabled={!capResult || loading}>
                  Export PDF
                </button>
              </div>
            </form>

            <div className="card result">
              <h3>Capital Budgeting Output</h3>
              {!capResult && <p>Run the model to see results.</p>}
              {capResult && (
                <>
                  <div className="kpi-row">
                    {kpis?.map((kpi) => (
                      <article key={kpi.label}>
                        <span>{kpi.label}</span>
                        <strong>{kpi.value}</strong>
                      </article>
                    ))}
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Year</th>
                          <th>Revenue</th>
                          <th>NATCF</th>
                          <th>Discounted CF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {capResult.annual.slice(0, 10).map((row) => (
                          <tr key={row.year}>
                            <td>{row.year}</td>
                            <td>{asCurrency(row.revenue)}</td>
                            <td>{asCurrency(row.natcf)}</td>
                            <td>{asCurrency(row.discountedCashFlow)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid two">
            <form className="card" onSubmit={runFcfe}>
              <h3>FCFE Stable Growth</h3>
              <div className="form-grid">
                <Field label="Current Earnings/share" value={fcfeForm.currentEarnings} onChange={(v) => setFcfeForm((s) => ({ ...s, currentEarnings: v }))} />
                <Field label="Capital Spending/share" value={fcfeForm.capitalSpending} onChange={(v) => setFcfeForm((s) => ({ ...s, capitalSpending: v }))} />
                <Field label="Depreciation/share" value={fcfeForm.depreciation} onChange={(v) => setFcfeForm((s) => ({ ...s, depreciation: v }))} />
                <Field label="Working Capital/share" value={fcfeForm.changeWorkingCapital} onChange={(v) => setFcfeForm((s) => ({ ...s, changeWorkingCapital: v }))} />
                <Field label="Debt Ratio" value={fcfeForm.debtRatio} onChange={(v) => setFcfeForm((s) => ({ ...s, debtRatio: v }))} />
                <Field label="ROE (perpetuity)" value={fcfeForm.roePerpetuity} onChange={(v) => setFcfeForm((s) => ({ ...s, roePerpetuity: v }))} />
                <Field label="Beta" value={fcfeForm.beta} onChange={(v) => setFcfeForm((s) => ({ ...s, beta: v }))} />
                <Field label="Risk-free Rate" value={fcfeForm.riskFreeRate} onChange={(v) => setFcfeForm((s) => ({ ...s, riskFreeRate: v }))} />
                <Field label="Risk Premium" value={fcfeForm.riskPremium} onChange={(v) => setFcfeForm((s) => ({ ...s, riskPremium: v }))} />
                <Field label="Expected Growth" value={fcfeForm.expectedGrowth} onChange={(v) => setFcfeForm((s) => ({ ...s, expectedGrowth: v }))} />
              </div>

              <div className="choice-grid">
                <label>
                  Offset CapEx by Depreciation?
                  <select value={fcfeForm.offsetCapexByDep} onChange={(e) => setFcfeForm((s) => ({ ...s, offsetCapexByDep: e.target.value }))}>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </label>
                <label>
                  Recompute Reinvestment?
                  <select value={fcfeForm.recomputeReinvestment} onChange={(e) => setFcfeForm((s) => ({ ...s, recomputeReinvestment: e.target.value }))}>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
                <label>
                  Enter Direct Cost of Equity?
                  <select value={fcfeForm.useDirectCostOfEquity} onChange={(e) => setFcfeForm((s) => ({ ...s, useDirectCostOfEquity: e.target.value }))}>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </label>
                <Field label="Direct Cost of Equity" value={fcfeForm.directCostOfEquity} onChange={(v) => setFcfeForm((s) => ({ ...s, directCostOfEquity: v }))} />
              </div>

              <div className="actions">
                <button type="submit" disabled={loading}>Run Model</button>
                <button type="button" className="ghost" onClick={() => fcfeResult && downloadPdf('fcfe', fcfeResult)} disabled={!fcfeResult || loading}>
                  Export PDF
                </button>
              </div>
            </form>

            <div className="card result">
              <h3>FCFE Output</h3>
              {!fcfeResult && <p>Run the model to see results.</p>}
              {fcfeResult && (
                <>
                  <div className="kpi-row">
                    <article><span>FCFE</span><strong>{asCurrency(fcfeResult.summary.fcfe)}</strong></article>
                    <article><span>Cost of Equity</span><strong>{asPercent(fcfeResult.summary.costOfEquity)}</strong></article>
                    <article><span>Expected Growth</span><strong>{asPercent(fcfeResult.summary.expectedGrowth)}</strong></article>
                    <article><span>Intrinsic Value</span><strong>{asCurrency(fcfeResult.summary.intrinsicValue)}</strong></article>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Growth</th><th>Value</th></tr>
                      </thead>
                      <tbody>
                        {fcfeResult.sensitivity.map((s) => (
                          <tr key={s.growth}>
                            <td>{asPercent(s.growth)}</td>
                            <td>{s.value == null ? 'n/a' : asCurrency(s.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!!fcfeResult.warnings.length && (
                    <ul className="warnings">
                      {fcfeResult.warnings.map((w) => <li key={w}>{w}</li>)}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'Analyst Wizard' && (
        <section className="panel">
          <h2>Analyst Wizard</h2>
          <div className="grid two">
            <div className="card">
              <h3>TurboTax-Style Guided Flow</h3>
              <p>Walk analysts through company info, revenue/COGS, fixed expenses, and market assumptions.</p>
              <p>
                The guided route posts to the Python calculation engine and returns projected output with workbook
                provenance.
              </p>
            </div>
            <div className="card">
              <h3>Launch Wizard</h3>
              <p>Open the dedicated wizard experience for a clean, step-by-step intake process.</p>
              <div className="actions">
                <Link href="/analyst-wizard" className="tab active">
                  Open Analyst Wizard
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'Consulting' && (
        <section className="panel">
          <h2>Consulting Workspace</h2>
          <div className="grid two">
            <div className="card">
              <h3>Engagement Notes</h3>
              <textarea placeholder="Capture client decisions, assumptions, and next actions..." />
            </div>
            <div className="card">
              <h3>Decision Log</h3>
              <textarea placeholder="Track pricing, scope, and strategic tradeoffs..." />
              <div className="actions">
                <Link href="/dashboard/clients" className="tab">
                  View Clients
                </Link>
                <Link href="/dashboard/clients/new" className="tab active">
                  Create New Client
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'Invoice/Billing' && (
        <section className="panel">
          <h2>Invoice & Billing</h2>
          <div className="grid two">
            <div className="card">
              <h3>Billing Snapshot</h3>
              <p>Connect model outputs to invoice narrative and client-ready value summary.</p>
            </div>
            <div className="card">
              <h3>Invoice Notes</h3>
              <textarea placeholder="Add billing line items and payment terms..." />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'BMS Forms' && (
        <section className="panel">
          <h2>BMS Forms</h2>
          <div className="grid two">
            <div className="card">
              <h3>Internal Intake</h3>
              <textarea placeholder="Capture business context, constraints, and assumptions..." />
            </div>
            <div className="card">
              <h3>Client Submission</h3>
              <textarea placeholder="Draft polished client-facing summary for approval..." />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
