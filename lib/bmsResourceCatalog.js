import canonicalCatalog from '@/knowledge/workbooks/canonical_sources.json';
import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import { isLive } from '@/lib/worksheets/registry';

const sectionLabels = {
  marketing: 'Marketing',
  analysis: 'Analysis',
  'analyst-wizard': 'Analyst Wizard',
  consulting: 'Consulting',
  'invoice-billing': 'Invoice / Billing',
  'bms-forms': 'BMS Forms',
};

const sectionDescriptions = {
  marketing: 'Sales, pipeline, pricing, forecast, campaign, and top-of-funnel planning resources.',
  analysis: 'Financial calculators, budgets, cash flow, profitability, labor, job costing, and dashboard worksheets.',
  'analyst-wizard': 'Core analyst workbook sheets and source materials that feed the guided BMS diagnostic flow.',
  consulting: 'Engagement planning, operating procedures, management tools, recommendations, and delivery templates.',
  'invoice-billing': 'Invoices, payment methods, expense reports, retainers, AR, and billing follow-up resources.',
  'bms-forms': 'Client-facing forms, agreements, surveys, questionnaires, policies, and reusable document templates.',
};

function normalizeSearchText(value) {
  return String(value || '').toLowerCase();
}

function getBaseName(relPath) {
  const fileName = String(relPath || '').split('/').pop() || '';
  return fileName.replace(/\.[^.]+$/, '');
}

