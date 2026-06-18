/**
 * KPI strip tile for workspace hub summary rows.
 *
 * @param {{ label: string, value: string|number, hint?: string, trend?: 'up'|'down'|'flat', className?: string }} props
 */
export default function KpiCard({ label, value, hint, trend, className = '' }) {
  return (
    <article className={`hub-kpi-card ${className}`.trim()}>
      <p className="hub-kpi-card__label">{label}</p>
      <p className="hub-kpi-card__value">
        {value}
        {trend ? <span className={`hub-kpi-card__trend hub-kpi-card__trend--${trend}`} aria-hidden="true" /> : null}
      </p>
      {hint ? <p className="hub-kpi-card__hint">{hint}</p> : null}
    </article>
  );
}
