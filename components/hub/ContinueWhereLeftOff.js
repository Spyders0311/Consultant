import Link from 'next/link';
import StatusDot from '@/components/hub/StatusDot';
import { pickContinueItems } from '@/lib/hub/continueItems';
import { isWorksheetHubNavigable } from '@/lib/worksheets/hubStatus';

/**
 * @param {{
 *   items: import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[],
 *   clientId: string,
 *   compact?: boolean,
 * }} props
 */
export default function ContinueWhereLeftOff({ items, clientId, compact = false }) {
  const continueItems = pickContinueItems(items);

  if (!continueItems.length) {
    if (compact) {
      return null;
    }

    return (
      <section className="hub-continue-row" aria-label="Continue where you left off">
        <h2 className="hub-section-title">Continue where you left off</h2>
        <p className="hub-empty-copy">
          No worksheets in progress yet.{' '}
          <Link href={`/workspace/${clientId}/analyst-wizard`}>Open the worksheet hub</Link> to get started.
        </p>
      </section>
    );
  }

  if (compact) {
    return (
      <section className="hub-continue" aria-label="Continue where you left off">
        <h3 className="hub-continue__title">Continue where you left off</h3>
        <ul className="hub-continue__list">
          {continueItems.map((item) => {
            const navigable = isWorksheetHubNavigable(item.status, item.integrationStatus);
            const body = (
              <>
                <StatusDot status={item.status} />
                <span className="hub-continue__name">{item.sheetName}</span>
                {typeof item.progressPercent === 'number' ? (
                  <span className="hub-continue__progress">{item.progressPercent}%</span>
                ) : null}
              </>
            );

            return (
              <li key={item.worksheetKey}>
                {navigable && item.href ? (
                  <Link href={item.href} className="hub-continue__link">
                    {body}
                  </Link>
                ) : (
                  <div className="hub-continue__link">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <section className="hub-continue-row" aria-label="Continue where you left off">
      <h2 className="hub-section-title">Continue where you left off</h2>
      <ul className="hub-continue-list">
        {continueItems.map((item) => {
          const navigable = isWorksheetHubNavigable(item.status, item.integrationStatus);
          const content = (
            <>
              <StatusDot status={item.status} />
              <div className="hub-continue-card__body">
                <p className="hub-continue-card__title">{item.sheetName}</p>
                <p className="hub-continue-card__meta">
                  {typeof item.progressPercent === 'number' ? `${item.progressPercent}% complete · ` : ''}
                  {item.coreRank ? `Core worksheet ${item.coreRank}` : item.description || 'Worksheet'}
                </p>
              </div>
            </>
          );

          return (
            <li key={item.worksheetKey}>
              {navigable && item.href ? (
                <Link href={item.href} className="hub-continue-card hub-continue-card--clickable">
                  {content}
                </Link>
              ) : (
                <article className="hub-continue-card">{content}</article>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
