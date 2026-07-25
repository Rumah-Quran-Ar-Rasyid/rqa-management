import { describe, expect, it } from "vitest";

import { createMemorizationRecordSchema } from "./memorization-schemas";

const values = {
  halaqahId: "halaqah-1",
  studentId: "santri-1",
  submissionCategory: "SABAQ" as const,
  surahNumber: "1",
  startVerse: "1",
  endVerse: "7",
  fluencyPredicate: "FLUENT" as const,
  teacherNote: "",
  nextTarget: "",
  pageNumber: "",
  duplicateOverride: false,
  duplicateOverrideReason: "",
};

describe("memorization record schema", () => {
  it("menolak rentang ayat terbalik", () => {
    const result = createMemorizationRecordSchema.safeParse({
      ...values,
      startVerse: "7",
      endVerse: "1",
    });

    expect(result.success).toBe(false);
  });

  it("mewajibkan alasan ketika duplikasi dikonfirmasi", () => {
    const result = createMemorizationRecordSchema.safeParse({
      ...values,
      duplicateOverride: true,
    });

    expect(result.success).toBe(false);
  });

  it("menormalkan field opsional kosong", () => {
    const result = createMemorizationRecordSchema.parse(values);

    expect(result.teacherNote).toBeUndefined();
    expect(result.pageNumber).toBeUndefined();
  });
});
