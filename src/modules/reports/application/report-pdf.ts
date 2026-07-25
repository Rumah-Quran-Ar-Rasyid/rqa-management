import type { ReportSnapshot } from "./report-service";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  ink: "0.10 0.14 0.18",
  muted: "0.35 0.40 0.45",
  line: "0.84 0.87 0.88",
  soft: "0.95 0.97 0.96",
  teal: "0.05 0.42 0.37",
  tealDark: "0.03 0.29 0.26",
  tealLight: "0.85 0.94 0.91",
  green: "0.10 0.48 0.27",
  amber: "0.75 0.43 0.05",
  red: "0.72 0.18 0.16",
} as const;

const CATEGORY_LABELS = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
} as const;

const FLUENCY_LABELS = {
  FLUENT: "Lancar",
  FAIRLY_FLUENT: "Cukup Lancar",
  LESS_FLUENT: "Kurang Lancar",
} as const;

type TextOptions = {
  color?: string;
  font?: "regular" | "bold";
  size?: number;
};

type PdfPage = {
  commands: string[];
  y: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function pdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrap(value: string, width: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function rect(page: PdfPage, x: number, y: number, width: number, height: number, color: string) {
  page.commands.push(`${color} rg ${x} ${y} ${width} ${height} re f`);
}

function border(
  page: PdfPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string = COLORS.line,
) {
  page.commands.push(`${color} RG 0.6 w ${x} ${y} ${width} ${height} re S`);
}

function line(
  page: PdfPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = COLORS.line,
) {
  page.commands.push(`${color} RG 0.6 w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function text(page: PdfPage, x: number, y: number, value: string, options: TextOptions = {}) {
  const font = options.font === "bold" ? "F2" : "F1";
  const size = options.size ?? 9;
  const color = options.color ?? COLORS.ink;
  page.commands.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${pdfText(value)}) Tj ET`);
}

function textLines(
  page: PdfPage,
  x: number,
  y: number,
  values: string[],
  options: TextOptions & { leading?: number } = {},
) {
  const leading = options.leading ?? (options.size ?? 9) + 3;
  values.forEach((value, index) => text(page, x, y - index * leading, value, options));
}

function addPage(pages: PdfPage[]) {
  const page = { commands: [], y: PAGE_HEIGHT - MARGIN };
  pages.push(page);
  return page;
}

function drawHeader(page: PdfPage, snapshot: ReportSnapshot, continuation: boolean) {
  if (continuation) {
    rect(page, 0, 794, PAGE_WIDTH, 48, COLORS.tealDark);
    text(page, MARGIN, 820, snapshot.organizationName, { color: "1 1 1", font: "bold", size: 10 });
    text(page, MARGIN, 805, "Laporan Perkembangan Hafalan", { color: "0.85 0.94 0.91", size: 8 });
    page.y = 774;
    return;
  }

  rect(page, 0, 720, PAGE_WIDTH, 122, COLORS.tealDark);
  rect(page, 0, 720, PAGE_WIDTH, 6, COLORS.teal);
  text(page, MARGIN, 810, snapshot.organizationName, { color: "1 1 1", font: "bold", size: 14 });
  text(page, MARGIN, 789, "LAPORAN PERKEMBANGAN HAFALAN", { color: "0.85 0.94 0.91", font: "bold", size: 10 });
  text(page, MARGIN, 760, snapshot.student.name, { color: "1 1 1", font: "bold", size: 23 });
  text(page, MARGIN, 741, `Santri ${snapshot.student.studentNumber}`, { color: "0.85 0.94 0.91", size: 10 });
  text(page, 397, 810, "DOKUMEN RESMI", { color: "0.85 0.94 0.91", font: "bold", size: 8 });
  text(page, 397, 793, `Versi ${snapshot.reportVersion ?? "-"}`, { color: "1 1 1", font: "bold", size: 11 });
  text(page, 397, 773, snapshot.reportNumber ?? "Pratinjau", { color: "1 1 1", size: 8 });
  page.y = 696;
}

function drawSectionTitle(page: PdfPage, title: string, subtitle?: string) {
  text(page, MARGIN, page.y, title, { font: "bold", size: 11, color: COLORS.tealDark });
  if (subtitle) text(page, MARGIN, page.y - 14, subtitle, { size: 8, color: COLORS.muted });
  line(page, MARGIN, page.y - (subtitle ? 21 : 10), PAGE_WIDTH - MARGIN, page.y - (subtitle ? 21 : 10), COLORS.tealLight);
  page.y -= subtitle ? 30 : 20;
}

function drawInfoCard(page: PdfPage, snapshot: ReportSnapshot) {
  const height = 86;
  rect(page, MARGIN, page.y - height, CONTENT_WIDTH, height, "1 1 1");
  border(page, MARGIN, page.y - height, CONTENT_WIDTH, height);
  const labelColor = COLORS.muted;
  text(page, MARGIN + 14, page.y - 20, "PERIODE PEMBELAJARAN", { font: "bold", size: 7, color: labelColor });
  text(page, MARGIN + 14, page.y - 35, snapshot.periodLabel, { font: "bold", size: 10 });
  text(page, MARGIN + 14, page.y - 53, `${formatDate(snapshot.periodStart)} - ${formatDate(snapshot.periodEnd)}`, { size: 8, color: labelColor });
  line(page, 290, page.y - 13, 290, page.y - height + 13);
  text(page, 306, page.y - 20, "HALAQAH", { font: "bold", size: 7, color: labelColor });
  textLines(page, 306, page.y - 35, wrap(snapshot.halaqahNames.join(", ") || "-", 35), { font: "bold", size: 9, leading: 12 });
  text(page, 306, page.y - 66, "PENGAJAR", { font: "bold", size: 7, color: labelColor });
  text(page, 306, page.y - 79, snapshot.teacherNames.join(", ") || "-", { size: 8 });
  page.y -= height + 18;
}

function drawMetricCard(page: PdfPage, x: number, label: string, value: number, accent: string) {
  const width = 157;
  const height = 52;
  rect(page, x, page.y - height, width, height, COLORS.soft);
  rect(page, x, page.y - height, 4, height, accent);
  text(page, x + 14, page.y - 19, label.toUpperCase(), { font: "bold", size: 7, color: COLORS.muted });
  text(page, x + 14, page.y - 43, String(value), { font: "bold", size: 19, color: COLORS.ink });
}

function fluencyColor(predicate: keyof typeof FLUENCY_LABELS) {
  if (predicate === "FLUENT") return COLORS.green;
  if (predicate === "FAIRLY_FLUENT") return COLORS.amber;
  return COLORS.red;
}

function drawSummary(page: PdfPage, snapshot: ReportSnapshot) {
  drawMetricCard(page, MARGIN, "Total setoran", snapshot.summary.totalRecords, COLORS.teal);
  drawMetricCard(page, MARGIN + 167, "Sabaq", snapshot.summary.categories.SABAQ, "0.14 0.41 0.70");
  drawMetricCard(page, MARGIN + 334, "Sabqi + Manzil", snapshot.summary.categories.SABQI + snapshot.summary.categories.MANZIL, "0.56 0.30 0.65");
  page.y -= 64;

  rect(page, MARGIN, page.y - 33, CONTENT_WIDTH, 33, "1 1 1");
  border(page, MARGIN, page.y - 33, CONTENT_WIDTH, 33);
  text(page, MARGIN + 12, page.y - 20, "KELANCARAN", { font: "bold", size: 7, color: COLORS.muted });
  let x = MARGIN + 122;
  (Object.keys(FLUENCY_LABELS) as Array<keyof typeof FLUENCY_LABELS>).forEach((predicate) => {
    const label = `${FLUENCY_LABELS[predicate]} ${snapshot.summary.fluencies[predicate]}`;
    text(page, x, page.y - 20, label, { font: "bold", size: 8, color: fluencyColor(predicate) });
    x += predicate === "FAIRLY_FLUENT" ? 128 : 108;
  });
  page.y -= 46;
}

function recordHeight(record: ReportSnapshot["records"][number]) {
  const noteLines = record.teacherNote ? wrap(`Catatan: ${record.teacherNote}`, 80).length : 0;
  const targetLines = record.nextTarget ? wrap(`Target berikutnya: ${record.nextTarget}`, 80).length : 0;
  return 31 + noteLines * 11 + targetLines * 11 + (noteLines || targetLines ? 7 : 0);
}

function drawTableHeader(page: PdfPage) {
  const y = page.y - 23;
  rect(page, MARGIN, y, CONTENT_WIDTH, 23, COLORS.teal);
  text(page, 53, y + 8, "TANGGAL", { font: "bold", size: 7, color: "1 1 1" });
  text(page, 111, y + 8, "JENIS", { font: "bold", size: 7, color: "1 1 1" });
  text(page, 162, y + 8, "HAFALAN", { font: "bold", size: 7, color: "1 1 1" });
  text(page, 295, y + 8, "KELANCARAN", { font: "bold", size: 7, color: "1 1 1" });
  text(page, 394, y + 8, "PENGAJAR / HALAQAH", { font: "bold", size: 7, color: "1 1 1" });
  page.y = y;
}

function drawRecord(page: PdfPage, record: ReportSnapshot["records"][number], index: number) {
  const height = recordHeight(record);
  const bottom = page.y - height;
  if (index % 2 === 0) rect(page, MARGIN, bottom, CONTENT_WIDTH, height, "0.98 0.99 0.99");
  line(page, MARGIN, bottom, PAGE_WIDTH - MARGIN, bottom);
  const top = page.y - 13;
  text(page, 53, top, formatDate(record.submissionDate), { size: 7 });
  text(page, 111, top, CATEGORY_LABELS[record.submissionCategory], { font: "bold", size: 8 });
  text(page, 162, top, `${record.surahName} ${record.startVerse}-${record.endVerse}`, { font: "bold", size: 8 });
  text(page, 295, top, FLUENCY_LABELS[record.fluencyPredicate], { font: "bold", size: 8, color: fluencyColor(record.fluencyPredicate) });
  text(page, 394, top, record.teacherName, { font: "bold", size: 8 });
  text(page, 394, top - 12, record.halaqahName, { size: 7, color: COLORS.muted });

  let detailY = top - 25;
  if (record.teacherNote) {
    const noteLines = wrap(`Catatan: ${record.teacherNote}`, 80);
    textLines(page, 162, detailY, noteLines, { size: 7, color: COLORS.muted, leading: 10 });
    detailY -= noteLines.length * 10;
  }
  if (record.nextTarget) {
    const targetLines = wrap(`Target berikutnya: ${record.nextTarget}`, 80);
    textLines(page, 162, detailY, targetLines, { size: 7, color: COLORS.muted, leading: 10 });
  }
  page.y = bottom;
}

function drawClosing(page: PdfPage, snapshot: ReportSnapshot) {
  drawSectionTitle(page, "Pengesahan");
  text(page, MARGIN, page.y - 3, "Dokumen ini dibuat dari snapshot data pada saat penerbitan.", { size: 8, color: COLORS.muted });
  text(page, MARGIN, page.y - 16, `Diterbitkan pada ${formatDate(snapshot.issuedAt.slice(0, 10))}.`, { size: 8, color: COLORS.muted });
  const signatureY = page.y - 66;
  line(page, MARGIN + 15, signatureY, MARGIN + 188, signatureY, COLORS.line);
  line(page, 358, signatureY, 531, signatureY, COLORS.line);
  text(page, MARGIN + 15, signatureY - 14, "Pengajar", { size: 8, color: COLORS.muted });
  text(page, 358, signatureY - 14, "Kepala Rumah Qur'an Ar-Rasyid", { size: 8, color: COLORS.muted });
}

function addFooter(page: PdfPage, pageNumber: number, pageCount: number) {
  line(page, MARGIN, 43, PAGE_WIDTH - MARGIN, 43, COLORS.line);
  text(page, MARGIN, 28, "Rumah Qur'an Ar-Rasyid", { font: "bold", size: 7, color: COLORS.muted });
  text(page, 427, 28, `Halaman ${pageNumber} dari ${pageCount}`, { size: 7, color: COLORS.muted });
}

export function buildReportPdf(snapshot: ReportSnapshot) {
  const pages: PdfPage[] = [];
  let page = addPage(pages);
  drawHeader(page, snapshot, false);
  drawSectionTitle(page, "Ringkasan Identitas");
  drawInfoCard(page, snapshot);
  drawSectionTitle(page, "Ringkasan Setoran", "Rekap setoran aktif pada periode laporan");
  drawSummary(page, snapshot);
  drawSectionTitle(page, "Riwayat Setoran", `${snapshot.records.length} setoran aktif tercatat`);
  drawTableHeader(page);

  snapshot.records.forEach((record, index) => {
    const height = recordHeight(record);
    if (page.y - height < 122) {
      page = addPage(pages);
      drawHeader(page, snapshot, true);
      drawSectionTitle(page, "Riwayat Setoran (lanjutan)");
      drawTableHeader(page);
    }
    drawRecord(page, record, index);
  });

  if (page.y < 150) {
    page = addPage(pages);
    drawHeader(page, snapshot, true);
  }
  page.y -= 24;
  drawClosing(page, snapshot);

  pages.forEach((currentPage, index) => addFooter(currentPage, index + 1, pages.length));

  const pageObjectNumbers = pages.map((_, index) => 3 + index * 2);
  const fontObjectNumber = 3 + pages.length * 2;
  const boldFontObjectNumber = fontObjectNumber + 1;
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  ];

  pages.forEach((currentPage, index) => {
    const content = currentPage.commands.join("\n");
    const pageObjectNumber = pageObjectNumbers[index];
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R /F2 ${boldFontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
      `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    );
  });
  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  );

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}
