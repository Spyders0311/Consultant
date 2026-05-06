const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'knowledge', 'workbooks', 'critical_workbooks_analysis.json');

const workbookPaths = [
  'Spreadsheets/BMS Breakeven Analysis Tool Office (1).xls',
  'Spreadsheets/BMS Analyst Program (1).xlsm',
];

function decodeRange(ref) {
  try {
    return XLSX.utils.decode_range(ref);
  } catch {
    return null;
  }
}

function cellText(cell) {
  if (!cell) return '';
  if (cell.w !== undefined) return String(cell.w);
  if (cell.v !== undefined) return String(cell.v);
  return '';
}

function sheetLabelForCell(sheet, row, col) {
  const candidates = [
    [row, col - 1],
    [row, col - 2],
    [row - 1, col],
    [row - 1, col - 1],
  ];

  for (const [candidateRow, candidateCol] of candidates) {
    if (candidateRow < 0 || candidateCol < 0) continue;
    const address = XLSX.utils.encode_cell({ r: candidateRow, c: candidateCol });
    const value = cellText(sheet[address]).trim();
    if (value && !/^[\d.,$%() -]+$/.test(value)) {
      return value;
    }
  }

  return '';
}

function compactFormula(formula) {
  return String(formula || '').replace(/\s+/g, ' ').slice(0, 240);
}

function inspectSheet(name, sheet) {
  const range = decodeRange(sheet['!ref']);
  const formulas = [];
  const valueCells = [];
  const labels = [];

  for (const address of Object.keys(sheet)) {
    if (address.startsWith('!')) continue;
    const cell = sheet[address];
    const decoded = XLSX.utils.decode_cell(address);
    const value = cellText(cell).trim();

    if (cell.f) {
      formulas.push({
        cell: address,
        label: sheetLabelForCell(sheet, decoded.r, decoded.c),
        formula: compactFormula(cell.f),
      });
      continue;
    }

    if (value) {
      valueCells.push({ address, value });
      if (!/^[\d.,$%() -]+$/.test(value) && labels.length < 80) {
        labels.push(value);
      }
    }
  }

  return {
    name,
    ref: sheet['!ref'] || null,
    rows: range ? range.e.r - range.s.r + 1 : 0,
    cols: range ? range.e.c - range.s.c + 1 : 0,
    formulaCount: formulas.length,
    valueCellCount: valueCells.length,
    labels: labels.slice(0, 40),
    formulaSamples: formulas.slice(0, 60),
    outputFormulaSamples: formulas.filter((formula) => formula.label).slice(0, 40),
  };
}

function summarizeNames(workbook) {
  return (workbook.Workbook?.Names || []).slice(0, 120).map((entry) => ({
    name: entry.Name,
    ref: entry.Ref,
  }));
}

function summarizeWorkbook(relPath, macroSummary) {
  const absolutePath = path.join(rootDir, relPath);
  const workbook = XLSX.readFile(absolutePath, {
    bookVBA: true,
    cellFormula: true,
    cellNF: false,
    cellHTML: false,
    cellStyles: false,
  });

  const sheets = workbook.SheetNames.map((sheetName) => inspectSheet(sheetName, workbook.Sheets[sheetName]));
  const totalFormulaCount = sheets.reduce((sum, sheet) => sum + sheet.formulaCount, 0);
  const topSheets = [...sheets]
    .sort((left, right) => right.formulaCount - left.formulaCount || right.valueCellCount - left.valueCellCount)
    .slice(0, 12);
  const macro = macroSummary.find((entry) => path.normalize(entry.path).endsWith(path.normalize(relPath))) || null;

  return {
    path: relPath,
    sheetCount: workbook.SheetNames.length,
    sheetNames: workbook.SheetNames,
    namedRanges: summarizeNames(workbook),
    hasVbaProject: Boolean(workbook.vbaraw) || Boolean(macro?.hasMacros),
    vbaProjectBytes: workbook.vbaraw?.length || 0,
    totalFormulaCount,
    topSheets,
    sheets,
    macros: macro,
  };
}

function extractMacros() {
  const args = workbookPaths.map((relPath) => path.join(rootDir, relPath));
  const output = execFileSync('py', ['scripts/extract-vba-macros.py', ...args], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  return JSON.parse(output);
}

function main() {
  const macroSummary = extractMacros();
  const workbooks = workbookPaths.map((relPath) => summarizeWorkbook(relPath, macroSummary));

  const output = {
    generatedAt: new Date().toISOString(),
    notes: [
      'Generated from the two business-critical source workbooks identified for website implementation.',
      'Formula and macro summaries are used as implementation guidance; production logic should be rebuilt in reviewed server-side modules.',
    ],
    workbooks,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote critical workbook analysis to ${path.relative(rootDir, outputPath)}`);
}

main();
