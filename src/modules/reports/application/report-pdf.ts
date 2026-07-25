import type { ReportSnapshot } from "./report-service";

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

function wrap(value: string, width = 88) {
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

function reportLines(snapshot: ReportSnapshot) {
  const lines = [
    { text: snapshot.organizationName, size: 16 },
    { text: "LAPORAN PERKEMBANGAN HAFALAN", size: 13 },
    { text: `Nomor laporan: ${snapshot.reportNumber ?? "Pratinjau"}`, size: 9 },
    { text: "", size: 9 },
    { text: `Santri: ${snapshot.student.name} (${snapshot.student.studentNumber})`, size: 10 },
    { text: `Periode: ${snapshot.periodLabel}`, size: 10 },
    { text: `Rentang: ${formatDate(snapshot.periodStart)} - ${formatDate(snapshot.periodEnd)}`, size: 10 },
    { text: `Halaqah: ${snapshot.halaqahNames.join(", ")}`, size: 10 },
    { text: `Pengajar: ${snapshot.teacherNames.join(", ")}`, size: 10 },
    { text: "", size: 9 },
    { text: "RINGKASAN", size: 12 },
    {
      text: `Total setoran aktif: ${snapshot.summary.totalRecords} | Sabaq: ${snapshot.summary.categories.SABAQ} | Sabqi: ${snapshot.summary.categories.SABQI} | Manzil: ${snapshot.summary.categories.MANZIL}`,
      size: 9,
    },
    {
      text: `Kelancaran: Lancar ${snapshot.summary.fluencies.FLUENT} | Cukup Lancar ${snapshot.summary.fluencies.FAIRLY_FLUENT} | Kurang Lancar ${snapshot.summary.fluencies.LESS_FLUENT}`,
      size: 9,
    },
    { text: "", size: 9 },
    { text: "RIWAYAT SETORAN", size: 12 },
  ];

  for (const record of snapshot.records) {
    lines.push({
      text: `${formatDate(record.submissionDate)} | ${CATEGORY_LABELS[record.submissionCategory]} | ${record.surahName} ${record.startVerse}-${record.endVerse} | ${FLUENCY_LABELS[record.fluencyPredicate]}`,
      size: 9,
    });
    lines.push({ text: `Halaqah: ${record.halaqahName} | Pengajar: ${record.teacherName}`, size: 8 });
    if (record.teacherNote) lines.push({ text: `Catatan: ${record.teacherNote}`, size: 8 });
    if (record.nextTarget) lines.push({ text: `Target berikutnya: ${record.nextTarget}`, size: 8 });
    lines.push({ text: "", size: 7 });
  }

  lines.push({ text: `Diterbitkan pada ${formatDate(snapshot.issuedAt.slice(0, 10))}.`, size: 8 });
  return lines.flatMap((line) => wrap(line.text).map((text) => ({ ...line, text })));
}

export function buildReportPdf(snapshot: ReportSnapshot) {
  const lines = reportLines(snapshot);
  const pages: string[] = [];
  let commands: string[] = [];
  let y = 790;

  const startPage = () => {
    commands = ["0.12 0.16 0.22 rg"];
    y = 790;
  };
  const finishPage = () => {
    commands.push(`BT /F1 8 Tf 0.35 0.35 0.35 rg 50 32 Td (Rumah Qur'an Ar-Rasyid) Tj ET`);
    pages.push(commands.join("\n"));
  };

  startPage();
  for (const line of lines) {
    const leading = line.size >= 12 ? 19 : line.size >= 10 ? 16 : 13;
    if (y - leading < 55) {
      finishPage();
      startPage();
    }
    commands.push(`BT /F1 ${line.size} Tf 50 ${y} Td (${pdfText(line.text)}) Tj ET`);
    y -= leading;
  }
  finishPage();

  const pageObjectNumbers = pages.map((_, index) => 3 + index * 2);
  const fontObjectNumber = 3 + pages.length * 2;
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  ];

  pages.forEach((content, index) => {
    const pageObjectNumber = pageObjectNumbers[index];
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
      `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    );
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}
