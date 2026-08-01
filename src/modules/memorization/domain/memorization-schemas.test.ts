import { describe, expect, it } from "vitest";

import {
  correctMemorizationRecordSchema,
  createMemorizationRecordSchema,
  voidMemorizationRecordSchema,
} from "./memorization-schemas";

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

  it("menerima field opsional yang tidak dikirim oleh Server Action", () => {
    const result = createMemorizationRecordSchema.parse({
      ...values,
      teacherNote: undefined,
      nextTarget: undefined,
      pageNumber: undefined,
      duplicateOverrideReason: undefined,
    });

    expect(result.duplicateOverrideReason).toBeUndefined();
  });
});

describe("memorization correction schemas", () => {
  it("mewajibkan alasan pada koreksi dan pembatalan", () => {
    expect(
      correctMemorizationRecordSchema.safeParse({
        recordId: "record-1",
        submissionCategory: "SABAQ",
        surahNumber: 1,
        startVerse: 1,
        endVerse: 7,
        fluencyPredicate: "FLUENT",
        teacherNote: "",
        nextTarget: "",
        pageNumber: "",
        reason: "",
      }).success,
    ).toBe(false);
    expect(
      voidMemorizationRecordSchema.safeParse({
        recordId: "record-1",
        reason: "",
      }).success,
    ).toBe(false);
  });

  it("menolak rentang ayat koreksi yang terbalik", () => {
    const result = correctMemorizationRecordSchema.safeParse({
      recordId: "record-1",
      submissionCategory: "SABAQ",
      surahNumber: 1,
      startVerse: 7,
      endVerse: 1,
      fluencyPredicate: "FLUENT",
      teacherNote: "",
      nextTarget: "",
      pageNumber: "",
      reason: "Perbaikan catatan.",
    });

    expect(result.success).toBe(false);
  });
});
