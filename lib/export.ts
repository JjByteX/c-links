import type { Sheet, Summary } from "@/lib/reports";

function save(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Excel stores a date with no time zone. Shifting by the offset makes the
// sheet show the same clock time the partner sees in the app.
const localClock = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

// Builds an Excel file in the browser and downloads it. The library is loaded
// only when an export is asked for, so it does not weigh down the app.
export async function downloadXlsx(
  fileName: string,
  sheetName: string,
  sheet: Sheet,
): Promise<void> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = sheet.columns.map((c) => ({
    header: c.header,
    width: c.width,
    style: c.format ? { numFmt: c.format } : {},
  }));
  worksheet.addRows(
    sheet.rows.map((row) =>
      row.map((cell) => (cell instanceof Date ? localClock(cell) : cell)),
    ),
  );
  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  save(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName,
  );
}

// The PDF's built-in font has no peso sign, so amounts are written as PHP.
const php = (amount: number) => `PHP ${amount.toLocaleString("en-PH")}`;

// A one-page summary of the range, drawn in the browser and downloaded.
export async function downloadSummaryPdf(
  fileName: string,
  summary: Summary,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 20;
  const right = 190;
  let y = 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("C-Links report", left, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(summary.label, left, y);
  y += 6;
  doc.text(
    `Created ${new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}`,
    left,
    y,
  );
  y += 14;

  const figures: [string, string][] = [
    ["Cards sold", String(summary.cardsSold)],
    ["Revenue", php(summary.revenue)],
    ["Purchases", String(summary.purchases)],
    ["Customers", String(summary.customers)],
    [
      "Voided purchases",
      `${summary.voided} (${php(summary.voidedAmount)}, not counted above)`,
    ],
    ["Cards restocked", String(summary.restocked)],
    ["Stock corrections", String(summary.corrections)],
    ["In stock now", String(summary.stockNow)],
  ];
  for (const [name, value] of figures) {
    doc.text(name, left, y);
    doc.text(value, right, y, { align: "right" });
    doc.setDrawColor(200);
    doc.line(left, y + 2, right, y + 2);
    y += 8;
  }

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Sales by package", left, y);
  y += 8;

  doc.setFontSize(11);
  const columns = { purchases: 120, cards: 150, revenue: right };
  doc.text("Package", left, y);
  doc.text("Purchases", columns.purchases, y, { align: "right" });
  doc.text("Cards", columns.cards, y, { align: "right" });
  doc.text("Revenue", columns.revenue, y, { align: "right" });
  doc.setDrawColor(200);
  doc.line(left, y + 2, right, y + 2);
  y += 8;

  doc.setFont("helvetica", "normal");
  for (const row of summary.byPackage) {
    doc.text(row.name, left, y);
    doc.text(String(row.purchases), columns.purchases, y, { align: "right" });
    doc.text(String(row.cards), columns.cards, y, { align: "right" });
    doc.text(php(row.revenue), columns.revenue, y, { align: "right" });
    doc.line(left, y + 2, right, y + 2);
    y += 8;
  }

  doc.save(fileName);
}
