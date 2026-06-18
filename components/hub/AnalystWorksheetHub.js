'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ContinueWhereLeftOff from '@/components/hub/ContinueWhereLeftOff';
import WorksheetCard from '@/components/hub/WorksheetCard';
import WorksheetCategoryColumn from '@/components/hub/WorksheetCategoryColumn';
import { HUB_CATEGORIES, HUB_CATEGORY_LABELS } from '@/lib/worksheets/catalogMetadata';

const STATUS_FILTERS = [
  { key: 'all', label: 'All statuses' },
  { key: 'complete', label: 'Complete' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'not_started', label: 'Not started' },
  { key: 'planned', label: 'Planned' },
];

/**
 * @param {{
 *   clientId: string,
 *   hubStatus: import('@/lib/worksheets/hubStatus').HubStatusResponse,
 * }} props
 */
export default function AnalystWorksheetHub({ clientId, hubStatus }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [integratedOnly, setIntegratedOnly] = useState(true);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return hubStatus.items.filter((entry) => {
      if (integratedOnly && entry.integrationStatus === 'planned') {
        return false;
      }
      if (statusFilter !== 'all' && entry.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && entry.hubCategory !== categoryFilter) {
        return false;
      }
      if (!query) {
        return true;
      }

      const haystack = [entry.sheetName, entry.description, entry.worksheetKey]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [hubStatus.items, search, statusFilter, categoryFilter, integratedOnly]);

  const coreItems = useMemo(
    () =>
      filteredItems
        .filter((entry) => typeof entry.coreRank === 'number')
        .sort((a, b) => (a.coreRank || 0) - (b.coreRank || 0)),
    [filteredItems],
  );

  const categoryItems = useMemo(() => {
    const nonCore = filteredItems.filter((entry) => typeof entry.coreRank !== 'number');
    return HUB_CATEGORIES.map((category) => ({
      category,
      items: nonCore
        .filter((entry) => entry.hubCategory === category)
        .sort((a, b) => a.sheetName.localeCompare(b.sheetName)),
    }));
  }, [filteredItems]);

  const visibleCategoryCount = categoryItems.filter((group) => group.items.length > 0).length;
  const guidedIntakeHref = `/workspace/${clientId}/analyst-wizard/guided-intake`;

  return (
    <section className="panel worksheet-hub workspace-hub">
      <header className="worksheet-hub__header">
        <div>
          <h2>Analyst Worksheet Hub</h2>
          <p className="worksheet-hub__lede">
            Core financial worksheets first, then browse by category. {hubStatus.summary.integratedCount} integrated
            worksheets available in-app.
          </p>
        </div>
        <p className="worksheet-hub__summary" aria-live="polite">
          {filteredItems.length} shown
          {integratedOnly ? ' (integrated only)' : ''}
        </p>
      </header>

      <ContinueWhereLeftOff items={hubStatus.items} clientId={clientId} compact />

      <div className="hub-toolbar" role="search">
        <label className="hub-search">
          <span className="hub-search__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search worksheets…"
            aria-label="Search worksheets"
          />
        </label>

        <div className="hub-toolbar__filters">
          <label className="hub-select">
            <span className="hub-select__label">Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {HUB_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {HUB_CATEGORY_LABELS[category] || category}
                </option>
              ))}
            </select>
          </label>

          <div className="hub-chip-group" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`hub-chip${statusFilter === filter.key ? ' hub-chip--active' : ''}`}
                onClick={() => setStatusFilter(filter.key)}
                aria-pressed={statusFilter === filter.key}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <label className="hub-toggle">
            <input
              type="checkbox"
              checked={integratedOnly}
              onChange={(event) => setIntegratedOnly(event.target.checked)}
            />
            <span>Integrated only</span>
          </label>
        </div>
      </div>

      {coreItems.length > 0 ? (
        <section className="hub-core-section" aria-labelledby="hub-core-heading">
          <div className="hub-core-section__header">
            <h3 id="hub-core-heading">Core worksheets</h3>
            <p>
              {hubStatus.summary.coreComplete} of {hubStatus.summary.coreTotal} complete
            </p>
          </div>
          <div className="hub-core-grid">
            {coreItems.map((entry) => (
              <WorksheetCard key={entry.worksheetKey} entry={entry} />
            ))}
          </div>
        </section>
      ) : null}

      {visibleCategoryCount > 0 ? (
        <section className="hub-categories-section" aria-labelledby="hub-categories-heading">
          <h3 id="hub-categories-heading" className="hub-categories-section__title">
            Browse by category
          </h3>
          <div className="hub-category-columns">
            {categoryItems.map((group) => (
              <WorksheetCategoryColumn key={group.category} category={group.category} items={group.items} />
            ))}
          </div>
        </section>
      ) : (
        <p className="hub-empty">No worksheets match your filters.</p>
      )}

      <footer className="hub-guided-intake">
        <div>
          <h3>Guided Intake Wizard</h3>
          <p>Walk through the core analyst sequence with prompts and recommended order.</p>
        </div>
        <Link href={guidedIntakeHref} className="hub-guided-intake__cta">
          Open guided intake
        </Link>
      </footer>
    </section>
  );
}
