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

function normalizePerson(person) {
  const organization = person.organization || person.account || {};
  return {
    apolloId: person.id,
    firstName: person.first_name,
    lastName: person.last_name,
    name: person.name,
    title: person.title,
    city: person.city,
    state: person.state,
    country: person.country,
    linkedinUrl: person.linkedin_url,
    emailStatus: person.email_status,
    organization: {
      id: organization.id,
      name: organization.name,
      websiteUrl: organization.website_url,
      domain: organization.primary_domain || organization.domain,
      estimatedNumEmployees: organization.estimated_num_employees,
      industry: organization.industry,
      keywords: organization.keywords,
    },
  };
}

async function searchPeople(query) {
  const page = query.page || 1;
  const perPage = Math.min(query.per_page || query.perPage || 25, 100);
  const payload = {
    ...query,
    page,
    per_page: perPage,
  };
  delete payload.perPage;

  const result = await apolloFetch('/mixed_people/api_search', payload);
  const people = result.people || result.contacts || result.mixed_people || [];
  return {
    page,
    perPage,
    totalEntries: result.pagination?.total_entries,
    totalPages: result.pagination?.total_pages,
    people: people.map(normalizePerson),
  };
}

function readQuery() {
  const file = process.argv[2];
  if (!file) {
    throw new Error('Usage: node scripts/apollo-search.cjs search-query.json');
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

searchPeople(readQuery())
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
