import { describe, expect, it } from "vitest";

import { createTeacherSchema } from "./user-schemas";

describe("createTeacherSchema", () => {
  it("menormalkan email dan mengosongkan nomor telepon opsional", () => {
    expect(
      createTeacherSchema.parse({
        name: "Ustadz Ahmad",
        email: "  AHMAD@EXAMPLE.COM ",
        phone: "   ",
        password: "kata-sandi-awal",
      }),
    ).toMatchObject({
      name: "Ustadz Ahmad",
      email: "ahmad@example.com",
      phone: undefined,
    });
  });

  it("menolak kata sandi awal yang terlalu pendek", () => {
    const result = createTeacherSchema.safeParse({
      name: "Ustadz Ahmad",
      email: "ahmad@example.com",
      phone: "",
      password: "pendek",
    });

    expect(result.success).toBe(false);
  });
});
