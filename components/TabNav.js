'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/marketing', label: 'Marketing' },
  { href: '/analysis', label: 'Analysis' },
  { href: '/consulting', label: 'Consulting' },
  { href: '/invoice-billing', label: 'Invoice/Billing' },
  { href: '/bms-forms', label: 'BMS Forms' },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="tab-nav" aria-label="BMS sections">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={isActive ? 'tab active' : 'tab'}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
