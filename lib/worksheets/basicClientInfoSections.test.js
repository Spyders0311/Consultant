import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BASIC_CLIENT_INFO_SECTIONS,
  buildBasicClientInfoSectionStatuses,
  resolveBasicClientInfoSectionStatus,
} from './basicClientInfoSections.js';

test('basic client info defines seven accordion sections', () => {
  assert.equal(BASIC_CLIENT_INFO_SECTIONS.length, 7);
});

test('resolveBasicClientInfoSectionStatus marks identity complete when name and industry set', () => {
  const section = BASIC_CLIENT_INFO_SECTIONS.find((entry) => entry.id === 'company-identity');
  assert.ok(section);

  const status = resolveBasicClientInfoSectionStatus(
    { companyName: 'Acme', industry: 'Services', entityType: '', ein: '' },
    section,
  );
  assert.equal(status, 'complete');
});

test('buildBasicClientInfoSectionStatuses marks review complete after saved run', () => {
  const statuses = buildBasicClientInfoSectionStatuses(
    { companyName: 'Acme', industry: 'Services' },
    true,
  );
  assert.equal(statuses.review, 'complete');
});
