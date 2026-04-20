import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
