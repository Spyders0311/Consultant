import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  formatClientBillTo,
  formatInvoiceDate,
  getInvoiceTitle,
  resolveInvoiceAmount,
} from '../worksheets/invoiceDocumentModel.js';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 48;
const FOOTER_Y = 34;
const HEADER_HEIGHT = 110;
const CONTENT_TOP = PAGE_HEIGHT - HEADER_HEIGHT - 28;
const CONTENT_BOTTOM = 60;
const LABEL_X = MARGIN_X;
const VALUE_X = 285;

function currency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function percent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function percentValue(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  return `${Number(value).toFixed(2)}%`;
}

function text(value) {
  if (value === null || value === undefined || value === '') return 'n/a';
  return String(value);
}

function consultantFooter(consultant = {}) {
  const parts = [`Prepared by: ${consultant?.name || 'Consultant'}`];
  if (consultant?.phone) parts.push(consultant.phone);
  if (consultant?.email) parts.push(consultant.email);
  return parts.join(' | ');
}

function drawPageChrome(page, fonts, { model, consultant }) {
  const { regular, bold } = fonts;
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: HEADER_HEIGHT,
    color: rgb(0.06, 0.09, 0.16),
  });

  const logoW = 96;
  const logoH = 36;
  const logoX = PAGE_WIDTH - logoW - MARGIN_X;
  const logoY = PAGE_HEIGHT - 72;
  page.drawRectangle({
    x: logoX,
    y: logoY,
    width: logoW,
    height: logoH,
    borderWidth: 1,
    borderColor: rgb(0.39, 0.45, 0.55),
  });
  page.drawText('[Logo]', {
    x: logoX + 26,
    y: logoY + 12,
    size: 10,
    font: regular,
    color: rgb(0.7, 0.75, 0.82),
  });

  page.drawText('BMS Portal Calculation Report', {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 54,
    size: 22,
    font: bold,
    color: rgb(0.96, 0.98, 1),
  });
  page.drawText(`Model: ${model} | Generated: ${new Date().toLocaleString('en-US')}`, {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 78,
    size: 10,
    font: regular,
    color: rgb(0.8, 0.84, 0.9),
  });

  page.drawLine({
    start: { x: 40, y: FOOTER_Y + 11 },
    end: { x: PAGE_WIDTH - 40, y: FOOTER_Y + 11 },
    thickness: 1,
    color: rgb(0.89, 0.91, 0.94),
  });
  page.drawText(consultantFooter(consultant), {
    x: MARGIN_X,
    y: FOOTER_Y,
    size: 9,
    font: regular,
    color: rgb(0.29, 0.35, 0.45),
  });
}

function drawHeading(page, fonts, label, y) {
  page.drawText(label, {
    x: MARGIN_X,
    y,
    size: 14,
    font: fonts.bold,
    color: rgb(0.2, 0.25, 0.34),
  });
  return y - 24;
}

function drawSummaryRow(page, fonts, label, value, y) {
  page.drawText(label, {
    x: LABEL_X,
    y,
    size: 11,
    font: fonts.bold,
    color: rgb(0.07, 0.1, 0.17),
  });
  page.drawText(value, {
    x: VALUE_X,
    y,
    size: 11,
    font: fonts.regular,
    color: rgb(0.12, 0.16, 0.23),
  });
  return y - 20;
}

function drawSimpleTable(page, fonts, { title, y, columns, rows, rowHeight = 14 }) {
  page.drawText(title, {
    x: MARGIN_X,
    y,
    size: 13,
    font: fonts.bold,
    color: rgb(0.2, 0.25, 0.34),
  });
  let cursorY = y - 20;

  for (const column of columns) {
    page.drawText(column.label, {
      x: column.x,
      y: cursorY,
      size: 9,
      font: fonts.bold,
      color: rgb(0.06, 0.09, 0.16),
    });
  }
  cursorY -= rowHeight;

  const minY = CONTENT_BOTTOM + 10;
  const maxRows = Math.max(0, Math.floor((cursorY - minY) / rowHeight));
  for (const row of rows.slice(0, maxRows)) {
    for (const column of columns) {
      page.drawText(text(row[column.key]), {
        x: column.x,
        y: cursorY,
        size: 9,
        font: fonts.regular,
        color: rgb(0.12, 0.16, 0.23),
      });
    }
    cursorY -= rowHeight;
  }
}

