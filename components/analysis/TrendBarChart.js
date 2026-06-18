/**
 * Simple horizontal bar chart for revenue / net income trends (no chart library).
 *
 * @param {{
 *   title: string,
 *   rows: Array<{ label: string, primary: number, secondary?: number|null }>,
 *   primaryLabel?: string,
 *   secondaryLabel?: string,
 * }} props
 */
export default function TrendBarChart({
  title,
  rows,
  primaryLabel = 'Revenue',
  secondaryLabel = 'Net income',
}) {
  if (!rows.length) {
    return null;
  }

  const maxValue = Math.max(
    ...rows.flatMap((row) => [Math.abs(row.primary), Math.abs(row.secondary || 0)]),
    1,
  );

  return (
    <section className="analysis-trend-chart" aria-label={title}>
      <h3 className="hub-section-title">{title}</h3>
      <div className="analysis-trend-chart__legend">
        <span className="analysis-trend-chart__swatch analysis-trend-chart__swatch--primary">{primaryLabel}</span>
        {rows.some((row) => row.secondary != null) ? (
          <span className="analysis-trend-chart__swatch analysis-trend-chart__swatch--secondary">{secondaryLabel}</span>
        ) : null}
      </div>
      <div className="analysis-trend-chart__rows">
        {rows.map((row) => (
          <div key={row.label} className="analysis-trend-chart__row">
            <span className="analysis-trend-chart__year">{row.label}</span>
            <div className="analysis-trend-chart__bars">
              <div className="analysis-trend-chart__bar-wrap">
                <div
                  className="analysis-trend-chart__bar analysis-trend-chart__bar--primary"
                  style={{ width: `${(Math.abs(row.primary) / maxValue) * 100}%` }}
                  title={`${primaryLabel}: ${row.primary}`}
                />
              </div>
              {row.secondary != null ? (
                <div className="analysis-trend-chart__bar-wrap">
                  <div
                    className={`analysis-trend-chart__bar analysis-trend-chart__bar--secondary${row.secondary < 0 ? ' analysis-trend-chart__bar--negative' : ''}`}
                    style={{ width: `${(Math.abs(row.secondary) / maxValue) * 100}%` }}
                    title={`${secondaryLabel}: ${row.secondary}`}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
