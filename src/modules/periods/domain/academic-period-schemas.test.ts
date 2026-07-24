import { describe, expect, it } from "vitest";

import {
  academicPeriodReasonSchema,
  createAcademicPeriodSchema,
} from "./academic-period-schemas";

describe("academic period schemas", () => {
  it("menolak rentang tanggal yang terbalik", () => {
    const result = createAcademicPeriodSchema.safeParse({
      name: "Semester Ganjil",
      startDate: "2026-07-01",
      endDate: "2026-06-30",
    });

    expect(result.success).toBe(false);
  });

  it("menolak tanggal kalender yang tidak ada", () => {
    const result = createAcademicPeriodSchema.safeParse({
      name: "Semester Ganjil",
      startDate: "2026-02-30",
      endDate: "2026-07-01",
    });

    expect(result.success).toBe(false);
  });

  it("mewajibkan alasan saat menutup atau membuka kembali", () => {
    const result = academicPeriodReasonSchema.safeParse({
      periodId: "period-1",
      reason: "   ",
    });

    expect(result.success).toBe(false);
  });
});
