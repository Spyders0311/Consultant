'use client';

import { useEffect } from 'react';
import { useWorksheetShellContext } from '@/lib/client/WorksheetShellContext';

/**
 * Sync wizard form state to the worksheet shell rail (required-field completion).
 * @param {Record<string, unknown>} formValues
 */
export default function useWorksheetShellForm(formValues) {
  const context = useWorksheetShellContext();

  useEffect(() => {
    if (!context) return;
    context.setFormValues(formValues || {});
  }, [context, formValues]);
}
