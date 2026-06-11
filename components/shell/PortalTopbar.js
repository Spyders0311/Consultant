import Link from 'next/link';
import SignOutButton from '@/components/shell/SignOutButton';

/**
 * Slim topbar for pages outside a client workspace (dashboard, settings).
 */
export default function PortalTopbar({ userEmail }) {
  return (
    <header className="portal-topbar">
      <Link href="/dashboard/clients" className="portal-topbar-brand">
        <span className="sidebar-brand-mark" aria-hidden="true">B</span>
        BMS Portal
      </Link>
      <nav className="portal-topbar-links" aria-label="Portal">
        <Link href="/dashboard/clients">Clients</Link>
        <Link href="/settings">Settings</Link>
      </nav>
      <div className="topbar-spacer" />
      {userEmail ? <span className="topbar-user">{userEmail}</span> : null}
      <SignOutButton />
    </header>
  );
}
