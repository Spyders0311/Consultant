'use client';

function formatSourceLabel(source) {
  if (!source) return 'another worksheet';
  return source.replace(/-/g, ' ');
}

export default function SnapshotStatusBanner({ staleFields = [], snapshotMeta = null }) {
  if (!staleFields.length && !snapshotMeta?.updated_at) return null;

  return (
    <div className="snapshot-status-banner">
      {snapshotMeta?.updated_at ? (
        <p className="wizard-meta">
          Client snapshot last updated {new Date(snapshotMeta.updated_at).toLocaleString('en-US')}.
        </p>
      ) : null}
      {staleFields.length > 0 ? (
        <p className="wizard-warning">
          Stale prefilled fields ({staleFields.join(', ')}): a newer source worksheet run is available. Use Pull or
          re-open after saving the source.
        </p>
      ) : null}
    </div>
  );
}

export function fieldProvenanceLabel(provenance, snapshotKey) {
  const entry = provenance?.[snapshotKey];
  if (!entry?.source) return null;
  return `From ${formatSourceLabel(entry.source)}`;
}
