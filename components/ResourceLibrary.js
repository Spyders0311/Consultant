'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

function statusClassName(status) {
  return `resource-status resource-status-${String(status || 'mapped').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function groupResources(resources) {
  const groups = new Map();

  for (const resource of resources) {
    const groupTitle = resource.groupTitle || 'Resources';
    if (!groups.has(groupTitle)) {
      groups.set(groupTitle, []);
    }
    groups.get(groupTitle).push(resource);
  }

  return Array.from(groups.entries())
    .map(([title, groupResources]) => ({ title, resources: groupResources }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

function optionValues(resources, field) {
  return [...new Set(resources.map((resource) => resource[field]).filter(Boolean))].sort();
}

function matchesSearch(resource, query) {
  if (!query) return true;
  const haystack = [
    resource.title,
    resource.relPath,
    resource.kind,
    resource.status,
    resource.extension,
    ...(resource.metrics || []),
    ...(resource.tags || []),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function Preview({ preview }) {
  if (!preview) return null;

  return (
    <details className="resource-preview">
      <summary>{preview.label}</summary>
      {preview.text ? <p>{preview.text}</p> : null}
      {preview.sheets?.length ? (
        <ul>
          {preview.sheets.map((sheet) => (
            <li key={`${sheet.name}-${sheet.ref}`}>
              <strong>{sheet.name}</strong>
              <span>
                {sheet.ref || 'No range'} · {sheet.formulaCount.toLocaleString()} formulas
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
}

function ResourceCard({ resource }) {
  return (
    <article className={resource.href ? 'resource-card resource-card-linkable' : 'resource-card'}>
      <span className={statusClassName(resource.status)}>{resource.status}</span>
      <h4>
        {resource.href ? <Link href={resource.href}>{resource.title}</Link> : resource.title}
      </h4>
      <p className="resource-path">{resource.relPath}</p>
      <div className="resource-meta">
        <span>{resource.kind}</span>
        <span>{resource.extension}</span>
        {(resource.metrics || []).map((metric) => (
          <span key={metric}>{metric}</span>
        ))}
        {resource.duplicateCount > 0 ? (
          <span>{resource.duplicateCount} duplicate source{resource.duplicateCount === 1 ? '' : 's'}</span>
        ) : null}
      </div>

      <Preview preview={resource.preview} />

      <div className="resource-actions">
        {resource.href ? <Link href={resource.href}>Open workflow</Link> : null}
        {resource.downloadHref ? <a href={resource.downloadHref}>Download source</a> : null}
        {resource.access?.reviewRequired ? <span>Review required before release</span> : null}
      </div>
    </article>
  );
}

export default function ResourceLibrary({ section, compact = false }) {
  const resources = useMemo(() => section.resources || [], [section.resources]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [kind, setKind] = useState('all');
  const [access, setAccess] = useState('all');

  const queryValue = query.trim().toLowerCase();
  const statusOptions = optionValues(resources, 'status');
  const kindOptions = optionValues(resources, 'kind');
  const filteredResources = useMemo(
    () =>
      resources.filter((resource) => {
        if (!matchesSearch(resource, queryValue)) return false;
        if (status !== 'all' && resource.status !== status) return false;
        if (kind !== 'all' && resource.kind !== kind) return false;
        if (access === 'downloadable' && !resource.downloadHref) return false;
        if (access === 'review' && !resource.access?.reviewRequired) return false;
        return true;
      }),
    [access, kind, queryValue, resources, status],
  );
  const filteredGroups = groupResources(filteredResources);

  return (
    <div className={compact ? 'resource-library resource-library-compact' : 'resource-library'}>
      <div className="resource-library-header">
        <div>
          <p className="eyebrow">Mapped from source files</p>
          <h3>{section.label} Library</h3>
          <p>{section.description}</p>
        </div>
        <div className="resource-stats" aria-label={`${section.label} resource counts`}>
          <article>
            <strong>{section.stats.resources}</strong>
            <span>Resources</span>
          </article>
          <article>
            <strong>{section.stats.live}</strong>
            <span>Live</span>
          </article>
          <article>
            <strong>{section.stats.ready}</strong>
            <span>Ready</span>
          </article>
          <article>
            <strong>{section.stats.duplicateSources}</strong>
            <span>Duplicates hidden</span>
          </article>
          <article>
            <strong>{section.stats.reviewRequired}</strong>
            <span>Need review</span>
          </article>
        </div>
      </div>

      <div className="resource-filters" aria-label={`${section.label} resource filters`}>
        <label>
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, tag, path, or metric"
          />
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="all">All types</option>
            {kindOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Access</span>
          <select value={access} onChange={(event) => setAccess(event.target.value)}>
            <option value="all">All access</option>
            <option value="downloadable">Downloadable</option>
            <option value="review">Needs review</option>
          </select>
        </label>
      </div>

      <p className="resource-filter-count">
        Showing {filteredResources.length} of {resources.length} mapped resources.
      </p>

      <div className="resource-groups">
        {filteredGroups.map((group) => (
          <section className="resource-group" key={group.title}>
            <div className="resource-group-heading">
              <h4>{group.title}</h4>
              <span>{group.resources.length}</span>
            </div>
            <div className="resource-card-grid">
              {group.resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </section>
        ))}
        {filteredGroups.length === 0 ? <p className="resource-empty">No resources match these filters.</p> : null}
      </div>
    </div>
  );
}
