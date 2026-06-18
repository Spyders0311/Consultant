/**
 * Status indicator for worksheet hub cards and lists.
 *
 * @param {{ status: import('@/lib/worksheets/hubStatus').WorksheetHubLifecycleStatus, label?: string, className?: string }} props
 */
export default function StatusDot({ status, label, className = '' }) {
  const statusLabel =
    label ||
    {
      complete: 'Complete',
      in_progress: 'In progress',
      not_started: 'Not started',
      planned: 'Planned',
    }[status] ||
    status;

  return (
    <span className={`hub-status-dot hub-status-dot--${status} ${className}`.trim()} title={statusLabel}>
      <span className="hub-status-dot__glyph" aria-hidden="true" />
      <span className="hub-status-dot__label">{statusLabel}</span>
    </span>
  );
}
