import PDFDocument from 'pdfkit';

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

function addHeader(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 120).fill('#0f172a');
  doc.fillColor('#f8fafc').font('Helvetica-Bold').fontSize(24).text(title, 48, 42);
  doc.fillColor('#cbd5e1').font('Helvetica').fontSize(11).text(subtitle, 48, 74);
  doc.moveDown(2);
}

function addSummaryRow(doc, label, value, y) {
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text(label, 48, y);
  doc.fillColor('#1e293b').font('Helvetica').fontSize(11).text(value, 260, y);
}

export async function buildResultsPdf({ model, result }) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  addHeader(
    doc,
    'BMS Portal Calculation Report',
    `Model: ${model} | Generated: ${new Date().toLocaleString('en-US')}`,
  );

  const summaryY = 145;
  doc.fillColor('#334155').font('Helvetica-Bold').fontSize(14).text('Executive Summary', 48, summaryY);

  if (model === 'capbudg') {
    addSummaryRow(doc, 'Discount Rate Used', percent(result.summary.discountRateUsed), summaryY + 30);
    addSummaryRow(doc, 'Initial Outflow', currency(result.summary.initialOutflow), summaryY + 52);
    addSummaryRow(doc, 'NPV', currency(result.summary.npv), summaryY + 74);
    addSummaryRow(doc, 'IRR', percent(result.summary.irr), summaryY + 96);
    addSummaryRow(doc, 'ROC', percent(result.summary.roc), summaryY + 118);

    const startY = summaryY + 170;
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(13).text('Annual Cashflow (first 10 rows)', 48, startY);

    const rows = (result.annual || []).slice(0, 10);
    let y = startY + 24;
    doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold');
    doc.text('Year', 48, y);
    doc.text('Revenue', 90, y);
    doc.text('EBIT(1-t)', 190, y);
    doc.text('NATCF', 290, y);
    doc.text('PV Cashflow', 390, y);

    y += 16;
    doc.font('Helvetica').fillColor('#1f2937');
    for (const row of rows) {
      doc.text(String(row.year), 48, y);
      doc.text(currency(row.revenue), 90, y, { width: 90 });
      doc.text(currency(row.ebitAfterTax), 190, y, { width: 90 });
      doc.text(currency(row.natcf), 290, y, { width: 90 });
      doc.text(currency(row.discountedCashFlow), 390, y, { width: 110 });
      y += 14;
      if (y > 760) break;
    }
  } else {
    addSummaryRow(doc, 'Reinvestment Rate', percent(result.summary.reinvestmentRate), summaryY + 30);
    addSummaryRow(doc, 'FCFE', currency(result.summary.fcfe), summaryY + 52);
    addSummaryRow(doc, 'Cost of Equity', percent(result.summary.costOfEquity), summaryY + 74);
    addSummaryRow(doc, 'Expected Growth', percent(result.summary.expectedGrowth), summaryY + 96);
    addSummaryRow(doc, 'Intrinsic Value', currency(result.summary.intrinsicValue), summaryY + 118);

    const startY = summaryY + 170;
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(13).text('Sensitivity by Growth Rate', 48, startY);

    let y = startY + 24;
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold');
    doc.text('Growth', 48, y);
    doc.text('Value', 180, y);

    y += 16;
    doc.font('Helvetica').fillColor('#1f2937');
    for (const row of result.sensitivity || []) {
      doc.text(percent(row.growth), 48, y);
      doc.text(currency(row.value), 180, y);
      y += 14;
    }

    if ((result.warnings || []).length) {
      y += 18;
      doc.font('Helvetica-Bold').fillColor('#991b1b').text('Warnings', 48, y);
      y += 14;
      doc.font('Helvetica').fillColor('#7f1d1d');
      for (const warning of result.warnings) {
        doc.text(`- ${warning}`, 56, y);
        y += 13;
      }
    }
  }

  doc.end();
  return done;
}
