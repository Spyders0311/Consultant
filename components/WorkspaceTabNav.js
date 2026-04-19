'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { key: 'marketing', label: 'Marketing' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'analyst-wizard', label: 'Analyst Wizard' },
  { key: 'consulting', label: 'Consulting' },
  { key: 'invoice-billing', label: 'Invoice/Billing' },
  { key: 'bms-forms', label: 'BMS Forms' },
];

export default function WorkspaceTabNav({ clientId }) {
  const pathname = usePathname();

  return (
    <nav className="tab-nav workspace-tabs" aria-label="Workspace sections">
      {tabs.map((tab) => {
        const href = `/workspace/${clientId}/${tab.key}`;
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link key={tab.key} href={href} className={isActive ? 'tab active' : 'tab'} aria-current={isActive ? 'page' : undefined}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
