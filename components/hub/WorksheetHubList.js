'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'coming-soon', label: 'Coming soon' },
];

/**
 * Searchable, grouped index of every worksheet.
 * Props: clientId, groups: [{ name, worksheets: [{ key, displayName, status, priorityRank }] }]
 */
export default function WorksheetHubList({ clientId, groups }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups
      .map((group) => ({
        name: group.name,
        worksheets: group.worksheets.filter((sheet) => {
          if (statusFilter !== 'all' && sheet.status !== statusFilter) {
            return false;
          }
          if (!needle) {
            return true;
          }
          return (
            sheet.displayName.toLowerCase().includes(needle) ||
            sheet.key.includes(needle) ||
            group.name.toLowerCase().includes(needle)
          );
        }),
      }))
      .filter((group) => group.worksheets.length > 0);
  }, [groups, query, statusFilter]);

  const totalShown = filteredGroups.reduce((sum, group) => sum + group.worksheets.length, 0);

  return (
    <div className="hub-list">
      <div className="hub-filters">
        <label className="hub-search">
          <Icon name="search" size={14} />
          <input
            type="search"
            value={query}
            placeholder="Search worksheets…"
            aria-label="Search worksheets"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="hub-status-filters" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={statusFilter === filter.key ? 'hub-chip active' : 'hub-chip'}
              onClick={() => setStatusFilter(filter.key)}
              aria-pressed={statusFilter === filter.key}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className="hub-count">{totalShown} worksheet{totalShown === 1 ? '' : 's'}</p>
      </div>

      {filteredGroups.length === 0 ? (
        <p className="hub-empty">No worksheets match. Try a different search or status filter.</p>
      ) : (
        filteredGroups.map((group) => (
          <section key={group.name} className="hub-group">
            <h3>{group.name}</h3>
            <div className="hub-rows">
              {group.worksheets.map((sheet) => (
                <Link
                  key={sheet.key}
                  href={`/workspace/${clientId}/analyst-wizard/sheets/${sheet.key}`}
                  className="hub-row"
                >
                  <Icon name="sheet" size={15} />
                  <span className="hub-row-name">{sheet.displayName}</span>
                  {sheet.priorityRank > 0 ? <span className="badge badge-core">Core</span> : null}
                  <span className={`badge ${sheet.status === 'live' ? 'badge-live' : 'badge-soon'}`}>
                    {sheet.status === 'live' ? 'Live' : 'Coming soon'}
                  </span>
                  <Icon name="chevron-right" size={14} className="hub-row-chevron" />
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
