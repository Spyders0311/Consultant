'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Saved-run persistence for a worksheet: fetches history on mount and saves
 * new runs, keeping the newest ten in memory (the pre-overhaul behavior of
 * every wizard).
 *
 * extraParams (e.g. { sheet_key } or { workbook_key }) are sent as query
 * params on the GET and merged into the POST body.
 */
export default function useWorksheetRuns({ endpoint, clientId, extraParams }) {
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState('');
  const extraParamsKey = JSON.stringify(extraParams || {});

  useEffect(() => {
    let cancelled = false;
    const parsedExtra = JSON.parse(extraParamsKey);

    async function fetchRuns() {
      if (!clientId || !endpoint) return;
      setRunsLoading(true);
      setRunsError('');
      try {
        const params = new URLSearchParams({ client_id: clientId, ...parsedExtra });
        const response = await fetch(`${endpoint}?${params.toString()}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load run history.');
        }
        if (!cancelled) setRuns(data.runs || []);
      } catch (err) {
        if (!cancelled) setRunsError(err.message || 'Unable to load run history.');
      } finally {
        if (!cancelled) setRunsLoading(false);
      }
    }

    fetchRuns();

    return () => {
      cancelled = true;
    };
  }, [endpoint, clientId, extraParamsKey]);

  const saveRun = useCallback(
    async ({ inputs, outputs }) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          ...(extraParams || {}),
          inputs,
          outputs,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Calculation succeeded but saving run failed.');
      }

      const savedRun = {
        id: data.id || '',
        created_at: new Date().toISOString(),
        inputs,
        outputs,
      };
      setRuns((prev) => [savedRun, ...prev.filter((run) => run.id !== savedRun.id)].slice(0, 10));
      return savedRun;
    },
    [endpoint, clientId, extraParams],
  );

  return { runs, runsLoading, runsError, saveRun };
}
