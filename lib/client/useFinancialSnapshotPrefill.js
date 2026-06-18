'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchFinancialSnapshot } from '@/lib/client/fetchFinancialSnapshot';
import { SNAPSHOT_FIELD_MAP, SNAPSHOT_PL_YEAR_FIELDS } from '@/lib/worksheets/snapshotFieldMap';
import { SOURCE_RUN_ENDPOINTS } from '@/lib/worksheets/sourceRunEndpoints';

function buildPatchFromSnapshot(snapshot, fieldMap, onlyEmpty, currentForm) {
  const patch = {};
  const fieldSources = {};

  for (const { formField, snapshotKey } of fieldMap) {
    const value = snapshot?.[snapshotKey];
    if (value === undefined || value === null || value === '') continue;
    if (onlyEmpty && currentForm?.[formField] !== '' && currentForm?.[formField] != null) continue;
    patch[formField] = value;
    fieldSources[formField] = snapshotKey;
  }

  return { patch, fieldSources };
}

async function fetchLatestRunTimestamp(clientId, source) {
  const endpoint = SOURCE_RUN_ENDPOINTS[source];
  if (!endpoint || !clientId) return null;

  const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}client_id=${encodeURIComponent(clientId)}&limit=1`;
  try {
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.ok) return null;
    return data.runs?.[0]?.created_at || null;
  } catch {
    return null;
  }
}

export default function useFinancialSnapshotPrefill({
  clientId,
  worksheetKey,
  applyPrefill,
  currentForm,
  onlyEmpty = true,
  enabled = true,
}) {
  const [provenance, setProvenance] = useState({});
  const [staleFields, setStaleFields] = useState([]);
  const [snapshotMeta, setSnapshotMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const fieldMap = useMemo(() => {
    if (worksheetKey === 'p-l-comparisons') return SNAPSHOT_PL_YEAR_FIELDS;
    return SNAPSHOT_FIELD_MAP[worksheetKey] || [];
  }, [worksheetKey]);

  useEffect(() => {
    if (!enabled || !clientId || !worksheetKey || fieldMap.length === 0 || !applyPrefill) return;

    let cancelled = false;

    async function loadSnapshot() {
      setLoading(true);
      try {
        const data = await fetchFinancialSnapshot(clientId);
        if (cancelled) return;

        setProvenance(data.provenance || {});
        setSnapshotMeta({ updated_at: data.updated_at });

        const { patch, fieldSources } = buildPatchFromSnapshot(
          data.snapshot,
          fieldMap,
          onlyEmpty,
          currentForm,
        );

        if (Object.keys(patch).length > 0) {
          applyPrefill(patch, 'Client snapshot');
        }

        const stale = [];
        const sourceChecks = new Set();

        for (const snapshotKey of Object.values(fieldSources)) {
          const prov = data.provenance?.[snapshotKey];
          if (!prov?.source || !prov?.at) continue;
          sourceChecks.add(`${prov.source}|${snapshotKey}|${prov.at}`);
        }

        for (const entry of sourceChecks) {
          const [source, snapshotKey, prefilledAt] = entry.split('|');
          const latestRunAt = await fetchLatestRunTimestamp(clientId, source);
          if (latestRunAt && new Date(latestRunAt) > new Date(prefilledAt)) {
            for (const { formField, snapshotKey: key } of fieldMap) {
              if (key === snapshotKey) stale.push(formField);
            }
          }
        }

        if (!cancelled) setStaleFields([...new Set(stale)]);
      } catch {
        // Snapshot prefill is best-effort on open.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSnapshot();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount per client/worksheet
  }, [clientId, worksheetKey, enabled]);

  return { provenance, staleFields, snapshotMeta, loading, fieldMap };
}
