import { describe, expect, it, vi } from "vitest";

import { parseServerEnv } from "./env-schema";

const validEnv = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/rqa",
  AUTH_SECRET: "a-secure-secret-with-at-least-32-characters",
  APP_URL: "http://localhost:3000",
};

describe("parseServerEnv", () => {
  it("menerima konfigurasi server yang valid", () => {
    expect(parseServerEnv(validEnv)).toEqual(validEnv);
  });

  it("menolak provider database selain PostgreSQL", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      parseServerEnv({
        ...validEnv,
        DATABASE_URL: "mysql://localhost/rqa",
      }),
    ).toThrow("Invalid server environment variables");
  });

  it("menolak secret yang terlalu pendek", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      parseServerEnv({
        ...validEnv,
        AUTH_SECRET: "terlalu-pendek",
      }),
    ).toThrow("Invalid server environment variables");
  });
});
