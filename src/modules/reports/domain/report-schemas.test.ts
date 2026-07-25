import { describe, expect, it } from "vitest";

import { reportRequestSchema } from "./report-schemas";

describe("report request schema", () => {
  it("menerima pilihan periode pembelajaran", () => {
    expect(
      reportRequestSchema.safeParse({
        studentId: "santri-1",
        selectionType: "ACADEMIC_PERIOD",
        academicPeriodId: "periode-1",
      }).success,
    ).toBe(true);
  });

  it("menolak rentang tanggal yang terbalik", () => {
    const result = reportRequestSchema.safeParse({
      studentId: "santri-1",
      selectionType: "CUSTOM_RANGE",
      periodStart: "2026-07-31",
      periodEnd: "2026-07-01",
    });

    expect(result.success).toBe(false);
  });
});
