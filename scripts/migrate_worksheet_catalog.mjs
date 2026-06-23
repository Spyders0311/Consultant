#!/usr/bin/env node
/**
 * Phase 0 catalog metadata migration.
 * Adds hubCategory, integrationStatus, description, and coreRank;
 * removes legacy priorityRank.
 *
 * Usage: node scripts/migrate_worksheet_catalog.mjs [--check]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateCatalogEntry } from '../lib/worksheets/catalogMetadata.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, '..', 'knowledge', 'workbooks', 'worksheet_catalog.json');
const checkOnly = process.argv.includes('--check');

function main() {
  const raw = readFileSync(CATALOG_PATH, 'utf8');
  const catalog = JSON.parse(raw);
  const migrated = catalog.map(migrateCatalogEntry);

  const legacyKeys = catalog.filter((entry) => 'priorityRank' in entry);
  if (legacyKeys.length > 0 && migrated.every((entry) => !('priorityRank' in entry))) {
    // expected after migration
  }

  const integrated = migrated.filter((entry) => entry.integrationStatus !== 'planned');
  const core = migrated.filter((entry) => entry.coreRank != null);
  const deprecated = migrated.filter((entry) => entry.integrationStatus === 'deprecated');

  if (deprecated.length !== 3) {
    console.warn(`Expected 3 deprecated worksheets, found ${deprecated.length}`);
  }
  if (core.length !== 7) {
    console.warn(`Expected 7 coreRank worksheets, found ${core.length}`);
  }

  const output = `${JSON.stringify(migrated, null, 2)}\n`;

  if (checkOnly) {
    const normalizedRaw = raw.endsWith('\n') ? raw : `${raw}\n`;
    if (output !== normalizedRaw) {
      console.error('Catalog is out of date. Run: npm run migrate:worksheet-catalog');
      process.exit(1);
    }
    console.log('Catalog metadata is up to date.');
    return;
  }

  writeFileSync(CATALOG_PATH, output, 'utf8');
  console.log(`Migrated ${migrated.length} catalog entries → ${CATALOG_PATH}`);
  console.log(`  integrated: ${integrated.length} (native + derived)`);
  console.log(`  coreRank: ${core.length}`);
  console.log(`  planned: ${migrated.length - integrated.length}`);
}

main();
