'use client';

export default function WorksheetInput({
  isPrefilled = false,
  isTouched = false,
  isStale = false,
  className = '',
  ...props
}) {
  const prefilledClass = isPrefilled && !isTouched ? 'prefilled' : '';
  const staleClass = isStale ? 'stale-field' : '';
  const mergedClassName = `worksheet-input ${prefilledClass} ${staleClass} ${className}`.trim();

  return <input {...props} className={mergedClassName} />;
}