export async function buildResultsPdf({ model, result, consultant }) {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageChrome(page, fonts, { model, consultant });

  let y = CONTENT_TOP;
  y = drawHeading(page, fonts, 'Executive Summary', y);

  if (model === 'breakeven') {
    y = drawSummaryRow(page, fonts, 'Gross Margin Amount', currency(result?.grossMarginAmount), y);
    y = drawSummaryRow(page, fonts, 'Gross Margin Percent', percentValue(result?.grossMarginPercent), y);
    y = drawSummaryRow(page, fonts, 'Breakeven Revenue', currency(result?.breakevenRevenue), y);
    y = drawSummaryRow(page, fonts, 'Breakeven Daily', currency(result?.breakevenDaily), y);
    y = drawSummaryRow(page, fonts, 'Breakeven Weekly', currency(result?.breakevenWeekly), y);
    y = drawSummaryRow(page, fonts, 'Breakeven Monthly', currency(result?.breakevenMonthly), y);
    drawSummaryRow(page, fonts, 'Breakeven Hourly', currency(result?.breakevenHourly), y);
  } else if (model === 'working-capital') {
    y = drawSummaryRow(page, fonts, 'A/R Investment', currency(result?.arInvestment), y);
    y = drawSummaryRow(page, fonts, 'Inventory Investment', currency(result?.inventoryInvestment), y);
    y = drawSummaryRow(page, fonts, 'A/P Financing', currency(result?.apFinancing), y);
    y = drawSummaryRow(page, fonts, 'Net Working Capital', currency(result?.netWorkingCapital), y);
    y = drawSummaryRow(page, fonts, 'Cash Conversion Cycle', text(result?.cashConversionCycle), y);
    drawSummaryRow(
      page,
      fonts,
      'Working Capital % of Revenue',
      percentValue(result?.workingCapitalPercentOfRevenue),
      y,
    );
  } else if (model === 'current-financial-information') {
    const assumptions = result?.assumptions || {};
    const warnings = Array.isArray(result?.warnings) ? result.warnings : [];
    y = drawSummaryRow(page, fonts, 'Gross Margin Amount', currency(result?.grossMarginAmount), y);
    y = drawSummaryRow(page, fonts, 'Gross Margin Percent', percentValue(result?.grossMarginPercent), y);
    y = drawSummaryRow(page, fonts, 'Breakeven Revenue', currency(result?.breakevenRevenue), y);
    y = drawSummaryRow(page, fonts, 'A/R Investment', currency(result?.arInvestment), y);
    y = drawSummaryRow(page, fonts, 'Inventory Investment', currency(result?.inventoryInvestment), y);
    y = drawSummaryRow(page, fonts, 'A/P Financing', currency(result?.apFinancing), y);
    y = drawSummaryRow(page, fonts, 'Net Working Capital', currency(result?.netWorkingCapital), y);
    y = drawSummaryRow(page, fonts, 'Cash Conversion Cycle', text(result?.cashConversionCycle), y);
    y = drawSummaryRow(page, fonts, 'Breakeven Daily', currency(result?.breakevenDaily), y);
    y = drawSummaryRow(page, fonts, 'Breakeven Weekly', currency(result?.breakevenWeekly), y);
    y = drawSummaryRow(page, fonts, 'Breakeven Monthly', currency(result?.breakevenMonthly), y);
    y = drawSummaryRow(page, fonts, 'Breakeven Hourly', currency(result?.breakevenHourly), y);
    y = drawSummaryRow(page, fonts, 'Assumption: Annual Revenue', currency(assumptions?.annualRevenue), y);
    y = drawSummaryRow(page, fonts, 'Assumption: Annual COGS', currency(assumptions?.annualCogs), y);
    y = drawSummaryRow(
      page,
      fonts,
      'Assumption: Annual Fixed Expenses',
      currency(assumptions?.annualFixedExpenses),
      y,
    );
    y = drawSummaryRow(page, fonts, 'Assumption: DSO', text(assumptions?.daysSalesOutstanding), y);
    y = drawSummaryRow(page, fonts, 'Assumption: DIO', text(assumptions?.daysInventoryOnHand), y);
    y = drawSummaryRow(page, fonts, 'Assumption: DPO', text(assumptions?.daysPayablesOutstanding), y);
    y = drawSummaryRow(page, fonts, 'Assumption: Work Days/Year', text(assumptions?.workDaysPerYear), y);
    y = drawSummaryRow(page, fonts, 'Assumption: Work Hours/Day', text(assumptions?.workHoursPerDay), y);
    y = drawSummaryRow(
      page,
      fonts,
      'Assumption Notes',
      text(assumptions?.optionalNotes),
      y,
    );
    drawSummaryRow(page, fonts, 'Warnings', warnings.length > 0 ? warnings.join('; ') : 'None', y);
  } else if (model === 'pl-comparisons') {
    const rows = (result?.years || []).map((row) => ({
      year: text(row?.year),
      revenue: currency(row?.revenue),
      grossProfit: currency(row?.grossProfit),
      grossMarginPct: percentValue(row?.grossMarginPct),
      ebit: currency(row?.ebit),
      ebitMarginPct: percentValue(row?.ebitMarginPct),
      netIncome: currency(row?.netIncome),
      revenueYoYPct: percentValue(row?.trend?.revenueYoYPct),
      netIncomeYoYPct: percentValue(row?.trend?.netIncomeYoYPct),
    }));

    const latest = rows[rows.length - 1] || {};
    y = drawSummaryRow(page, fonts, 'Latest Year', text(latest.year), y);
    y = drawSummaryRow(page, fonts, 'Latest Gross Margin', text(latest.grossMarginPct), y);
    y = drawSummaryRow(page, fonts, 'Latest EBIT Margin', text(latest.ebitMarginPct), y);
    drawSummaryRow(page, fonts, 'Latest Net Income', text(latest.netIncome), y);

    drawSimpleTable(page, fonts, {
      title: 'P&L Comparison by Year',
      y: y - 12,
      columns: [
        { label: 'Year', key: 'year', x: 48 },
        { label: 'Revenue', key: 'revenue', x: 84 },
        { label: 'Gross Profit', key: 'grossProfit', x: 146 },
        { label: 'GM %', key: 'grossMarginPct', x: 216 },
        { label: 'EBIT', key: 'ebit', x: 264 },
        { label: 'EBIT %', key: 'ebitMarginPct', x: 324 },
        { label: 'Net Income', key: 'netIncome', x: 374 },
        { label: 'Rev YoY %', key: 'revenueYoYPct', x: 440 },
        { label: 'NI YoY %', key: 'netIncomeYoYPct', x: 504 },
      ],
      rows,
      rowHeight: 13,
    });
  } else if (model === 'balance-sheet-comparisons') {
    const rows = (result?.years || []).map((row) => ({
      year: text(row?.year),
      totalCurrentAssets: currency(row?.totalCurrentAssets),
      totalAssets: currency(row?.totalAssets),
      totalCurrentLiabilities: currency(row?.totalCurrentLiabilities),
      totalLiabilities: currency(row?.totalLiabilities),
      workingCapital: currency(row?.workingCapital),
      currentRatio: text(
        row?.currentRatio === null || row?.currentRatio === undefined ? 'n/a' : Number(row.currentRatio).toFixed(2),
      ),
      debtToEquity: text(
        row?.debtToEquity === null || row?.debtToEquity === undefined ? 'n/a' : Number(row.debtToEquity).toFixed(2),
      ),
      balanceDifference: currency(row?.checks?.balanceDifference),
    }));

    const latest = result?.years?.[result.years.length - 1] || {};
    y = drawSummaryRow(page, fonts, 'Latest Year', text(latest.year), y);
    y = drawSummaryRow(page, fonts, 'Latest Total Assets', currency(latest.totalAssets), y);
    y = drawSummaryRow(page, fonts, 'Latest Current Ratio', text(latest.currentRatio?.toFixed?.(2)), y);
    drawSummaryRow(page, fonts, 'Latest Debt to Equity', text(latest.debtToEquity?.toFixed?.(2)), y);

    drawSimpleTable(page, fonts, {
      title: 'Balance Sheet Comparison by Year',
      y: y - 12,
      columns: [
        { label: 'Year', key: 'year', x: 48 },
        { label: 'Curr Assets', key: 'totalCurrentAssets', x: 82 },
        { label: 'Assets', key: 'totalAssets', x: 148 },
        { label: 'Curr Liab', key: 'totalCurrentLiabilities', x: 210 },
        { label: 'Liabilities', key: 'totalLiabilities', x: 274 },
        { label: 'Work Cap', key: 'workingCapital', x: 334 },
        { label: 'Current', key: 'currentRatio', x: 394 },
        { label: 'D/E', key: 'debtToEquity', x: 444 },
        { label: 'Diff', key: 'balanceDifference', x: 482 },
      ],
      rows,
      rowHeight: 13,
    });
  } else if (model === 'basic-client-info') {
    const location = [result?.locationCity, result?.locationState].filter(Boolean).join(', ');
    const warnings = Array.isArray(result?.warnings) ? result.warnings : [];
    const summaryBlock = text(result?.summaryBlock).replaceAll('\n', ' | ');

    y = drawSummaryRow(page, fonts, 'Company Name', text(result?.companyName), y);
    y = drawSummaryRow(page, fonts, 'Industry', text(result?.industry), y);
    y = drawSummaryRow(page, fonts, 'Primary Contact', text(result?.primaryContactName), y);
    y = drawSummaryRow(page, fonts, 'Contact Email', text(result?.primaryContactEmail), y);
    y = drawSummaryRow(page, fonts, 'Contact Phone', text(result?.primaryContactPhone), y);
    y = drawSummaryRow(page, fonts, 'Location', text(location), y);
    y = drawSummaryRow(page, fonts, 'Warnings', warnings.length > 0 ? warnings.join('; ') : 'None', y);
    drawSummaryRow(page, fonts, 'Summary', summaryBlock, y);
  } else if (model === 'five-year-projections') {
    const years = Array.isArray(result?.years) ? result.years : [];
    const latest = years[years.length - 1] || {};
    const warnings = Array.isArray(result?.warnings) ? result.warnings : [];

    y = drawSummaryRow(page, fonts, 'Base Year', text(years[0]?.year), y);
    y = drawSummaryRow(page, fonts, 'Year 5', text(latest?.year), y);
    y = drawSummaryRow(page, fonts, 'Year 5 Revenue', currency(latest?.revenue), y);
    y = drawSummaryRow(page, fonts, 'Year 5 EBITDA', currency(latest?.ebitda), y);
    y = drawSummaryRow(page, fonts, 'Year 5 Net Income', currency(latest?.netIncome), y);
    drawSummaryRow(page, fonts, 'Warnings', warnings.length > 0 ? warnings.join('; ') : 'None', y);

    const rows = years.map((row) => ({
      year: text(row?.year),
      revenue: currency(row?.revenue),
      cogs: currency(row?.cogs),
      grossProfit: currency(row?.grossProfit),
      grossMarginPct: percentValue(row?.grossMarginPct),
      fixedExpenses: currency(row?.fixedExpenses),
      ebitda: currency(row?.ebitda),
      ebitdaMarginPct: percentValue(row?.ebitdaMarginPct),
      taxes: currency(row?.taxes),
      netIncome: currency(row?.netIncome),
    }));

    drawSimpleTable(page, fonts, {
      title: '5 Year Projection Table',
      y: y - 12,
      columns: [
        { label: 'Year', key: 'year', x: 48 },
        { label: 'Revenue', key: 'revenue', x: 82 },
        { label: 'COGS', key: 'cogs', x: 138 },
        { label: 'Gross', key: 'grossProfit', x: 186 },
        { label: 'GM %', key: 'grossMarginPct', x: 238 },
        { label: 'Fixed', key: 'fixedExpenses', x: 280 },
        { label: 'EBITDA', key: 'ebitda', x: 334 },
        { label: 'EBITDA %', key: 'ebitdaMarginPct', x: 386 },
        { label: 'Taxes', key: 'taxes', x: 442 },
        { label: 'Net', key: 'netIncome', x: 488 },
      ],
      rows,
      rowHeight: 13,
    });
  } else if (model === 'analyst-wizard') {
    const summary = result?.summary || {};
    y = drawSummaryRow(page, fonts, 'Company Name', text(result?.companyName), y);
    y = drawSummaryRow(page, fonts, 'Industry', text(result?.industry), y);
    y = drawSummaryRow(page, fonts, 'Enterprise Value (NPV)', currency(summary.enterpriseValueNpv), y);
    y = drawSummaryRow(page, fonts, 'Year 1 EBITDA Margin', percentValue(summary.yearOneEbitdaMarginPercent), y);
    y = drawSummaryRow(page, fonts, 'Cumulative Free Cash Flow', currency(summary.cumulativeFreeCashFlow), y);
    y = drawSummaryRow(page, fonts, 'Blended Growth Rate', percentValue(summary.blendedGrowthRatePercent), y);

    const projections = (result?.projections || []).map((row) => ({
      year: text(row?.year),
      revenue: currency(row?.revenue),
      grossProfit: currency(row?.grossProfit),
      ebitda: currency(row?.ebitda),
      freeCashFlow: currency(row?.freeCashFlow),
    }));

    drawSimpleTable(page, fonts, {
      title: 'Projected Financials',
      y: y - 12,
      columns: [
        { label: 'Year', key: 'year', x: 48 },
        { label: 'Revenue', key: 'revenue', x: 90 },
        { label: 'Gross Profit', key: 'grossProfit', x: 192 },
        { label: 'EBITDA', key: 'ebitda', x: 304 },
        { label: 'Free Cash Flow', key: 'freeCashFlow', x: 396 },
      ],
      rows: projections,
    });
  } else if (model === 'capbudg') {
    const summary = result?.summary || {};
    y = drawSummaryRow(page, fonts, 'Discount Rate Used', percent(summary.discountRateUsed), y);
    y = drawSummaryRow(page, fonts, 'Initial Outflow', currency(summary.initialOutflow), y);
    y = drawSummaryRow(page, fonts, 'NPV', currency(summary.npv), y);
    y = drawSummaryRow(page, fonts, 'IRR', percent(summary.irr), y);
    drawSummaryRow(page, fonts, 'ROC', percent(summary.roc), y);
  } else if (model === 'fcfe') {
    const summary = result?.summary || {};
    y = drawSummaryRow(page, fonts, 'Reinvestment Rate', percent(summary.reinvestmentRate), y);
    y = drawSummaryRow(page, fonts, 'FCFE', currency(summary.fcfe), y);
    y = drawSummaryRow(page, fonts, 'Cost of Equity', percent(summary.costOfEquity), y);
    y = drawSummaryRow(page, fonts, 'Expected Growth', percent(summary.expectedGrowth), y);
    drawSummaryRow(page, fonts, 'Intrinsic Value', currency(summary.intrinsicValue), y);
  } else {
    drawSummaryRow(page, fonts, 'Result', 'Unsupported model payload.', y);
  }

  return pdfDoc.save();
}

