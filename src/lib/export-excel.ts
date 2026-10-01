/**
 * Genera un archivo .xlsx en el cliente con encabezado estilado (color de marca).
 * Usa ExcelJS (mantenido) en lugar de SheetJS/xlsx.
 */
import ExcelJS from "exceljs";

function normalizeArgb(color: string, fallback = "FF2F6B3C"): string {
  const hex = color.replace("#", "").trim().toUpperCase();
  if (/^[0-9A-F]{3}$/.test(hex)) {
    const expanded = hex
      .split("")
      .map((c) => c + c)
      .join("");
    return `FF${expanded}`;
  }
  if (/^[0-9A-F]{6}$/.test(hex)) return `FF${hex}`;
  if (/^[0-9A-F]{8}$/.test(hex)) return hex;
  return fallback;
}

export async function generateExcelBlob(
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
  primaryColor = "#2f6b3c",
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.slice(0, 31) || "Datos");

  const headerRow = ws.addRow(headers);
  const argb = normalizeArgb(primaryColor);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  for (const row of rows) {
    ws.addRow(row);
  }

  headers.forEach((key, i) => {
    ws.getColumn(i + 1).width = Math.max(key.length, 12);
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
