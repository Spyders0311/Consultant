/**
 * Worksheet shell header actions — save draft and mark complete.
 *
 * @param {{
 *   onSave?: () => void | Promise<void>,
 *   onMarkComplete?: () => void | Promise<void>,
 *   saveDisabled?: boolean,
 *   completeDisabled?: boolean,
 *   saveLoading?: boolean,
 *   completeLoading?: boolean,
 *   statusMessage?: string,
 * }} props
 */
export default function WorksheetHeaderActions({
  onSave,
  onMarkComplete,
  saveDisabled = false,
  completeDisabled = false,
  saveLoading = false,
  completeLoading = false,
  statusMessage = '',
}) {
  return (
    <div className="worksheet-header-actions">
      {statusMessage ? <p className="worksheet-header-actions__message">{statusMessage}</p> : null}
      <div className="worksheet-header-actions__buttons">
        <button
          type="button"
          className="worksheet-header-actions__btn worksheet-header-actions__btn--secondary"
          onClick={onSave}
          disabled={saveDisabled || saveLoading || !onSave}
        >
          {saveLoading ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          className="worksheet-header-actions__btn worksheet-header-actions__btn--primary"
          onClick={onMarkComplete}
          disabled={completeDisabled || completeLoading || !onMarkComplete}
        >
          {completeLoading ? 'Updating…' : 'Mark complete'}
        </button>
      </div>
    </div>
  );
}