export async function buildExecutiveAnalysisPdf({ report, consultant, clientName }) {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageChrome(page, fonts, { model: 'executive-analysis', consultant });

  let y = CONTENT_TOP;
  y = drawHeading(page, fonts, `Executive Analysis — ${text(clientName)}`, y);
  y = drawSummaryRow(page, fonts, 'Generated', new Date(report.generatedAt || Date.now()).toLocaleString('en-US'), y);
  y = drawSummaryRow(
    page,
    fonts,
    'Core Progress',
    `${report.coreProgress?.complete ?? 0} / ${report.coreProgress?.total ?? 0} (${report.coreProgress?.percent ?? 0}%)`,
    y,
  );

  for (const kpi of (report.kpis || []).slice(0, 5)) {
    y = drawSummaryRow(page, fonts, kpi.label, text(kpi.value), y);
  }

  y = drawHeading(page, fonts, 'Insights', y - 8);
  for (const insight of (report.insights || []).slice(0, 5)) {
    y = drawSummaryRow(page, fonts, `[${insight.severity}] ${insight.title}`, text(insight.detail), y);
    if (y < CONTENT_BOTTOM + 40) break;
  }

  y = drawHeading(page, fonts, 'Recommended Actions', y - 8);
  for (const action of (report.recommendedActions || []).slice(0, 6)) {
    y = drawSummaryRow(page, fonts, `Core ${action.coreRank}`, text(action.sheetName), y);
    if (y < CONTENT_BOTTOM + 20) break;
  }

  const plRows = (report.plTrend || []).map((row) => ({
    year: text(row.year),
    revenue: currency(row.revenue),
    netIncome: currency(row.netIncome),
    grossMarginPct: percentValue(row.grossMarginPct),
  }));

  if (plRows.length > 0) {
    drawSimpleTable(page, fonts, {
      title: 'P&L Trend',
      y: y - 12,
      columns: [
        { label: 'Year', key: 'year', x: 48 },
        { label: 'Revenue', key: 'revenue', x: 90 },
        { label: 'Net Income', key: 'netIncome', x: 180 },
        { label: 'GM %', key: 'grossMarginPct', x: 280 },
      ],
      rows: plRows,
      rowHeight: 13,
    });
  }

  return pdfDoc.save();
}

