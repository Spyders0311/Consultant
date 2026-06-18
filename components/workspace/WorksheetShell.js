'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import StatusDot from '@/components/hub/StatusDot';
import { markWorksheetComplete, saveWorksheetDraft } from '@/lib/client/worksheetShellPersistence';
import WorksheetHeaderActions from '@/components/workspace/WorksheetHeaderActions';
import WorksheetStatusRail from '@/components/workspace/WorksheetStatusRail';

/**
 * Consistent worksheet chrome: header, actions, main content, and status rail.
 *
 * @param {{
 *   clientId: string,
 *   worksheetKey: string,
 *   title: string,
 *   status: import('@/lib/worksheets/hubStatus').WorksheetHubLifecycleStatus,
 *   children: import('react').ReactNode,
 *   formValues?: Record<string, unknown>,
 *   completionPercent?: number|null,
 *   onSave?: (payload: Record<string, unknown>) => void | Promise<void>,
 *   onMarkComplete?: () => void | Promise<void>,
 *   onSelectRun?: (run: Record<string, unknown>) => void,
 *   hubHref?: string,
 * }} props
 */
export default function WorksheetShell({
  clientId,
  worksheetKey,
  title,
  status,
  children,
  formValues = {},
  completionPercent = null,
  onSave,
  onMarkComplete,
  onSelectRun,
  hubHref,
}) {
  const [shellStatus, setShellStatus] = useState(status);
  const [saveLoading, setSaveLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const resolvedHubHref = hubHref || `/workspace/${clientId}/analyst-wizard`;

  const handleSave = useCallback(async () => {
    setSaveLoading(true);
    setActionMessage('');
    try {
      if (onSave) {
        await onSave(formValues);
        setActionMessage('Draft saved.');
        if (shellStatus === 'not_started') {
          setShellStatus('in_progress');
        }
        return;
      }

      const result = await saveWorksheetDraft(clientId, worksheetKey, formValues);
      if (result.warning) {
        setActionMessage('Draft saved locally.');
      } else {
        setActionMessage('Draft saved.');
      }
      if (shellStatus === 'not_started') {
        setShellStatus('in_progress');
      }
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Unable to save draft.');
    } finally {
      setSaveLoading(false);
    }
  }, [clientId, worksheetKey, formValues, onSave, shellStatus]);

  const handleMarkComplete = useCallback(async () => {
    setCompleteLoading(true);
    setActionMessage('');
    try {
      if (onMarkComplete) {
        await onMarkComplete();
      } else {
        await markWorksheetComplete(clientId, worksheetKey);
      }
      setShellStatus('complete');
      setActionMessage('Marked complete.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Unable to mark complete.');
    } finally {
      setCompleteLoading(false);
    }
  }, [clientId, worksheetKey, onMarkComplete]);

  return (
    <section className="panel worksheet-shell workspace-hub">
      <header className="worksheet-shell__header">
        <div className="worksheet-shell__heading">
          <p className="worksheet-shell__back">
            <Link href={resolvedHubHref}>← Back to worksheet hub</Link>
          </p>
          <div className="worksheet-shell__title-row">
            <h2>{title}</h2>
            <StatusDot status={shellStatus} />
          </div>
        </div>
        <WorksheetHeaderActions
          onSave={handleSave}
          onMarkComplete={handleMarkComplete}
          saveLoading={saveLoading}
          completeLoading={completeLoading}
          statusMessage={actionMessage}
        />
      </header>

      <div className="workspace-hub-layout worksheet-shell__layout">
        <div className="workspace-hub-main worksheet-shell__main">{children}</div>
        <div className="workspace-hub-rail">
          <WorksheetStatusRail
            clientId={clientId}
            worksheetKey={worksheetKey}
            formValues={formValues}
            completionPercent={completionPercent}
            onSelectRun={onSelectRun}
          />
        </div>
      </div>
    </section>
  );
}
