/** Step-based analyst wizards tracked for hub progress (Track 3C). */

export const STEP_WIZARD_STEP_COUNTS = {
  'basic-client-info': 7,
  'breakeven-analysis': 5,
  'working-capital-analysis': 4,
  'current-financial-information': 5,
  '5-year-projections': 3,
  'p-l-comparisons': 3,
};

/**
 * @param {string} worksheetKey
 * @returns {boolean}
 */
export function isStepTrackedWorksheet(worksheetKey) {
  return Object.prototype.hasOwnProperty.call(STEP_WIZARD_STEP_COUNTS, worksheetKey);
}

/**
 * @param {string} worksheetKey
 * @returns {number|null}
 */
export function getStepWizardStepCount(worksheetKey) {
  const count = STEP_WIZARD_STEP_COUNTS[worksheetKey];
  return typeof count === 'number' ? count : null;
}

/**
 * @param {number} stepIndex
 * @param {number} stepCount
 * @returns {number|null}
 */
export function resolveStepProgressPercent(stepIndex, stepCount) {
  if (!Number.isFinite(stepIndex) || !Number.isFinite(stepCount) || stepCount <= 0) {
    return null;
  }

  const clampedIndex = Math.min(Math.max(0, stepIndex), stepCount - 1);
  return Math.round(((clampedIndex + 1) / stepCount) * 100);
}

/**
 * @param {string} worksheetKey
 * @param {Record<string, unknown>|null|undefined} draftJson
 * @returns {number|null}
 */
export function resolveProgressPercentFromDraft(worksheetKey, draftJson) {
  const stepCount = getStepWizardStepCount(worksheetKey);
  if (!stepCount || !draftJson || typeof draftJson !== 'object') {
    return null;
  }

  const stepIndex = Number(draftJson.stepIndex);
  if (!Number.isFinite(stepIndex)) {
    return null;
  }

  return resolveStepProgressPercent(stepIndex, stepCount);
}

/**
 * Flatten `{ form }` draft payloads for worksheet shell required-field tracking.
 *
 * @param {Record<string, unknown>} draftPayload
 * @param {number} stepIndex
 * @returns {Record<string, unknown>}
 */
export function buildShellFormValuesForDraft(draftPayload, stepIndex) {
  if (
    draftPayload &&
    typeof draftPayload === 'object' &&
    draftPayload.form &&
    typeof draftPayload.form === 'object' &&
    !Array.isArray(draftPayload.form)
  ) {
    return { .../** @type {Record<string, unknown>} */ (draftPayload.form), stepIndex };
  }

  return { ...draftPayload, stepIndex };
}
