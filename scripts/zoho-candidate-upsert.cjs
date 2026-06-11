#!/usr/bin/env node

const fs = require('fs');
const { loadLocalEnv, requireEnv } = require('./zoho-env.cjs');

loadLocalEnv();

function apiDomain() {
  return process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
}

function accountsDomain() {
  return process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com';
}

async function getAccessToken() {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: requireEnv('ZOHO_CLIENT_ID'),
    client_secret: requireEnv('ZOHO_CLIENT_SECRET'),
    refresh_token: requireEnv('ZOHO_REFRESH_TOKEN'),
  });

  const response = await fetch(`${accountsDomain()}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const body = await response.json();
  if (!response.ok || body.error || !body.access_token) {
    throw new Error(`Zoho access token request failed: ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

async function zohoFetch(accessToken, path, options = {}) {
  const response = await fetch(`${apiDomain()}/crm/v8${path}`, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Zoho API ${path} failed: ${JSON.stringify(body)}`);
  }
  return body;
}

function escapeCriteriaValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\)/g, '\\)');
}

async function findByEmail(accessToken, moduleName, email) {
  const criteria = encodeURIComponent(`(Email:equals:${escapeCriteriaValue(email)})`);
  const result = await zohoFetch(accessToken, `/${moduleName}/search?criteria=${criteria}`);
  return result.data?.[0] || null;
}

function requireCandidate(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('Candidate JSON must be an object');
  }
  if (!candidate.email) {
    throw new Error('Candidate must include email');
  }
  if (!candidate.lastName && !candidate.firstName) {
    throw new Error('Candidate must include firstName or lastName');
  }
}

function buildLead(candidate) {
  const ownerId = candidate.ownerId || process.env.ZOHO_LEAD_OWNER_ID;
  const lead = {
    First_Name: candidate.firstName || undefined,
    Last_Name: candidate.lastName || candidate.firstName,
    Email: candidate.email,
    Company: candidate.company || process.env.ZOHO_DEFAULT_COMPANY || 'Independent Consultant Candidate',
    Designation: candidate.title || undefined,
    Lead_Source: candidate.leadSource || process.env.ZOHO_DEFAULT_LEAD_SOURCE || 'Web Research',
    Website: candidate.profileUrl || undefined,
    Description: [
      candidate.rationale ? `Fit rationale: ${candidate.rationale}` : null,
      candidate.outreachAngle ? `Outreach angle: ${candidate.outreachAngle}` : null,
      candidate.linkedinNote ? `Manual LinkedIn note: ${candidate.linkedinNote}` : null,
      Number.isFinite(candidate.score) ? `Candidate score: ${candidate.score}` : null,
      candidate.fitTier ? `Fit tier: ${candidate.fitTier}` : null,
    ].filter(Boolean).join('\n\n'),
    Owner: ownerId ? { id: ownerId } : undefined,
  };

  return Object.fromEntries(Object.entries(lead).filter(([, value]) => value !== undefined && value !== ''));
}

async function createLead(accessToken, candidate) {
  const lead = buildLead(candidate);
  const result = await zohoFetch(accessToken, '/Leads', {
    method: 'POST',
    body: JSON.stringify({ data: [lead], trigger: ['workflow'] }),
  });
  const created = result.data?.[0];
  if (created?.status !== 'success') {
    throw new Error(`Lead create failed: ${JSON.stringify(result)}`);
  }
  return created.details.id;
}

async function createNote(accessToken, leadId, candidate) {
  const noteTitle = `Codex sourcing score: ${candidate.fitTier || candidate.score || 'reviewed'}`;
  const noteContent = [
    candidate.rationale,
    candidate.outreachAngle ? `Outreach angle: ${candidate.outreachAngle}` : null,
    candidate.linkedinNote ? `LinkedIn manual note: ${candidate.linkedinNote}` : null,
    candidate.profileUrl ? `Source/profile: ${candidate.profileUrl}` : null,
  ].filter(Boolean).join('\n\n');

  if (!noteContent) return null;

  return zohoFetch(accessToken, '/Notes', {
    method: 'POST',
    body: JSON.stringify({
      data: [{
        Note_Title: noteTitle,
        Note_Content: noteContent,
        Parent_Id: leadId,
        se_module: 'Leads',
      }],
    }),
  });
}

async function createTask(accessToken, leadId, candidate) {
  const ownerId = candidate.taskOwnerId || candidate.ownerId || process.env.ZOHO_LEAD_OWNER_ID;
  const task = {
    Subject: `Review candidate outreach: ${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
    What_Id: { id: leadId },
    $se_module: 'Leads',
    Status: 'Not Started',
    Priority: candidate.fitTier?.startsWith('A') ? 'High' : 'Normal',
    Description: [
      candidate.outreachAngle ? `Recommended email angle: ${candidate.outreachAngle}` : null,
      candidate.linkedinNote ? `Optional manual LinkedIn note: ${candidate.linkedinNote}` : null,
      candidate.rationale ? `Why this candidate: ${candidate.rationale}` : null,
    ].filter(Boolean).join('\n\n'),
    Owner: ownerId ? { id: ownerId } : undefined,
  };

  return zohoFetch(accessToken, '/Tasks', {
    method: 'POST',
    body: JSON.stringify({
      data: [Object.fromEntries(Object.entries(task).filter(([, value]) => value !== undefined && value !== ''))],
      trigger: ['workflow'],
    }),
  });
}

async function upsertCandidate(candidate) {
  requireCandidate(candidate);
  const accessToken = await getAccessToken();

  const existingContact = await findByEmail(accessToken, 'Contacts', candidate.email);
  if (existingContact) {
    return {
      ok: true,
      action: 'skipped_existing_contact',
      module: 'Contacts',
      id: existingContact.id,
      email: candidate.email,
    };
  }

  const existingLead = await findByEmail(accessToken, 'Leads', candidate.email);
  const leadId = existingLead?.id || await createLead(accessToken, candidate);

  await createNote(accessToken, leadId, candidate);
  await createTask(accessToken, leadId, candidate);

  return {
    ok: true,
    action: existingLead ? 'updated_existing_lead_with_note_and_task' : 'created_lead_with_note_and_task',
    module: 'Leads',
    id: leadId,
    email: candidate.email,
  };
}

function readCandidate() {
  const file = process.argv[2];
  if (file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return JSON.parse(fs.readFileSync(0, 'utf8'));
}

upsertCandidate(readCandidate())
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
