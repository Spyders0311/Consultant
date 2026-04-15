import 'server-only';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function buildReportPdf({ title, summary }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(title || 'BMS Report', {
    x: 50,
    y: 740,
    size: 20,
    font: boldFont,
    color: rgb(0.06, 0.25, 0.38),
  });

  page.drawText(`Generated: ${new Date().toLocaleString()}`, {
    x: 50,
    y: 712,
    size: 11,
    font,
  });

  const lines = [
    `Base Cost: ${summary.baseCost}`,
    `Protected Value Index: ${summary.protectedValueIndex}`,
    `Risk Band: ${summary.riskBand}`,
    `Calculated At: ${summary.calculatedAt}`,
  ];

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: 660 - index * 24,
      size: 12,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  });

  return pdfDoc.save();
}
