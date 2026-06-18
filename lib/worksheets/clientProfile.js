/**
 * @typedef {Object} BasicClientInfoForm
 * @property {string} companyName
 * @property {string} industry
 * @property {string} entityType
 * @property {string} ein
 * @property {string} addressLine1
 * @property {string} addressLine2
 * @property {string} locationCity
 * @property {string} locationState
 * @property {string} addressPostalCode
 * @property {string} primaryContactName
 * @property {string} primaryContactEmail
 * @property {string} primaryContactPhone
 * @property {string} ownerName
 * @property {string} ownerTitle
 * @property {string} ownershipNotes
 * @property {string} cpaName
 * @property {string} cpaFirm
 * @property {string} cpaEmail
 * @property {string} cpaPhone
 * @property {string} attorneyName
 * @property {string} attorneyFirm
 * @property {string} attorneyEmail
 * @property {string} attorneyPhone
 * @property {string} bankerName
 * @property {string} bankerInstitution
 * @property {string} bankerEmail
 * @property {string} bankerPhone
 * @property {string} notes
 */

function cleanText(value) {
  return String(value ?? '').trim();
}

function readPartner(profile, role) {
  const partner = profile?.professionalPartners?.[role];
  if (!partner || typeof partner !== 'object') {
    return { name: '', firm: '', email: '', phone: '', institution: '' };
  }
  return {
    name: partner.name || '',
    firm: partner.firm || partner.institution || '',
    email: partner.email || '',
    phone: partner.phone || '',
    institution: partner.institution || partner.firm || '',
  };
}

/**
 * @param {Record<string, unknown>|null|undefined} client
 * @returns {BasicClientInfoForm}
 */
export function mapClientRowToBasicClientInfoForm(client) {
  if (!client) {
    return emptyBasicClientInfoForm();
  }

  const profile =
    client.client_profile && typeof client.client_profile === 'object' ? client.client_profile : {};
  const ownership =
    profile.ownership && typeof profile.ownership === 'object' ? profile.ownership : {};
  const cpa = readPartner(profile, 'cpa');
  const attorney = readPartner(profile, 'attorney');
  const banker = readPartner(profile, 'banker');

  return {
    companyName: client.company_name || '',
    industry: client.industry || '',
    entityType: client.entity_type || '',
    ein: client.ein || '',
    addressLine1: client.address_line1 || '',
    addressLine2: client.address_line2 || '',
    locationCity: client.location_city || '',
    locationState: client.location_state || '',
    addressPostalCode: client.address_postal_code || '',
    primaryContactName: client.primary_contact_name || '',
    primaryContactEmail: client.primary_contact_email || '',
    primaryContactPhone: client.primary_contact_phone || '',
    ownerName: ownership.ownerName || '',
    ownerTitle: ownership.ownerTitle || '',
    ownershipNotes: ownership.notes || '',
    cpaName: cpa.name,
    cpaFirm: cpa.firm,
    cpaEmail: cpa.email,
    cpaPhone: cpa.phone,
    attorneyName: attorney.name,
    attorneyFirm: attorney.firm,
    attorneyEmail: attorney.email,
    attorneyPhone: attorney.phone,
    bankerName: banker.name,
    bankerInstitution: banker.institution,
    bankerEmail: banker.email,
    bankerPhone: banker.phone,
    notes: client.profile_notes || '',
  };
}

/**
 * @returns {BasicClientInfoForm}
 */
export function emptyBasicClientInfoForm() {
  return mapClientRowToBasicClientInfoForm(null);
}

/**
 * Payload accepted by the Python basic-client-info calculator.
 * @param {BasicClientInfoForm} form
 */
export function buildBasicClientInfoCalculationPayload(form) {
  return {
    companyName: cleanText(form.companyName),
    industry: cleanText(form.industry),
    primaryContactName: cleanText(form.primaryContactName),
    primaryContactEmail: cleanText(form.primaryContactEmail),
    primaryContactPhone: cleanText(form.primaryContactPhone),
    locationCity: cleanText(form.locationCity),
    locationState: cleanText(form.locationState),
    notes: cleanText(form.notes),
  };
}

/**
 * @param {BasicClientInfoForm} form
 */
export function buildClientProfilePatchFromBasicClientInfo(form) {
  const patch = {
    company_name: cleanText(form.companyName) || undefined,
    industry: cleanText(form.industry) || undefined,
    ein: cleanText(form.ein) || null,
    entity_type: cleanText(form.entityType) || null,
    address_line1: cleanText(form.addressLine1) || null,
    address_line2: cleanText(form.addressLine2) || null,
    location_city: cleanText(form.locationCity) || null,
    location_state: cleanText(form.locationState) || null,
    address_postal_code: cleanText(form.addressPostalCode) || null,
    primary_contact_name: cleanText(form.primaryContactName) || null,
    primary_contact_email: cleanText(form.primaryContactEmail) || null,
    primary_contact_phone: cleanText(form.primaryContactPhone) || null,
    profile_notes: cleanText(form.notes) || null,
    client_profile: {
      ownership: {
        ownerName: cleanText(form.ownerName),
        ownerTitle: cleanText(form.ownerTitle),
        notes: cleanText(form.ownershipNotes),
      },
      professionalPartners: {
        cpa: {
          name: cleanText(form.cpaName),
          firm: cleanText(form.cpaFirm),
          email: cleanText(form.cpaEmail),
          phone: cleanText(form.cpaPhone),
        },
        attorney: {
          name: cleanText(form.attorneyName),
          firm: cleanText(form.attorneyFirm),
          email: cleanText(form.attorneyEmail),
          phone: cleanText(form.attorneyPhone),
        },
        banker: {
          name: cleanText(form.bankerName),
          institution: cleanText(form.bankerInstitution),
          email: cleanText(form.bankerEmail),
          phone: cleanText(form.bankerPhone),
        },
      },
    },
  };

  if (!patch.company_name) delete patch.company_name;
  if (!patch.industry) delete patch.industry;

  return patch;
}

/**
 * @param {Record<string, unknown>|null|undefined} existingProfile
 * @param {Record<string, unknown>|null|undefined} nextProfile
 */
export function mergeClientProfile(existingProfile, nextProfile) {
  const existing =
    existingProfile && typeof existingProfile === 'object' ? existingProfile : {};
  const next = nextProfile && typeof nextProfile === 'object' ? nextProfile : {};

  return {
    ...existing,
    ...next,
    ownership: {
      ...(existing.ownership && typeof existing.ownership === 'object' ? existing.ownership : {}),
      ...(next.ownership && typeof next.ownership === 'object' ? next.ownership : {}),
    },
    professionalPartners: {
      ...(existing.professionalPartners && typeof existing.professionalPartners === 'object'
        ? existing.professionalPartners
        : {}),
      ...(next.professionalPartners && typeof next.professionalPartners === 'object'
        ? next.professionalPartners
        : {}),
    },
  };
}
