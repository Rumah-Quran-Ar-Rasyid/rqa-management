import { describe, expect, it } from "vitest";

import {
  canAccessStudentDirectory,
  canChangeStudentStatus,
  canEditStudent,
  canManageStudents,
} from "./student-policy";

describe("student policy", () => {
  it("mengizinkan Admin mengelola santri dan Kepala melihatnya", () => {
    expect(canAccessStudentDirectory(["ADMIN"])).toBe(true);
    expect(canManageStudents(["ADMIN"])).toBe(true);
    expect(canAccessStudentDirectory(["HEAD"])).toBe(true);
    expect(canManageStudents(["HEAD"])).toBe(false);
  });

  it("mencegah Pengajar mengakses daftar santri operasional", () => {
    expect(canAccessStudentDirectory(["TEACHER"])).toBe(false);
  });

  it("menjaga santri terarsip sebagai status akhir", () => {
    expect(canEditStudent("ARCHIVED")).toBe(false);
    expect(
      canChangeStudentStatus({
        currentStatus: "ARCHIVED",
        nextStatus: "ACTIVE",
      }),
    ).toBe(false);
  });
});
