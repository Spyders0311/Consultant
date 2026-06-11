#!/usr/bin/env node

const { loadLocalEnv, requireEnv } = require('./zoho-env.cjs');

loadLocalEnv();

const REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || 'http://localhost:8787/zoho/oauth/callback';
const DEFAULT_SCOPE = [
  'ZohoCRM.modules.Leads.ALL',
  'ZohoCRM.modules.Contacts.READ',
  'ZohoCRM.modules.Tasks.CREATE',
  'ZohoCRM.modules.Notes.CREATE',
  'ZohoCRM.settings.fields.READ',
  'ZohoCRM.users.READ',
].join(',');

function accountsDomain() {
  return process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com';
}

async function exchangeCode(code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: requireEnv('ZOHO_CLIENT_ID'),
    client_secret: requireEnv('ZOHO_CLIENT_SECRET'),
    redirect_uri: REDIRECT_URI,
    code,
  });

  const response = await fetch(`${accountsDomain()}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(`Zoho token exchange failed: ${JSON.stringify(body)}`);
  }

  return body;
}

function printAuthUrl() {
  const params = new URLSearchParams({
    scope: process.env.ZOHO_SCOPES || DEFAULT_SCOPE,
    client_id: requireEnv('ZOHO_CLIENT_ID'),
    response_type: 'code',
    access_type: 'offline',
    redirect_uri: REDIRECT_URI,
    prompt: 'consent',
  });

  console.log(`${accountsDomain()}/oauth/v2/auth?${params.toString()}`);
}

async function main() {
  const [, , command, code] = process.argv;

  if (command === 'auth-url') {
    printAuthUrl();
    return;
  }

  if (command === 'exchange') {
    if (!code) {
      throw new Error('Usage: node scripts/zoho-oauth.cjs exchange "PASTE_CODE_HERE"');
    }
    const result = await exchangeCode(code);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error('Usage: node scripts/zoho-oauth.cjs auth-url | exchange "CODE"');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
