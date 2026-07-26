import { describe, expect, it } from "vitest";

import {
  assignmentRangesOverlap,
  canAccessTeacherAssignments,
  canManageTeacherAssignments,
  requiresEndDate,
} from "./teacher-assignment-policy";

describe("teacher assignment policy", () => {
  it("mengizinkan Admin mengelola dan Kepala melihat penugasan", () => {
    expect(canAccessTeacherAssignments(["ADMIN"])).toBe(true);
    expect(canManageTeacherAssignments(["ADMIN"])).toBe(true);
    expect(canAccessTeacherAssignments(["HEAD"])).toBe(true);
    expect(canManageTeacherAssignments(["HEAD"])).toBe(false);
  });

  it("mendeteksi rentang Pengajar Utama yang saling tumpang tindih", () => {
    expect(
      assignmentRangesOverlap({
        firstStart: "2026-07-01",
        firstEnd: null,
        secondStart: "2026-07-20",
        secondEnd: "2026-08-01",
      }),
    ).toBe(true);
    expect(
      assignmentRangesOverlap({
        firstStart: "2026-07-01",
        firstEnd: "2026-07-15",
        secondStart: "2026-07-16",
        secondEnd: null,
      }),
    ).toBe(false);
  });

  it("mewajibkan tanggal selesai untuk Pengajar Pengganti", () => {
    expect(requiresEndDate("SUBSTITUTE")).toBe(true);
    expect(requiresEndDate("PRIMARY")).toBe(false);
  });
});
