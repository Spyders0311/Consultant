import { createClient } from '@/lib/supabase/client';

function draftStorageKey(clientId, worksheetKey) {
  return `worksheet-draft:${clientId}:${worksheetKey}`;
}

/**
 * @param {string} clientId
 * @param {string} worksheetKey
 * @param {Record<string, unknown>} payload
 */
export function saveWorksheetDraftLocal(clientId, worksheetKey, payload) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(draftStorageKey(clientId, worksheetKey), JSON.stringify(payload));
}

/**
 * @param {string} clientId
 * @param {string} worksheetKey
 * @returns {Record<string, unknown>|null}
 */
export function loadWorksheetDraftLocal(clientId, worksheetKey) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(draftStorageKey(clientId, worksheetKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown>|null|undefined} draft
 * @returns {number}
 */
function draftTimestamp(draft) {
  const raw = draft?.savedAt || draft?.updated_at;
  if (!raw) return 0;
  const parsed = new Date(String(raw)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Prefer the newest draft between localStorage and Supabase.
 *
 * @param {string} clientId
 * @param {string} worksheetKey
 * @returns {Promise<Record<string, unknown>|null>}
 */
export async function loadWorksheetDraft(clientId, worksheetKey) {
  const local = loadWorksheetDraftLocal(clientId, worksheetKey);

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('client_worksheet_drafts')
      .select('draft_json, updated_at')
      .eq('client_id', clientId)
      .eq('worksheet_key', worksheetKey)
      .maybeSingle();

    if (error || !data?.draft_json || typeof data.draft_json !== 'object') {
      return local;
    }

    const remote = { ...data.draft_json, updated_at: data.updated_at };
    if (!local) {
      return remote;
    }

    return draftTimestamp(remote) >= draftTimestamp(local) ? remote : local;
  } catch {
    return local;
  }
}

/**
 * @param {string} clientId
 * @param {string} worksheetKey
 * @param {Record<string, unknown>} draftJson
 */
export async function saveWorksheetDraft(clientId, worksheetKey, draftJson) {
  saveWorksheetDraftLocal(clientId, worksheetKey, draftJson);

  try {
    const supabase = createClient();
    const { error } = await supabase.from('client_worksheet_drafts').upsert({
      client_id: clientId,
      worksheet_key: worksheetKey,
      draft_json: draftJson,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { ok: true, persisted: 'local', warning: error.message };
    }

    return { ok: true, persisted: 'db' };
  } catch (error) {
    return {
      ok: true,
      persisted: 'local',
      warning: error instanceof Error ? error.message : 'Draft saved locally only.',
    };
  }
}

/**
 * @param {string} clientId
 * @param {string} worksheetKey
 */
export async function markWorksheetComplete(clientId, worksheetKey) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('client_worksheet_status').upsert({
    client_id: clientId,
    worksheet_key: worksheetKey,
    status: 'complete',
    completed_at: new Date().toISOString(),
    completed_by: user?.id || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message || 'Unable to mark worksheet complete.');
  }

  return { ok: true };
}
