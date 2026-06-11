'use client';

import WorksheetInput from '@/components/worksheet/WorksheetInput';

export function InputControl({ field, value, onChange, disabled, isPrefilled, isTouched }) {
  if (field.type === 'select') {
    return (
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {(field.options || []).map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        rows={field.rows || 4}
      />
    );
  }

  return (
    <WorksheetInput
      type={field.type || 'text'}
      min={field.min}
      max={field.max}
      step={field.step}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      isPrefilled={isPrefilled}
      isTouched={isTouched}
    />
  );
}

/**
 * Renders named scalar fields from a wizard config into the two-column grid.
 * fieldNames picks (and orders) entries from config.fields.
 */
export default function FieldGrid({ fields, fieldNames, form, onChange, disabled, prefilledFields, touchedFields }) {
  return (
    <div className="wizard-fields">
      {fieldNames.map((name) => {
        const field = fields[name];
        if (!field) return null;
        return (
          <label key={name} style={field.fullWidth ? { gridColumn: '1 / -1' } : undefined}>
            {field.label}
            <InputControl
              field={field}
              value={form[name]}
              onChange={(value) => onChange(name, value)}
              disabled={disabled}
              isPrefilled={Boolean(prefilledFields?.[name])}
              isTouched={Boolean(touchedFields?.[name])}
            />
          </label>
        );
      })}
    </div>
  );
}