function drawInvoiceLine(page, y, color = rgb(0.82, 0.86, 0.9)) {
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_WIDTH - MARGIN_X, y },
    thickness: 1,
    color,
  });
}

function drawInvoiceLabelValue(page, fonts, { label, value, x, y, labelSize = 9, valueSize = 11 }) {
  page.drawText(label, {
    x,
    y,
    size: labelSize,
    font: fonts.regular,
    color: rgb(0.4, 0.45, 0.52),
  });
  page.drawText(text(value), {
    x,
    y: y - 14,
    size: valueSize,
    font: fonts.bold,
    color: rgb(0.08, 0.11, 0.18),
  });
}

function drawInvoiceParagraph(page, fonts, { text: body, x, y, maxWidth, size = 10 }) {
  const words = text(body).split(/\s+/);
  let line = '';
  let cursorY = y;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    const width = fonts.regular.widthOfTextAtSize(candidate, size);
    if (width > maxWidth && line) {
      page.drawText(line, {
        x,
        y: cursorY,
        size,
        font: fonts.regular,
        color: rgb(0.12, 0.16, 0.23),
      });
      cursorY -= size + 4;
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) {
    page.drawText(line, {
      x,
      y: cursorY,
      size,
      font: fonts.regular,
      color: rgb(0.12, 0.16, 0.23),
    });
    cursorY -= size + 4;
  }

  return cursorY;
}

