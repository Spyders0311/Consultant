/**
 * @typedef {'not_started' | 'in_progress' | 'complete'} SectionLifecycleStatus
 */

/**
 * @typedef {Object} BasicClientInfoSectionDefinition
 * @property {string} id
 * @property {string} title
 * @property {string} hint
 * @property {string[]} fields
 * @property {boolean} [optional]
 */

/** @type {BasicClientInfoSectionDefinition[]} */
export const BASIC_CLIENT_INFO_SECTIONS = [
  {
    id: 'company-identity',
    title: 'Company Identity',
    hint: 'Legal name, industry, entity type, and EIN.',
    fields: ['companyName', 'industry', 'entityType', 'ein'],
  },
  {
    id: 'business-address',
    title: 'Business Address',
    hint: 'Mailing and physical location.',
    fields: ['addressLine1', 'addressLine2', 'locationCity', 'locationState', 'addressPostalCode'],
  },
  {
    id: 'primary-contact',
    title: 'Primary Contact',
    hint: 'Main point of contact for this engagement.',
    fields: ['primaryContactName', 'primaryContactEmail', 'primaryContactPhone'],
  },
  {
    id: 'ownership',
    title: 'Ownership & Leadership',
    hint: 'Principal owner or operator details.',
    fields: ['ownerName', 'ownerTitle', 'ownershipNotes'],
    optional: true,
  },
  {
    id: 'professional-partners',
    title: 'Professional Partners',
    hint: 'CPA, attorney, and banking relationships.',
    fields: [
      'cpaName',
      'cpaFirm',
      'cpaEmail',
      'cpaPhone',
      'attorneyName',
      'attorneyFirm',
      'attorneyEmail',
      'attorneyPhone',
      'bankerName',
      'bankerInstitution',
      'bankerEmail',
      'bankerPhone',
    ],
    optional: true,
  },
  {
    id: 'engagement-notes',
    title: 'Engagement Notes',
    hint: 'Context for the analyst team.',
    fields: ['notes'],
    optional: true,
  },
  {
    id: 'review',
    title: 'Review & Save',
    hint: 'Validate profile and persist a normalized run.',
    fields: [],
    optional: true,
  },
];

function cleanText(value) {
  return String(value ?? '').trim();
}

/**
 * @param {Record<string, unknown>} form
 * @param {string} field
 * @returns {boolean}
 */
function isFieldComplete(form, field) {
  return cleanText(form[field]).length > 0;
}

/**
 * @param {Record<string, unknown>} form
 * @param {BasicClientInfoSectionDefinition} section
 * @returns {SectionLifecycleStatus}
 */
export function resolveBasicClientInfoSectionStatus(form, section) {
  if (section.id === 'review') {
    return 'not_started';
  }

  if (!section.fields.length) {
    return 'not_started';
  }

  const filledCount = section.fields.filter((field) => isFieldComplete(form, field)).length;
  if (filledCount === 0) {
    return 'not_started';
  }

  if (section.id === 'company-identity') {
    const hasIdentity = isFieldComplete(form, 'companyName') && isFieldComplete(form, 'industry');
    return hasIdentity ? 'complete' : 'in_progress';
  }

  if (section.id === 'business-address') {
    const hasAddress =
      isFieldComplete(form, 'addressLine1') &&
      isFieldComplete(form, 'locationCity') &&
      isFieldComplete(form, 'locationState');
    return hasAddress ? 'complete' : 'in_progress';
  }

  if (section.id === 'primary-contact') {
    const hasContact =
      isFieldComplete(form, 'primaryContactName') ||
      isFieldComplete(form, 'primaryContactEmail') ||
      isFieldComplete(form, 'primaryContactPhone');
    return hasContact ? 'complete' : 'in_progress';
  }

  if (section.optional) {
    return filledCount === section.fields.length ? 'complete' : 'in_progress';
  }

  return filledCount === section.fields.length ? 'complete' : 'in_progress';
}

/**
 * @param {Record<string, unknown>} form
 * @param {boolean} [hasSavedRun]
 * @returns {Record<string, SectionLifecycleStatus>}
 */
export function buildBasicClientInfoSectionStatuses(form, hasSavedRun = false) {
  /** @type {Record<string, SectionLifecycleStatus>} */
  const statuses = {};

  for (const section of BASIC_CLIENT_INFO_SECTIONS) {
    if (section.id === 'review') {
      statuses[section.id] = hasSavedRun ? 'complete' : 'not_started';
      continue;
    }
    statuses[section.id] = resolveBasicClientInfoSectionStatus(form, section);
  }

  return statuses;
}
