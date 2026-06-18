'use client';

import WorksheetInput from '@/components/worksheet/WorksheetInput';
import { PL_LINE_CATEGORIES, rollupPLLineItems } from '@/lib/worksheets/plRollup';

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

export default function PLLineItemsEditor({ lineItems, onChange, yearLabel }) {
  const items = Array.isArray(lineItems) && lineItems.length > 0
    ? lineItems
    : [{ category: 'revenue', description: '', amount: '' }];

  const rollup = rollupPLLineItems(
    items.map((row) => ({
      category: row.category,
      amount: parseNumber(row.amount),
    })),
  );

  function updateLine(index, field, value) {
    const next = items.map((row, idx) => (idx === index ? { ...row, [field]: value } : row));
    onChange(next);
  }

  function addLine() {
    onChange([...items, { category: 'opex', description: '', amount: '' }]);
  }

  function removeLine(index) {
    if (items.length <= 1) return;
    onChange(items.filter((_, idx) => idx !== index));
  }

  return (
    <div className="pl-line-items-editor">
      {yearLabel ? <h3>{yearLabel} — Line Items</h3> : null}

      <div className="wizard-grid">
        {items.map((line, index) => (
          <div key={`pl-line-${index}`} className="wizard-grid-row">
            <label>
              Category
              <select value={line.category || 'revenue'} onChange={(e) => updateLine(index, 'category', e.target.value)}>
                {PL_LINE_CATEGORIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <WorksheetInput
              label="Description"
              value={line.description || ''}
              onChange={(e) => updateLine(index, 'description', e.target.value)}
            />
            <WorksheetInput
              label="Amount"
              type="number"
              min="0"
              value={line.amount ?? ''}
              onChange={(e) => updateLine(index, 'amount', e.target.value)}
            />
            <button type="button" className="ghost" onClick={() => removeLine(index)} disabled={items.length <= 1}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="wizard-actions">
        <button type="button" className="ghost" onClick={addLine}>
          Add line
        </button>
      </div>

      <div className="wizard-kpis">
        <article>
          <span>Revenue</span>
          <strong>{currency(rollup.revenue)}</strong>
        </article>
        <article>
          <span>COGS</span>
          <strong>{currency(rollup.cogs)}</strong>
        </article>
        <article>
          <span>OpEx</span>
          <strong>{currency(rollup.operatingExpenses)}</strong>
        </article>
        <article>
          <span>Other</span>
          <strong>{currency(rollup.otherExpenses)}</strong>
        </article>
      </div>
    </div>
  );
}
