'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTION_LABELS = {
  analysis: 'Analysis',
  'analyst-wizard': 'Worksheets',
  marketing: 'Marketing',
  consulting: 'Consulting',
  'invoice-billing': 'Invoice / Billing',
  'bms-forms': 'BMS Forms',
};

/**
 * Clients > {Client} > {Section} > {Sheet} from the current pathname.
 * sheetNames maps worksheet keys to display names (computed server-side).
 */
export default function Breadcrumbs({ clientId, clientName, sheetNames = {} }) {
  const pathname = usePathname();
  const base = `/workspace/${clientId}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).split('/').filter(Boolean) : [];

  const crumbs = [
    { label: 'Clients', href: '/dashboard/clients' },
    { label: clientName || 'Client', href: `${base}/analysis` },
  ];

  const [section, ...tail] = rest;
  if (section && SECTION_LABELS[section]) {
    crumbs.push({ label: SECTION_LABELS[section], href: `${base}/${section}` });
  }

  if (section === 'analyst-wizard' && tail[0] === 'guided-intake') {
    crumbs.push({ label: 'Guided Intake', href: `${base}/analyst-wizard/guided-intake` });
  } else if (section === 'analyst-wizard' && tail[0] === 'sheets' && tail[1]) {
    const key = decodeURIComponent(tail[1]);
    crumbs.push({
      label: sheetNames[key] || key,
      href: `${base}/analyst-wizard/sheets/${tail[1]}`,
    });
  }

  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="crumb">
            {index > 0 && <span className="crumb-sep" aria-hidden="true">/</span>}
            {isLast ? (
              <span className="crumb-current" aria-current="page">{crumb.label}</span>
            ) : (
              <Link href={crumb.href}>{crumb.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
