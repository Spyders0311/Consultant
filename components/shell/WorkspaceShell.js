'use client';

import { useState, useSyncExternalStore } from 'react';
import WorkspaceSidebar from '@/components/shell/WorkspaceSidebar';
import WorkspaceTopbar from '@/components/shell/WorkspaceTopbar';

const COLLAPSE_KEY = 'bms.sidebar.collapsed';

// localStorage-backed store so the collapsed preference survives reloads
// without hydration mismatches (server snapshot is always "expanded").
const collapseListeners = new Set();

function subscribeCollapsed(listener) {
  collapseListeners.add(listener);
  return () => collapseListeners.delete(listener);
}

function readCollapsed() {
  return window.localStorage.getItem(COLLAPSE_KEY) === '1';
}

function writeCollapsed(value) {
  window.localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  for (const listener of collapseListeners) {
    listener();
  }
}

/**
 * Client wrapper owning sidebar state (desktop collapse, mobile drawer).
 * All data props are precomputed server-side by the workspace layout.
 */
export default function WorkspaceShell({
  clientId,
  clientName,
  clients,
  navGroups,
  worksheets,
  totalWorksheets,
  sheetNames,
  userEmail,
  children,
}) {
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapsed() {
    writeCollapsed(!collapsed);
  }

  const shellClass = [
    'app-shell',
    collapsed ? 'sidebar-collapsed' : '',
    mobileOpen ? 'sidebar-mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClass}>
      <WorkspaceSidebar
        clientId={clientId}
        clientName={clientName}
        clients={clients}
        navGroups={navGroups}
        worksheets={worksheets}
        totalWorksheets={totalWorksheets}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onNavigate={() => setMobileOpen(false)}
      />
      {mobileOpen ? (
        <div className="shell-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      ) : null}
      <div className="app-main">
        <WorkspaceTopbar
          clientId={clientId}
          clientName={clientName}
          sheetNames={sheetNames}
          userEmail={userEmail}
          onMenuToggle={() => setMobileOpen((value) => !value)}
        />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
