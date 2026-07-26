import { describe, expect, it } from "vitest";

import { createTeacherAssignmentSchema } from "./teacher-assignment-schemas";

describe("teacher assignment schemas", () => {
  it("menolak Pengajar Pengganti tanpa tanggal selesai", () => {
    const result = createTeacherAssignmentSchema.safeParse({
      halaqahId: "halaqah-1",
      teacherUserId: "teacher-1",
      assignmentType: "SUBSTITUTE",
      validFrom: "2026-07-25",
      validUntil: "",
    });

    expect(result.success).toBe(false);
  });

  it("menormalkan tanggal selesai kosong untuk Pengajar Utama", () => {
    const result = createTeacherAssignmentSchema.parse({
      halaqahId: "halaqah-1",
      teacherUserId: "teacher-1",
      assignmentType: "PRIMARY",
      validFrom: "2026-07-25",
      validUntil: "",
    });

    expect(result.validUntil).toBeUndefined();
  });
});
