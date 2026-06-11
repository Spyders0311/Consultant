const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const workbookAuditPath = path.join(rootDir, 'knowledge', 'workbooks', 'spreadsheets_folder_audit.json');
const documentAuditPath = path.join(rootDir, 'knowledge', 'workbooks', 'documents_folder_audit.json');
const outputPath = path.join(rootDir, 'knowledge', 'workbooks', 'canonical_sources.json');

const workbookExtensions = new Set(['.xls', '.xlsx', '.xlsm', '.xlsb', '.csv']);
const documentExtensions = new Set(['.doc', '.docx', '.pdf', '.pptx']);

const implementedWorkbookRoutes = {
  'bms-marketing-forecast': {
    match: /bms marketing forecast/i,
    title: 'BMS Marketing Forecast',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/bms-marketing-forecast',
    calculationEndpoint: '/api/worksheets/workbook-ports/calculate',
  },
  'dashboard-gantt-chart': {
    match: /f[-\s]*1600d/i,
    title: 'Dashboard Gantt Chart',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/dashboard-gantt-chart',
    calculationEndpoint: '/api/worksheets/workbook-ports/calculate',
  },
  'flex-budget-worksheet': {
    match: /f-700a|flex budget worksheet/i,
    title: 'Flex Budget Worksheet',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/flex-budget-worksheet',
    calculationEndpoint: '/api/worksheets/workbook-ports/calculate',
  },
  'sales-pipeline-forecast': {
    match: /f-700e|sales pipeline forecast/i,
    title: 'Sales Pipeline Forecast',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/sales-pipeline-forecast',
    calculationEndpoint: '/api/worksheets/workbook-ports/calculate',
  },
  'cash-flow-forecast-worksheet': {
    match: /f-900a|cash flow forecast worksheet/i,
    title: 'Cash Flow Forecast Worksheet',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/cash-flow-forecast-worksheet',
    calculationEndpoint: '/api/worksheets/workbook-ports/calculate',
  },
  'weekly-cash-flow': {
    match: /f-900b\s*-\s*cash flow spreadsheet/i,
    title: 'Weekly Cash Flow Forecast',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/weekly-cash-flow',
    calculationEndpoint: '/api/worksheets/weekly-cash-flow/calculate',
  },
  'flexible-budget-variance': {
    match: /f-700d|advanced flex budget|variance/i,
    title: 'Flexible Budget / Variance',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/flexible-budget-variance',
    calculationEndpoint: '/api/worksheets/flexible-budget-variance/calculate',
  },
  'f-1200-ar-turns': {
    match: /f[-\s]*1200|ar turns worksheet/i,
    title: 'F-1200 AR Turns Worksheet',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/f-1200-ar-turns',
    calculationEndpoint: '/api/worksheets/workbook-ports/calculate',
  },
  'inventory-turn-calculation': {
    match: /inventory turn calculation/i,
    title: 'Inventory Turn Calculation',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/inventory-turn-calculation',
    calculationEndpoint: '/api/worksheets/workbook-ports/calculate',
  },
  'cost-vs-sales-increase': {
    match: /cost vs sales increase/i,
    title: 'Cost vs Sales Increase',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/cost-vs-sales-increase',
    calculationEndpoint: '/api/worksheets/workbook-ports/calculate',
  },
  'f-300a-overhead-calcs': {
    match: /f[-\s]*300a|overhead calcs/i,
    title: 'F-300a Overhead Calcs',
    appRoute: '/workspace/[clientId]/analyst-wizard/sheets/f-300a-overhead-calcs',
    calculationEndpoint: '/api/worksheets/workbook-ports/calculate',
  },
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function titleize(value) {
  return String(value || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function isWorkbook(record) {
  return workbookExtensions.has(normalizeText(record.ext));
}

function isDocument(record) {
  return documentExtensions.has(normalizeText(record.ext));
}

function classifyBusinessArea(record, documentMeta) {
  const haystack = normalizeText(
    `${record.relPath} ${record.fileName} ${record.family || ''} ${(documentMeta?.keywordHits || []).join(' ')}`,
  );

  if (/(invoice|billing|bill |retainer|expense report|method of payment|payment|payables|receivables|credit card)/.test(haystack)) {
    return 'invoice-billing';
  }
  if (/(marketing|sales pipeline|sales forecast|front end sales|sales training|ways to price|commission|lead source|campaign|pricing)/.test(haystack)) {
    return 'marketing';
  }
  if (/(agreement|confidential|non-disclosure|questionnaire|survey|handbook|travel profile|commitments|opening questionnaire|perception survey|policy|assurance|addendum|form|cover sheet|hotel of record)/.test(haystack)) {
    return 'bms-forms';
  }
  if (/(project plan|progress report|recommendation|operations manual|standard cost control|warehouse|warehousing|leadership|management|organizational|job description|employee productivity|tasks|duties|position guide|control variables|current position|building blocks)/.test(haystack)) {
    return 'consulting';
  }
  if (
    isWorkbook(record) ||
    /(cash flow|breakeven|break even|balance sheet|p&l|profit|budget|forecast|variance|dashboard|kpi|labor burden|job costing|cost|overhead|inventory turn|ar turns|z score|financial)/.test(haystack)
  ) {
    return 'analysis';
  }
  if (normalizeText(record.category) === 'analyst-documents') {
    return 'analyst-wizard';
  }

  return 'consulting';
}

function getReviewReasons(record, documentMeta) {
  const haystack = normalizeText(
    `${record.relPath} ${record.fileName} ${(documentMeta?.keywordHits || []).join(' ')} ${documentMeta?.textSample || ''}`,
  );
  const reasons = [];

  if (/(confidential|non-disclosure|nda|executive eyes only)/.test(haystack)) {
    reasons.push('Confidential content');
  }
  if (/(agreement|contract|addendum|assurance|working agreement|method of payment|retainer)/.test(haystack)) {
    reasons.push('Legal or commercial terms');
  }
  if (/(commission|pricing schedule|payment method|credit card)/.test(haystack)) {
    reasons.push('Sensitive pricing or payment detail');
  }
  if (documentMeta?.parseWarning) {
    reasons.push(documentMeta.parseWarning);
  }

  return [...new Set(reasons)];
}

function getImplementedRoute(title, relPath) {
  const haystack = `${title} ${relPath}`;

  for (const [key, config] of Object.entries(implementedWorkbookRoutes)) {
    if (config.match.test(haystack)) {
      return { key, ...config };
    }
  }

  return null;
}

function getPortPriority(workbookMeta, implementedRoute) {
  if (!workbookMeta) return null;
  if (implementedRoute) return 'live';
  if (workbookMeta.parseWarning) return 'blocked';
  if ((workbookMeta.formulaCount || 0) >= 1000) return 'next';
  if ((workbookMeta.formulaCount || 0) > 0) return 'candidate';
  return 'reference';
}

function usefulSheets(workbookMeta) {
  return (workbookMeta?.sheets || [])
    .filter((sheet) => sheet.name && sheet.hidden !== 2)
    .sort((left, right) => {
      const rightScore = (right.formulaCount || 0) + (right.valueCellCount || 0) / 1000;
      const leftScore = (left.formulaCount || 0) + (left.valueCellCount || 0) / 1000;
      return rightScore - leftScore;
    })
    .slice(0, 8)
    .map((sheet) => ({
      name: sheet.name,
      ref: sheet.ref,
      formulaCount: sheet.formulaCount || 0,
      labelSample: sheet.labelSample || [],
    }));
}

function sourceType(record) {
  if (isWorkbook(record)) return 'workbook';
  if (normalizeText(record.ext) === '.pptx') return 'deck';
  return 'document';
}

function chooseCanonicalRecord(records) {
  return [...records].sort((left, right) => {
    const leftScore = canonicalPathScore(left.relPath);
    const rightScore = canonicalPathScore(right.relPath);
    if (leftScore !== rightScore) return rightScore - leftScore;
    return left.relPath.localeCompare(right.relPath);
  })[0];
}

function canonicalPathScore(relPath) {
  const text = normalizeText(relPath);
  let score = 0;
  if (!text.includes('unzipped files')) score += 6;
  if (!text.includes('-20260423t')) score += 4;
  if (text.includes('/financial tools/')) score += 3;
  if (text.includes('/bms  analyst documents/')) score += 2;
  return score;
}

function toCanonicalSource(record, duplicateRecords, workbookByPath, documentByPath, rankByPath) {
  const title = titleize(record.fileName || path.basename(record.relPath));
  const workbookMeta = workbookByPath.get(record.relPath);
  const documentMeta = documentByPath.get(record.relPath);
  const implementedRoute = getImplementedRoute(title, record.relPath);
  const reviewReasons = getReviewReasons(record, documentMeta);
  const type = sourceType(record);
  const businessArea = classifyBusinessArea(record, documentMeta);
  const parseWarning = workbookMeta?.parseWarning || documentMeta?.parseWarning || null;
  const portPriority = getPortPriority(workbookMeta, implementedRoute);
  const sourceKey = `${slugify(implementedRoute?.key || title) || 'source'}-${String(record.sha256 || '').slice(0, 10)}`;
  const previewAllowed = type !== 'workbook' && reviewReasons.length === 0 && Boolean(documentMeta?.textSample);
  const downloadAllowed = reviewReasons.length === 0 && !parseWarning;

  return {
    key: sourceKey,
    title: implementedRoute?.title || title,
    businessArea,
    sourceType: type,
    canonicalPath: record.relPath,
    duplicatePaths: duplicateRecords.map((item) => item.relPath).filter((relPath) => relPath !== record.relPath),
    duplicateCount: Math.max(duplicateRecords.length - 1, 0),
    originalCategory: record.category || null,
    extension: normalizeText(record.ext),
    sizeBytes: record.sizeBytes || 0,
    sha256: record.sha256 || null,
    tags: [...new Set([businessArea, record.category, ...(documentMeta?.keywordHits || [])].filter(Boolean))],
    access: {
      audience: 'consultant',
      reviewRequired: reviewReasons.length > 0,
      reviewReasons,
      previewAllowed,
      downloadAllowed,
    },
    workbook: workbookMeta
      ? {
          sheetCount: workbookMeta.sheetCount || 0,
          formulaCount: workbookMeta.formulaCount || 0,
          valueCellCount: workbookMeta.valueCellCount || 0,
          definedNameCount: workbookMeta.definedNameCount || 0,
          hiddenSheetCount: workbookMeta.hiddenSheetCount || 0,
          hasVbaProject: Boolean(workbookMeta.hasVbaProject),
          externalReferenceCount: workbookMeta.externalReferenceCount || 0,
          crossSheetReferenceCount: workbookMeta.crossSheetReferenceCount || 0,
          parseWarning: workbookMeta.parseWarning || null,
          usefulSheets: usefulSheets(workbookMeta),
        }
      : null,
    document: documentMeta
      ? {
          wordCountApprox: documentMeta.wordCountApprox || 0,
          keywordHits: documentMeta.keywordHits || [],
          textSample: documentMeta.textSample || '',
          parseWarning: documentMeta.parseWarning || null,
        }
      : null,
    porting: workbookMeta
      ? {
          priority: portPriority,
          rank: rankByPath.get(record.relPath) || null,
          implementationStatus: implementedRoute ? 'live' : portPriority === 'blocked' ? 'blocked' : 'not-started',
          appRoute: implementedRoute?.appRoute || null,
          calculationEndpoint: implementedRoute?.calculationEndpoint || null,
          sourceManifest: 'knowledge/workbooks/spreadsheets_folder_audit.json',
          approach: 'Use workbook manifests for discovery, then rebuild required calculations in reviewed server-side worksheet modules with saved client runs.',
        }
      : null,
  };
}

function main() {
  const spreadsheetAudit = readJson(workbookAuditPath);
  const documentAudit = readJson(documentAuditPath);
  const workbookByPath = new Map((spreadsheetAudit.workbooks || []).map((workbook) => [workbook.relPath, workbook]));
  const documentByPath = new Map((documentAudit.documents || []).map((document) => [document.relPath, document]));
  const rankByPath = new Map(
    (spreadsheetAudit.workbookSummary?.topFormulaWorkbooks || []).map((workbook, index) => [workbook.relPath, index + 1]),
  );
  const duplicateGroups = new Map();

  for (const record of spreadsheetAudit.files || []) {
    if (!isWorkbook(record) && !isDocument(record)) continue;
    if (String(record.fileName || '').startsWith('~$')) continue;

    const duplicateKey = record.sha256 || record.relPath;
    if (!duplicateGroups.has(duplicateKey)) {
      duplicateGroups.set(duplicateKey, []);
    }
    duplicateGroups.get(duplicateKey).push(record);
  }

  const sources = Array.from(duplicateGroups.values())
    .map((records) => {
      const canonicalRecord = chooseCanonicalRecord(records);
      return toCanonicalSource(canonicalRecord, records, workbookByPath, documentByPath, rankByPath);
    })
    .sort((left, right) => left.businessArea.localeCompare(right.businessArea) || left.title.localeCompare(right.title));

  const totals = sources.reduce(
    (summary, source) => {
      summary.sources += 1;
      summary.duplicatesHidden += source.duplicateCount;
      summary.byBusinessArea[source.businessArea] = (summary.byBusinessArea[source.businessArea] || 0) + 1;
      summary.byType[source.sourceType] = (summary.byType[source.sourceType] || 0) + 1;
      if (source.access.reviewRequired) summary.reviewRequired += 1;
      if (source.access.downloadAllowed) summary.downloadAllowed += 1;
      if (source.porting?.priority === 'live') summary.liveWorkbookPorts += 1;
      if (source.porting?.priority === 'next') summary.nextWorkbookPorts += 1;
      return summary;
    },
    {
      sources: 0,
      duplicatesHidden: 0,
      reviewRequired: 0,
      downloadAllowed: 0,
      liveWorkbookPorts: 0,
      nextWorkbookPorts: 0,
      byBusinessArea: {},
      byType: {},
    },
  );

  const output = {
    generatedAt: new Date().toISOString(),
    generatedFrom: [
      'knowledge/workbooks/spreadsheets_folder_audit.json',
      'knowledge/workbooks/documents_folder_audit.json',
    ],
    notes: [
      'Canonical sources collapse exact duplicate files into one source of truth for each workbook/document family.',
      'Legal, commercial, payment, and confidential documents are review-required before preview or download.',
      'Macro-bearing workbooks are provenance and regression fixtures only. Production code ports required behavior into reviewed application logic.',
    ],
    totals,
    sources,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${sources.length} canonical sources to ${path.relative(rootDir, outputPath)}`);
}

main();
