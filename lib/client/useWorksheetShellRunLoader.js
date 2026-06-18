'use client';

import { useEffect } from 'react';
import { useWorksheetShellContext } from '@/lib/client/WorksheetShellContext';

/**
 * Register a run loader so recent runs in the shell rail can restore wizard state.
 * @param {(run: Record<string, unknown>) => void} loadRun
 */
export default function useWorksheetShellRunLoader(loadRun) {
  const context = useWorksheetShellContext();

  useEffect(() => {
    if (!context) return;
    context.setRunLoader(loadRun);
    return () => context.setRunLoader(null);
  }, [context, loadRun]);
}
