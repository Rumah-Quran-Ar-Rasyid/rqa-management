import { describe, expect, it } from "vitest";

import { buildReportPdf } from "./report-pdf";
import type { ReportSnapshot } from "./report-service";

const snapshot: ReportSnapshot = {
  schemaVersion: 1,
  reportNumber: "RQA-TEST-001",
  reportVersion: 1,
  organizationName: "Rumah Qur'an Ar-Rasyid",
  issuedAt: "2026-07-25T08:00:00.000Z",
  student: { id: "santri-1", name: "Rayyan", studentNumber: "DEMO-001" },
  academicPeriod: { id: "periode-1", name: "Periode Demo" },
  periodStart: "2026-01-01",
  periodEnd: "2026-07-25",
  periodLabel: "Periode Demo",
  halaqahNames: ["Halaqah Al-Fatihah"],
  teacherNames: ["Ustadz Ahmad"],
  summary: {
    totalRecords: 1,
    categories: { SABAQ: 1, SABQI: 0, MANZIL: 0 },
    fluencies: { FLUENT: 1, FAIRLY_FLUENT: 0, LESS_FLUENT: 0 },
  },
  records: [{
    id: "record-1",
    submissionDate: "2026-07-25",
    submissionCategory: "SABAQ",
    fluencyPredicate: "FLUENT",
    surahName: "An-Naba",
    startVerse: 1,
    endVerse: 10,
    halaqahName: "Halaqah Al-Fatihah",
    teacherName: "Ustadz Ahmad",
    teacherNote: "Lancar.",
    nextTarget: null,
  }],
};

describe("report PDF", () => {
  it("membuat dokumen PDF yang dapat diunduh dari snapshot", () => {
    const pdf = buildReportPdf(snapshot);

    expect(pdf.subarray(0, 8).toString("latin1")).toBe("%PDF-1.4");
    expect(pdf.toString("latin1")).toContain("RQA-TEST-001");
  });
});
