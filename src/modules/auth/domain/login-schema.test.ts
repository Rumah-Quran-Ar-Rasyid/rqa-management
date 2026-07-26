import { describe, expect, it } from "vitest";

import { loginSchema } from "./login-schema";

describe("loginSchema", () => {
  it("merapikan dan menormalkan email", () => {
    expect(
      loginSchema.parse({
        email: "  Admin@Example.com ",
        password: "rahasia",
      }),
    ).toEqual({
      email: "admin@example.com",
      password: "rahasia",
    });
  });

  it("menolak email dan kata sandi kosong", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });

    expect(result.success).toBe(false);
  });
});
