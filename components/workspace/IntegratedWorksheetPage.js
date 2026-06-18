'use client';

import { useCallback, useMemo, useState } from 'react';
import WorksheetShell from '@/components/workspace/WorksheetShell';
import { WorksheetShellContext } from '@/lib/client/WorksheetShellContext';

/**
 * Client wrapper for integrated analyst worksheets — provides shell chrome + form/run bridge.
 *
 * @param {{
 *   clientId: string,
 *   worksheetKey: string,
 *   title: string,
 *   status: import('@/lib/worksheets/hubStatus').WorksheetHubLifecycleStatus,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function IntegratedWorksheetPage({ clientId, worksheetKey, title, status, children }) {
  const [formValues, setFormValues] = useState(/** @type {Record<string, unknown>} */ ({}));
  const [runLoader, setRunLoader] = useState(
    /** @type {((run: Record<string, unknown>) => void) | null} */ (null),
  );

  const handleSelectRun = useCallback(
    (run) => {
      runLoader?.(run);
    },
    [runLoader],
  );

  const contextValue = useMemo(
    () => ({
      setFormValues,
      setRunLoader,
    }),
    [],
  );

  return (
    <WorksheetShellContext.Provider value={contextValue}>
      <WorksheetShell
        clientId={clientId}
        worksheetKey={worksheetKey}
        title={title}
        status={status}
        formValues={formValues}
        onSelectRun={runLoader ? handleSelectRun : undefined}
      >
        {children}
      </WorksheetShell>
    </WorksheetShellContext.Provider>
  );
}
