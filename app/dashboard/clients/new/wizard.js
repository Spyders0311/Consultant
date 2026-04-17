'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { clientGlobalFields, clientWizardDefaults, normalizeClientPayload } from '@/lib/clients/globalColumns';

const wizardSteps = [
  {
    id: 'company',
    title: 'Company Profile',
    hint: 'Anchor the engagement with core client identity details.',
    fields: ['company_name', 'industry', 'horizon_years'],
  },
  {
    id: 'revenue',
    title: 'Revenue Baseline',
    hint: 'Capture top-line and COGS assumptions.',
    fields: ['current_annual_revenue', 'cogs_percent', 'revenue_growth_percent'],
  },
  {
    id: 'fixed',
    title: 'Operating Cost Base',
    hint: 'Enter recurring fixed expenses and growth behavior.',
    fields: ['fixed_payroll', 'fixed_rent_utilities', 'fixed_other', 'fixed_expense_growth_percent'],
  },
  {
    id: 'market',
    title: 'Market & Risk',
    hint: 'Define macro, tax, and discount assumptions.',
    fields: [
      'market_growth_percent',
      'target_market_share_percent',
      'inflation_percent',
      'tax_rate_percent',
      'discount_rate_percent',
    ],
  },
  {
    id: 'review',
    title: 'Review & Save',
    hint: 'Confirm values before writing to Supabase.',
    fields: [],
  },
];

const fieldLookup = new Map(clientGlobalFields.map((field) => [field.key, field]));

function formatReviewValue(field, value) {
  if (field.type !== 'number') return String(value || '');
  const num = Number(value || 0);
  if (field.key.includes('percent')) return `${num.toFixed(2)}%`;
  if (field.key.includes('revenue') || field.key.includes('fixed_')) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  }
  return String(num);
}

function getStepError(stepIndex, form) {
  const step = wizardSteps[stepIndex];
  if (!step || step.id === 'review') return '';

  try {
    const narrowPayload = Object.fromEntries(step.fields.map((key) => [key, form[key]]));
    normalizeClientPayload(narrowPayload, { partial: true });
    return '';
  } catch (error) {
    return error.message || 'Please complete all required fields.';
  }
}

export default function NewClientWizard() {
  const [form, setForm] = useState(clientWizardDefaults);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedClientId, setSavedClientId] = useState('');

  const step = wizardSteps[stepIndex];
  const progress = ((stepIndex + 1) / wizardSteps.length) * 100;
  const stepError = useMemo(() => getStepError(stepIndex, form), [stepIndex, form]);

  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
  }

  function goBack() {
    setStepIndex((previous) => Math.max(0, previous - 1));
    setError('');
  }

  function goNext() {
    if (stepError) {
      setError(stepError);
      return;
    }
    setStepIndex((previous) => Math.min(wizardSteps.length - 1, previous + 1));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSavedClientId('');

    let payload;
    try {
      payload = normalizeClientPayload(form);
    } catch (validationError) {
      setError(validationError.message || 'Please review the form values.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Unable to create client.');
      }

      setSavedClientId(result.client?.id || '');
      setForm(clientWizardDefaults);
      setStepIndex(0);
    } catch (submitError) {
      setError(submitError.message || 'Unable to create client.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="client-wizard-shell">
      <div className="client-wizard-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className="client-wizard-steps">
        {wizardSteps.map((entry, index) => (
          <li key={entry.id} className={index <= stepIndex ? 'current' : ''}>
            <strong>{entry.title}</strong>
            <span>{entry.hint}</span>
          </li>
        ))}
      </ol>

      <form className="client-wizard-card" onSubmit={submit}>
        <header>
          <p className="wizard-kicker">Step {stepIndex + 1} of {wizardSteps.length}</p>
          <h2>{step.title}</h2>
          <p>{step.hint}</p>
        </header>

        {step.id !== 'review' ? (
          <div className="wizard-fields">
            {step.fields.map((fieldKey) => {
              const field = fieldLookup.get(fieldKey);
              if (!field) return null;
              return (
                <label key={field.key}>
                  {field.label}
                  <input
                    type={field.type}
                    min={field.min}
                    max={field.max}
                    step={field.step || (field.type === 'number' ? 'any' : undefined)}
                    value={form[field.key]}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    required={field.required}
                  />
                </label>
              );
            })}
          </div>
        ) : (
          <div className="client-review-grid">
            {clientGlobalFields.map((field) => (
              <article key={field.key}>
                <span>{field.label}</span>
                <strong>{formatReviewValue(field, form[field.key])}</strong>
              </article>
            ))}
          </div>
        )}

        <div className="wizard-actions">
          <button type="button" className="ghost" onClick={goBack} disabled={stepIndex === 0 || isSaving}>
            Back
          </button>
          {step.id !== 'review' ? (
            <button type="button" onClick={goNext} disabled={isSaving}>
              Continue
            </button>
          ) : (
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Create Client'}
            </button>
          )}
        </div>

        {error ? <p className="wizard-error">{error}</p> : null}
        {savedClientId ? (
          <p className="wizard-success">
            Client created. ID: <code>{savedClientId}</code>
          </p>
        ) : null}
      </form>

      <div className="client-wizard-footer">
        <Link href="/" className="tab">
          Return to Dashboard
        </Link>
      </div>
    </section>
  );
}
