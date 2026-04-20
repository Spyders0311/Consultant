'use client';

export default function WorksheetInput({ isPrefilled = false, isTouched = false, className = '', ...props }) {
  const prefilledClass = isPrefilled && !isTouched ? 'prefilled' : '';
  const mergedClassName = `worksheet-input ${prefilledClass} ${className}`.trim();

  return <input {...props} className={mergedClassName} />;
}
