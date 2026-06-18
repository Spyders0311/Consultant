import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import { WORKBOOK_PORT_CONFIGS } from '@/lib/workbookPortConfigs';

/** @typedef {{ label: string, href?: string }} BreadcrumbSegment */

const SECTION_LABELS = {
  overview: 'Overview',
  'analyst-wizard': 'Analyst Wizard',
  analysis: 'Analysis',
  marketing: 'Marketing',
  consulting: 'Consulting',
  'invoice-billing': 'Invoice/Billing',
  'bms-forms': 'BMS Forms',
};

const catalogByKey = new Map(worksheetCatalog.map((entry) => [entry.key, entry]));

/**
 * @param {string} sheetKey
 * @returns {string}
 */
export function resolveWorksheetSheetName(sheetKey) {
  const catalogEntry = catalogByKey.get(sheetKey);
  if (catalogEntry?.sheetName) {
    return catalogEntry.sheetName;
  }
  const portTitle = WORKBOOK_PORT_CONFIGS[sheetKey]?.title;
  if (portTitle) {
    return portTitle;
  }
  return sheetKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Build workspace breadcrumb segments after the client name.
 *
 * @param {string} pathname
 * @returns {BreadcrumbSegment[]}
 */
export function resolveWorkspaceBreadcrumbTrail(pathname) {
  const match = pathname.match(/^\/workspace\/([^/]+)(?:\/(.*))?$/);
  if (!match) {
    return [];
  }

  const clientId = match[1];
  const rest = match[2] || '';
  const base = `/workspace/${clientId}`;

  if (!rest) {
    return [];
  }

  const segments = rest.split('/').filter(Boolean);
  const section = segments[0];

  if (section === 'overview') {
    return [{ label: SECTION_LABELS.overview }];
  }

  if (section === 'analyst-wizard') {
    const hubHref = `${base}/analyst-wizard`;

    if (segments.length === 1) {
      return [{ label: SECTION_LABELS['analyst-wizard'] }];
    }

    if (segments[1] === 'guided-intake') {
      return [
        { label: SECTION_LABELS['analyst-wizard'], href: hubHref },
        { label: 'Guided Intake' },
      ];
    }

    if (segments[1] === 'sheets' && segments[2]) {
      return [
        { label: SECTION_LABELS['analyst-wizard'], href: hubHref },
        { label: resolveWorksheetSheetName(segments[2]) },
      ];
    }

    return [{ label: SECTION_LABELS['analyst-wizard'] }];
  }

  const sectionLabel = SECTION_LABELS[section];
  if (sectionLabel) {
    return [{ label: sectionLabel }];
  }

  return [];
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isAnalystWorkspaceSection(pathname) {
  return /\/workspace\/[^/]+\/(overview|analyst-wizard)(\/|$)/.test(pathname);
}
