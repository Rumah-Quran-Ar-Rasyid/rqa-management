import { describe, expect, it } from "vitest";

import { createStudentSchema } from "./student-schemas";

const student = {
  studentNumber: "S-001",
  fullName: "Ahmad Fulan",
  preferredName: "Ahmad",
  joinedAt: "2026-07-25",
  guardianFullName: "",
  guardianPhone: "",
  guardianEmail: "",
  guardianRelationship: "",
};

describe("student schemas", () => {
  it("mengizinkan santri disimpan tanpa kontak wali", () => {
    expect(createStudentSchema.safeParse(student).success).toBe(true);
  });

  it("mewajibkan detail inti ketika kontak wali mulai diisi", () => {
    const result = createStudentSchema.safeParse({
      ...student,
      guardianFullName: "Ibu Fulan",
    });

    expect(result.success).toBe(false);
  });

  it("menolak nomor santri kosong dan tanggal tidak valid", () => {
    const result = createStudentSchema.safeParse({
      ...student,
      studentNumber: " ",
      joinedAt: "2026-02-30",
    });

    expect(result.success).toBe(false);
  });
});
