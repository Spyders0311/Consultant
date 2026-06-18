/**
 * Optional progress ring for phase 2+ hub summaries.
 *
 * @param {{ percent?: number, label?: string, size?: number }} props
 */
export default function ProgressDonut({ percent = 0, label = 'Progress', size = 72 }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="hub-progress-donut" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${clamped}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="hub-progress-donut__track" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="hub-progress-donut__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="hub-progress-donut__label">{clamped}%</span>
    </div>
  );
}
