'use client';

import { useEffect, useRef } from 'react';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';
import {
  loadWorksheetDraft,
  saveWorksheetDraft,
  saveWorksheetDraftLocal,
} from '@/lib/client/worksheetShellPersistence';
import {
  buildShellFormValuesForDraft,
  getStepWizardStepCount,
} from '@/lib/worksheets/stepWizardProgress';

/**
 * Persist stepIndex (and optional wizard fields) for hub progress + resume.
 *
 * @param {{
 *   clientId: string,
 *   worksheetKey: string,
 *   stepIndex: number,
 *   setStepIndex: (value: number | ((prev: number) => number)) => void,
 *   draftPayload?: Record<string, unknown>,
 *   onRestoreDraft?: (draft: Record<string, unknown>) => void,
 * }} options
 */
export default function useWorksheetStepDraft({
  clientId,
  worksheetKey,
  stepIndex,
  setStepIndex,
  draftPayload = {},
  onRestoreDraft,
}) {
  const stepCount = getStepWizardStepCount(worksheetKey) || 1;
  const restoredRef = useRef(false);
  const onRestoreDraftRef = useRef(onRestoreDraft);
  onRestoreDraftRef.current = onRestoreDraft;

  useWorksheetShellForm(buildShellFormValuesForDraft(draftPayload, stepIndex));

  useEffect(() => {
    if (restoredRef.current) {
      return;
    }
    restoredRef.current = true;

    let cancelled = false;

    (async () => {
      const draft = await loadWorksheetDraft(clientId, worksheetKey);
      if (cancelled || !draft) {
        return;
      }

      if (typeof draft.stepIndex === 'number') {
        const clamped = Math.min(Math.max(0, draft.stepIndex), stepCount - 1);
        setStepIndex(clamped);
      }

      onRestoreDraftRef.current?.(draft);
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, worksheetKey, setStepIndex, stepCount]);

  useEffect(() => {
    const payload = {
      ...draftPayload,
      stepIndex,
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
    };

    saveWorksheetDraftLocal(clientId, worksheetKey, payload);

    const timer = window.setTimeout(() => {
      saveWorksheetDraft(clientId, worksheetKey, payload);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [clientId, worksheetKey, stepIndex, draftPayload]);
}
