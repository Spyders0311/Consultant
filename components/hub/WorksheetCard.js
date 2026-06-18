import Link from 'next/link';

import StatusDot from '@/components/hub/StatusDot';

import { isWorksheetHubNavigable } from '@/lib/worksheets/hubStatus';

const PLANNED_TOOLTIP = 'Not yet in app';

/**
 * @param {{ entry: import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry, alternativeHref?: string|null }} props
 */
export default function WorksheetCard({ entry, alternativeHref = null }) {
  const navigable = isWorksheetHubNavigable(entry.status, entry.integrationStatus);
  const isPlanned = entry.integrationStatus === 'planned' || entry.status === 'planned';
  const showProgress = typeof entry.progressPercent === 'number' && entry.status !== 'complete';

  const body = (
    <>
      <div className="hub-worksheet-card__header">
        <StatusDot status={entry.status} />
        <div className="hub-worksheet-card__meta">
          {showProgress ? <span className="hub-worksheet-card__progress">{entry.progressPercent}%</span> : null}
          {entry.coreRank ? <span className="hub-worksheet-card__rank">Core {entry.coreRank}</span> : null}
        </div>
      </div>
      <h3 className="hub-worksheet-card__title">{entry.sheetName}</h3>
      <p className="hub-worksheet-card__subtitle">{entry.description || 'Worksheet'}</p>
      {isPlanned ? <p className="hub-worksheet-card__planned-note">Not yet in app</p> : null}
      {isPlanned && alternativeHref ? (
        <p className="hub-worksheet-card__alt">
          <Link href={alternativeHref}>View nearest live worksheet</Link>
        </p>
      ) : null}
    </>
  );

  if (navigable && entry.href) {
    return (
      <Link href={entry.href} className="hub-worksheet-card hub-worksheet-card--clickable">
        {body}
      </Link>
    );
  }

  return (
    <article
      className={`hub-worksheet-card hub-worksheet-card--static${isPlanned ? ' hub-worksheet-card--planned' : ''}`}
      title={isPlanned ? PLANNED_TOOLTIP : undefined}
      aria-label={isPlanned ? `${entry.sheetName}. ${PLANNED_TOOLTIP}` : undefined}
    >
      {body}
    </article>
  );
}
