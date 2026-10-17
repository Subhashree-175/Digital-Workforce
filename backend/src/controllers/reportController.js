const ExcelJS = require('exceljs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { writeAudit } = require('../utils/audit');
const { fetchReportData, toCsv, EXPORT_FORMATS, REPORT_TYPES } = require('../utils/reportData');

function safeFilename(s) {
  return (s || 'report').replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function buildExcel(rows, title) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(title.slice(0, 28) || 'Report');

  const headerRow = ws.addRow(rows.length > 0 ? Object.keys(rows[0]).map((h) => h.replace(/([A-Z])/g, ' $1').trim()) : ['No data']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', patternType: 'solid', fgColor: { argb: 'FF1F4E79' } };

  rows.forEach((row) => {
    const values = Object.keys(row).map((h) => {
      const v = row[h];
      return (v instanceof Date) ? v.toISOString().slice(0, 10) : v;
    });
    ws.addRow(values);
  });
  ws.getRow(1).height = 20;
  return wb;
}

async function buildPdf(rows, title) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();

  page.drawText(title, { x: 40, y: 800, size: 16, font: bold, color: rgb(0.12, 0.31, 0.47) });
  page.drawText(`Generated: ${new Date().toLocaleString()}`, { x: 40, y: 782, size: 9, font });
  page.drawLine({ start: { x: 40, y: 774 }, end: { x: width - 40, y: 774 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });

  if (!rows || rows.length === 0) {
    page.drawText('No data found.', { x: 40, y: 740, size: 12, font });
    return pdfDoc.save();
  }

  const headers = Object.keys(rows[0]);
  const colWidths = headers.map((h) => Math.min(150, Math.max(60, h.length * 8)));
  const rowHeight = 18;
  const startY = 752;
  const startX = 40;

  let y = startY;
  // Header
  let x = startX;
  headers.forEach((h, i) => {
    page.drawText(h.replace(/([A-Z])/g, ' $1').trim().slice(0, 24), {
      x, y, size: 8.5, font: bold, color: rgb(0, 0, 0),
    });
    x += colWidths[i];
  });
  y -= rowHeight - 6;

  for (const row of rows) {
    if (y < 30) {
      page.drawText('... continued in next sheet/export', { x: 40, y, size: 8, font });
      break;
    }
    x = startX;
    headers.forEach((h, i) => {
      const label = String(row[h] ?? '').slice(0, Math.floor(colWidths[i] / 7) + 4);
      page.drawText(label, { x, y, size: 8, font, color: rgb(0, 0, 0) });
      x += colWidths[i];
    });
    y -= rowHeight;
  }

  return pdfDoc.save();
}

exports.exportReport = asyncHandler(async (req, res) => {
  const type = req.params.type;
  const format = (req.query.format || 'excel').toLowerCase();

  if (!REPORT_TYPES.includes(type)) throw new AppError(`Unknown report type "${type}".`, 400);
  if (!EXPORT_FORMATS.includes(format)) {
    throw new AppError(`Unsupported format "${format}". Use one of: ${EXPORT_FORMATS.join(', ')}`, 400);
  }

  const rows = await fetchReportData(type, req);
  await writeAudit(req.user.id, 'REPORT_EXPORT', 'report', null, { type, format, rows: rows.length });

  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = safeFilename(`${type}_${stamp}`);

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.csv"`);
    return res.send(Buffer.from('\uFEFF' + toCsv(rows), 'utf8')); // BOM for Excel compatibility
  }

  if (format === 'excel') {
    const wb = await buildExcel(rows, `${type} report`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.xlsx"`);
    const buffer = await wb.xlsx.writeBuffer();
    return res.send(buffer);
  }

  // PDF
  const pdfBytes = await buildPdf(rows, `${type.toUpperCase()} REPORT`);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
  res.send(Buffer.from(pdfBytes));
});