function titleize(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyGroup(sectionKey, resource) {
  const text = normalizeSearchText(`${resource.title} ${resource.relPath}`);

  if (sectionKey === 'analysis') {
    if (/(cash flow|receivable|payable|credit card|ar turns|working capital)/.test(text)) return 'Cash Flow & Working Capital';
    if (/(budget|variance|forecast 5|flex)/.test(text)) return 'Budgeting & Forecasting';
    if (/(breakeven|break even|profit|p&l|balance sheet|z score|ratio|dashboard|kpi)/.test(text)) return 'Financial Analysis';
    if (/(labor|employee productivity|job costing|estimating|cost|overhead|inventory)/.test(text)) return 'Costing & Productivity';
    return 'Other Financial Tools';
  }

  if (sectionKey === 'marketing') {
    if (/(pipeline|forecast|front end sales|sales revenues|sales orders)/.test(text)) return 'Forecasts & Pipeline';
    if (/(price|pricing|commission|sales training|boot camp)/.test(text)) return 'Sales Enablement';
    return 'Marketing Planning';
  }

  if (sectionKey === 'consulting') {
    if (/(project plan|progress report|recommendation|current position)/.test(text)) return 'Engagement Delivery';
    if (/(operations manual|standard cost control|warehouse|warehousing|control variables|building blocks)/.test(text)) return 'Operating Procedures';
    if (/(job description|employee|organizational|leadership|management|tasks|duties|position guide)/.test(text)) return 'People & Management';
    return 'Consulting Reference';
  }

  if (sectionKey === 'invoice-billing') {
    if (/(invoice|retainer|billing)/.test(text)) return 'Invoices & Retainers';
    if (/(payment|payable|receivable|credit card|expense)/.test(text)) return 'Payments & AR';
    return 'Billing Support';
  }

  if (sectionKey === 'bms-forms') {
    if (/(agreement|confidential|non-disclosure|addendum|assurance)/.test(text)) return 'Agreements & Legal';
    if (/(questionnaire|survey|perception)/.test(text)) return 'Questionnaires & Surveys';
    if (/(handbook|policy|job description|travel|commitments)/.test(text)) return 'Policies & HR Forms';
    return 'General Forms';
  }

  if (sectionKey === 'analyst-wizard') {
    if (resource.status === 'Live') return 'Live Guided Worksheets';
    if (resource.kind === 'Worksheet') return 'Additional Workbook Sheets';
    return 'Analyst Source Documents';
  }

  return 'Resources';
}

function sourceHref(source, clientId) {
  return source.porting?.appRoute ? source.porting.appRoute.replace('[clientId]', clientId) : null;
}

function inferStatus(source, href) {
  if (href) return 'Live';
  if (source.access?.reviewRequired) return 'Review First';
  if (source.workbook?.parseWarning) return 'Needs Access';
  if (source.porting?.priority === 'next') return 'Port Next';
  if (source.porting?.priority === 'candidate') return 'Ready to Port';
  if (source.businessArea === 'bms-forms' && source.sourceType === 'document') return 'Template Candidate';
  return 'Mapped Source';
}

function sourceKind(source) {
  if (source.sourceType === 'workbook') return 'Workbook';
  if (source.sourceType === 'deck') return 'Deck';
  return 'Document';
}

function sourcePreview(source) {
  if (source.access?.previewAllowed && source.document?.textSample) {
    return {
      label: 'Text Preview',
      text: source.document.textSample,
    };
  }

  if (source.workbook?.usefulSheets?.length) {
    return {
      label: 'Workbook Manifest',
      sheets: source.workbook.usefulSheets,
    };
  }

  return null;
}

function toResource(source, clientId) {
  const href = sourceHref(source, clientId);
  const formulaCount = source.workbook?.formulaCount || 0;
  const sheetCount = source.workbook?.sheetCount || 0;
  const wordCount = source.document?.wordCountApprox || 0;
  const reviewReasons = source.access?.reviewReasons || [];
  const portPriority = source.porting?.priority;

  return {
    id: source.key,
    sourceKey: source.key,
    title: source.title || titleize(getBaseName(source.canonicalPath)),
    relPath: source.canonicalPath,
    extension: source.extension,
    kind: sourceKind(source),
    status: inferStatus(source, href),
    sectionKey: source.businessArea,
    duplicateCount: source.duplicateCount || 0,
    href,
    downloadHref: source.access?.downloadAllowed ? `/api/resources/${source.key}/download` : null,
    access: source.access,
    tags: source.tags || [],
    preview: sourcePreview(source),
    porting: source.porting,
    groupTitle: null,
    metrics: [
      sheetCount ? `${sheetCount} sheet${sheetCount === 1 ? '' : 's'}` : null,
      formulaCount ? `${formulaCount.toLocaleString()} formulas` : null,
      wordCount ? `${wordCount.toLocaleString()} words` : null,
      source.workbook?.hasVbaProject ? 'VBA detected' : null,
      source.workbook?.externalReferenceCount ? `${source.workbook.externalReferenceCount} external refs` : null,
      portPriority === 'next' ? 'Port next' : null,
      reviewReasons.length ? `Review: ${reviewReasons.join(', ')}` : null,
      source.workbook?.parseWarning || null,
    ].filter(Boolean),
  };
}

function worksheetResource(entry, clientId) {
  return {
    id: entry.key,
    title: entry.sheetName,
    relPath: 'Analyst workbook manifest',
    extension: 'sheet',
    kind: 'Worksheet',
    status: isLive(entry.key) ? 'Live' : 'Coming Soon',
    sectionKey: 'analyst-wizard',
    duplicateCount: 0,
    href: `/workspace/${clientId}/analyst-wizard/sheets/${entry.key}`,
    metrics: [entry.priorityRank > 0 ? 'Core worksheet' : 'Workbook sheet'],
  };
}

function sortResources(left, right) {
  const statusOrder = {
    Live: 0,
    'Port Next': 1,
    'Ready to Port': 2,
    'Template Candidate': 3,
    'Mapped Source': 4,
    'Review First': 5,
    'Needs Access': 6,
    'Coming Soon': 7,
  };

  const leftRank = statusOrder[left.status] ?? 10;
  const rightRank = statusOrder[right.status] ?? 10;
  if (leftRank !== rightRank) return leftRank - rightRank;
  return left.title.localeCompare(right.title);
}

function toGroups(sectionKey, resources) {
  const groupsByTitle = new Map();

  for (const resource of resources) {
    const groupTitle = classifyGroup(sectionKey, resource);
    if (!groupsByTitle.has(groupTitle)) {
      groupsByTitle.set(groupTitle, []);
    }
    groupsByTitle.get(groupTitle).push(resource);
  }

  return Array.from(groupsByTitle.entries())
    .map(([title, groupResources]) => ({
      title,
      resources: groupResources.sort(sortResources),
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function getResourceSection(sectionKey, clientId) {
  const resources = (canonicalCatalog.sources || [])
    .map((source) => toResource(source, clientId))
    .filter((resource) => resource.sectionKey === sectionKey);

  if (sectionKey === 'analyst-wizard') {
    resources.unshift(...worksheetCatalog.map((entry) => worksheetResource(entry, clientId)));
  }

  for (const resource of resources) {
    resource.groupTitle = classifyGroup(sectionKey, resource);
  }

  const totalDuplicates = resources.reduce((sum, resource) => sum + resource.duplicateCount, 0);
  const liveCount = resources.filter((resource) => resource.status === 'Live').length;
  const readyCount = resources.filter((resource) =>
    ['Port Next', 'Ready to Port', 'Template Candidate'].includes(resource.status),
  ).length;
  const reviewRequiredCount = resources.filter((resource) => resource.access?.reviewRequired).length;
  const downloadableCount = resources.filter((resource) => resource.downloadHref).length;

  return {
    key: sectionKey,
    label: sectionLabels[sectionKey] || titleize(sectionKey),
    description: sectionDescriptions[sectionKey] || '',
    resources: resources.sort(sortResources),
    groups: toGroups(sectionKey, resources),
    stats: {
      resources: resources.length,
      live: liveCount,
      ready: readyCount,
      duplicateSources: totalDuplicates,
      reviewRequired: reviewRequiredCount,
      downloadable: downloadableCount,
    },
  };
}