/**
 * @param {{
 *   invoiceType: 'consultation' | 'retainer',
 *   inputs: Record<string, unknown>,
 *   client: Record<string, unknown>|null|undefined,
 *   consultant?: Record<string, unknown>,
 *   runId?: string|null,
 * }} params
 */
export async function buildInvoicePdf({ invoiceType, inputs, client, consultant = {}, runId = null }) {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const billTo = formatClientBillTo(client);
  const title = getInvoiceTitle(invoiceType);
  const amount = resolveInvoiceAmount(invoiceType, inputs);
  const invoiceDate = formatInvoiceDate(inputs?.invoiceDate) || new Date().toLocaleDateString('en-US');
  const invoiceNumber = runId ? `INV-${String(runId).slice(0, 8).toUpperCase()}` : `INV-${Date.now()}`;

  let y = PAGE_HEIGHT - 56;
  page.drawText('Business Management Solutions', {
    x: MARGIN_X,
    y,
    size: 14,
    font: fonts.bold,
    color: rgb(0.08, 0.11, 0.18),
  });
  y -= 16;
  page.drawText(consultantFooter(consultant), {
    x: MARGIN_X,
    y,
    size: 9,
    font: fonts.regular,
    color: rgb(0.35, 0.4, 0.48),
  });

  page.drawText('INVOICE', {
    x: PAGE_WIDTH - MARGIN_X - 120,
    y: PAGE_HEIGHT - 58,
    size: 26,
    font: fonts.bold,
    color: rgb(0.08, 0.11, 0.18),
  });
  page.drawText(title, {
    x: PAGE_WIDTH - MARGIN_X - 120,
    y: PAGE_HEIGHT - 82,
    size: 10,
    font: fonts.regular,
    color: rgb(0.35, 0.4, 0.48),
  });

  y = PAGE_HEIGHT - 120;
  drawInvoiceLine(page, y);
  y -= 28;

  drawInvoiceLabelValue(page, fonts, {
    label: 'Bill To',
    value: billTo.companyName,
    x: MARGIN_X,
    y,
  });

  let billToY = y - 34;
  for (const line of billTo.lines) {
    page.drawText(line, {
      x: MARGIN_X,
      y: billToY,
      size: 10,
      font: fonts.regular,
      color: rgb(0.12, 0.16, 0.23),
    });
    billToY -= 14;
  }
  if (billTo.contact) {
    page.drawText(billTo.contact, {
      x: MARGIN_X,
      y: billToY,
      size: 9,
      font: fonts.regular,
      color: rgb(0.35, 0.4, 0.48),
    });
    billToY -= 14;
  }
  if (billTo.ein) {
    page.drawText(`EIN: ${billTo.ein}`, {
      x: MARGIN_X,
      y: billToY,
      size: 9,
      font: fonts.regular,
      color: rgb(0.35, 0.4, 0.48),
    });
  }

  const metaX = PAGE_WIDTH - MARGIN_X - 180;
  drawInvoiceLabelValue(page, fonts, {
    label: 'Invoice #',
    value: invoiceNumber,
    x: metaX,
    y,
  });
  drawInvoiceLabelValue(page, fonts, {
    label: 'Invoice Date',
    value: invoiceDate,
    x: metaX,
    y: y - 44,
  });

  y = Math.min(billToY, PAGE_HEIGHT - 230) - 24;
  drawInvoiceLine(page, y);
  y -= 22;

  const tableTop = y;
  const colDesc = MARGIN_X;
  const colQty = 300;
  const colRate = 380;
  const colAmount = 470;

  page.drawText('Description', { x: colDesc, y: tableTop, size: 9, font: fonts.bold, color: rgb(0.08, 0.11, 0.18) });
  if (invoiceType === 'consultation') {
    page.drawText('Hours', { x: colQty, y: tableTop, size: 9, font: fonts.bold, color: rgb(0.08, 0.11, 0.18) });
    page.drawText('Rate', { x: colRate, y: tableTop, size: 9, font: fonts.bold, color: rgb(0.08, 0.11, 0.18) });
  } else {
    page.drawText('Period', { x: colQty, y: tableTop, size: 9, font: fonts.bold, color: rgb(0.08, 0.11, 0.18) });
  }
  page.drawText('Amount', { x: colAmount, y: tableTop, size: 9, font: fonts.bold, color: rgb(0.08, 0.11, 0.18) });

  y = tableTop - 18;
  drawInvoiceLine(page, y, rgb(0.9, 0.92, 0.95));
  y -= 16;

  if (invoiceType === 'consultation') {
    page.drawText(text(inputs?.serviceDescription), {
      x: colDesc,
      y,
      size: 10,
      font: fonts.regular,
      color: rgb(0.12, 0.16, 0.23),
    });
    page.drawText(text(inputs?.hours), { x: colQty, y, size: 10, font: fonts.regular, color: rgb(0.12, 0.16, 0.23) });
    page.drawText(currency(inputs?.rate), { x: colRate, y, size: 10, font: fonts.regular, color: rgb(0.12, 0.16, 0.23) });
  } else {
    page.drawText('Professional services retainer', {
      x: colDesc,
      y,
      size: 10,
      font: fonts.regular,
      color: rgb(0.12, 0.16, 0.23),
    });
    page.drawText(text(inputs?.retainerPeriod), {
      x: colQty,
      y,
      size: 10,
      font: fonts.regular,
      color: rgb(0.12, 0.16, 0.23),
    });
  }

  page.drawText(currency(amount), {
    x: colAmount,
    y,
    size: 10,
    font: fonts.bold,
    color: rgb(0.08, 0.11, 0.18),
  });

  y -= 28;
  drawInvoiceLine(page, y);
  y -= 20;
  page.drawText('Total Due', {
    x: colRate,
    y,
    size: 11,
    font: fonts.bold,
    color: rgb(0.08, 0.11, 0.18),
  });
  page.drawText(currency(amount), {
    x: colAmount,
    y,
    size: 12,
    font: fonts.bold,
    color: rgb(0.08, 0.11, 0.18),
  });

  const notes = invoiceType === 'retainer' ? text(inputs?.notes) : '';
  if (notes && notes !== 'n/a') {
    y -= 36;
    page.drawText('Notes', {
      x: MARGIN_X,
      y,
      size: 10,
      font: fonts.bold,
      color: rgb(0.2, 0.25, 0.34),
    });
    drawInvoiceParagraph(page, fonts, {
      text: notes,
      x: MARGIN_X,
      y: y - 16,
      maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    });
  }

  page.drawText('Payment is due upon receipt unless otherwise agreed in writing.', {
    x: MARGIN_X,
    y: FOOTER_Y + 24,
    size: 8,
    font: fonts.regular,
    color: rgb(0.45, 0.5, 0.58),
  });
  page.drawText(consultantFooter(consultant), {
    x: MARGIN_X,
    y: FOOTER_Y,
    size: 9,
    font: fonts.regular,
    color: rgb(0.29, 0.35, 0.45),
  });

  return pdfDoc.save();
}
