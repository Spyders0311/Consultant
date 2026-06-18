import Link from 'next/link';
import { Fragment } from 'react';

/**
 * @typedef {{ label: string, href?: string }} BreadcrumbSegment
 */

/**
 * @param {{ clientId: string, clientName: string, trail?: BreadcrumbSegment[] }} props
 */
export default function WorkspaceBreadcrumbs({ clientId, clientName, trail = [] }) {
  const overviewHref = `/workspace/${clientId}/overview`;
  const hasTrail = trail.length > 0;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="workspace-breadcrumbs">
        <li>
          <Link href="/dashboard/clients">Clients</Link>
        </li>
        <li className="workspace-breadcrumbs__sep" aria-hidden="true">
          /
        </li>
        <li aria-current={hasTrail ? undefined : 'page'}>
          {hasTrail ? <Link href={overviewHref}>{clientName}</Link> : clientName}
        </li>
        {trail.map((segment, index) => {
          const isLast = index === trail.length - 1;
          const showLink = Boolean(segment.href) && !isLast;

          return (
            <Fragment key={`${segment.label}-${index}`}>
              <li className="workspace-breadcrumbs__sep" aria-hidden="true">
                /
              </li>
              <li aria-current={isLast ? 'page' : undefined}>
                {showLink ? <Link href={segment.href}>{segment.label}</Link> : segment.label}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
