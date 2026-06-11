'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';

const RESOURCE_SECTIONS = [
  { key: 'marketing', label: 'Marketing' },
  { key: 'consulting', label: 'Consulting' },
  { key: 'invoice-billing', label: 'Invoice / Billing' },
  { key: 'bms-forms', label: 'BMS Forms' },
];

function NavLink({ href, icon, label, active, collapsed, onNavigate, badge }) {
  return (
    <Link
      href={href}
      className={active ? 'sidebar-link active' : 'sidebar-link'}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      <span className="sidebar-label">{label}</span>
      {badge ? <span className={`badge ${badge.className} sidebar-label`}>{badge.text}</span> : null}
    </Link>
  );
}

/**
 * Workspace navigation. Props are serializable data computed by the layout:
 * - clients: [{ id, company_name }] for the switcher
 * - navGroups: live worksheets grouped ([{ name, worksheets: [{key, displayName}] }])
 * - worksheets: every registry entry ({key, displayName, group, status}) for search
 */
export default function WorkspaceSidebar({
  clientId,
  clientName,
  clients,
  navGroups,
  worksheets,
  totalWorksheets,
  collapsed,
  onToggleCollapsed,
  onNavigate,
}) {
  const pathname = usePathname();
  const base = `/workspace/${clientId}`;
  const [query, setQuery] = useState('');

  const isActive = (href, { exact = false } = {}) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return null;
    }
    return worksheets
      .filter((sheet) => sheet.displayName.toLowerCase().includes(needle) || sheet.key.includes(needle))
      .slice(0, 20);
  }, [query, worksheets]);

  const otherClients = clients.filter((client) => client.id !== clientId);

  return (
    <aside className="app-sidebar" aria-label="Workspace navigation">
      <div className="sidebar-brand">
        <Link href="/dashboard/clients" className="sidebar-brand-name" onClick={onNavigate}>
          <span className="sidebar-brand-mark" aria-hidden="true">B</span>
          <span className="sidebar-label">BMS Portal</span>
        </Link>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={14} />
        </button>
      </div>

      <details className="sidebar-client sidebar-label">
        <summary>
          <Icon name="clients" size={14} />
          <span className="sidebar-client-name">{clientName || 'Client'}</span>
          <Icon name="chevron-down" size={12} />
        </summary>
        <div className="sidebar-client-menu">
          {otherClients.slice(0, 10).map((client) => (
            <Link key={client.id} href={`/workspace/${client.id}/analysis`} onClick={onNavigate}>
              {client.company_name || 'Untitled client'}
            </Link>
          ))}
          <Link href="/dashboard/clients" className="sidebar-client-all" onClick={onNavigate}>
            All clients →
          </Link>
        </div>
      </details>

      <label className="sidebar-search sidebar-label">
        <Icon name="search" size={14} />
        <input
          type="search"
          value={query}
          placeholder="Search worksheets…"
          aria-label="Search worksheets"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {searchResults ? (
        <nav className="sidebar-section" aria-label="Search results">
          <p className="sidebar-section-title sidebar-label">
            {searchResults.length ? `Results (${searchResults.length})` : 'No matching worksheets'}
          </p>
          {searchResults.map((sheet) => (
            <NavLink
              key={sheet.key}
              href={`${base}/analyst-wizard/sheets/${sheet.key}`}
              label={sheet.displayName}
              active={isActive(`${base}/analyst-wizard/sheets/${sheet.key}`, { exact: true })}
              collapsed={collapsed}
              onNavigate={onNavigate}
              badge={
                sheet.status === 'live'
                  ? { className: 'badge-live', text: 'Live' }
                  : { className: 'badge-soon', text: 'Soon' }
              }
            />
          ))}
        </nav>
      ) : (
        <>
          <nav className="sidebar-section" aria-label="Workspace">
            <p className="sidebar-section-title sidebar-label">Workspace</p>
            <NavLink
              href={`${base}/analysis`}
              icon="home"
              label="Analysis"
              active={isActive(`${base}/analysis`)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
            <NavLink
              href={`${base}/analyst-wizard`}
              icon="sheet"
              label="Worksheets"
              active={isActive(`${base}/analyst-wizard`, { exact: true })}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
            <NavLink
              href={`${base}/analyst-wizard/guided-intake`}
              icon="play"
              label="Guided Intake"
              active={isActive(`${base}/analyst-wizard/guided-intake`)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </nav>

          <nav className="sidebar-section sidebar-label" aria-label="Live worksheets">
            <p className="sidebar-section-title">Live worksheets</p>
            {navGroups.map((group) => (
              <details
                key={group.name}
                className="sidebar-group"
                open={group.worksheets.some((sheet) =>
                  isActive(`${base}/analyst-wizard/sheets/${sheet.key}`, { exact: true }),
                )}
              >
                <summary>
                  <Icon name="chevron-right" size={12} className="sidebar-group-chevron" />
                  {group.name}
                  <span className="sidebar-group-count">{group.worksheets.length}</span>
                </summary>
                <div className="sidebar-group-sheets">
                  {group.worksheets.map((sheet) => (
                    <NavLink
                      key={sheet.key}
                      href={`${base}/analyst-wizard/sheets/${sheet.key}`}
                      label={sheet.displayName}
                      active={isActive(`${base}/analyst-wizard/sheets/${sheet.key}`, { exact: true })}
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </details>
            ))}
            <Link href={`${base}/analyst-wizard`} className="sidebar-view-all" onClick={onNavigate}>
              View all {totalWorksheets} worksheets →
            </Link>
          </nav>

          <nav className="sidebar-section" aria-label="Resources">
            <p className="sidebar-section-title sidebar-label">Resources</p>
            {RESOURCE_SECTIONS.map((section) => (
              <NavLink
                key={section.key}
                href={`${base}/${section.key}`}
                icon="folder"
                label={section.label}
                active={isActive(`${base}/${section.key}`)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </>
      )}

      <div className="sidebar-footer">
        <NavLink
          href="/settings"
          icon="settings"
          label="Settings"
          active={isActive('/settings')}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>
    </aside>
  );
}
