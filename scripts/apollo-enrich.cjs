#!/usr/bin/env node

const fs = require('fs');
const { loadLocalEnv, requireEnv } = require('./zoho-env.cjs');

loadLocalEnv();

const APOLLO_API_BASE = process.env.APOLLO_API_BASE || 'https://api.apollo.io/api/v1';

async function apolloFetch(path, body) {
  const response = await fetch(`${APOLLO_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'x-api-key': requireEnv('APOLLO_API_KEY'),
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Apollo API ${path} failed: ${JSON.stringify(json)}`);
  }
  return json;
}

function readInput() {
  const file = process.argv[2];
  if (!file) {
    throw new Error('Usage: node scripts/apollo-enrich.cjs person.json');
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function buildPayload(input) {
  return {
    id: input.apolloId || input.id,
    first_name: input.firstName,
    last_name: input.lastName,
    name: input.name,
    email: input.email,
    organization_name: input.organizationName || input.company,
    domain: input.domain,
    linkedin_url: input.linkedinUrl || input.linkedin_url,
    reveal_personal_emails: input.revealPersonalEmails === true,
    reveal_phone_number: false,
  };
}

apolloFetch('/people/match', buildPayload(readInput()))
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
