import { describe, expect, it } from "vitest";

import { generateSessionToken, hashSessionToken } from "./session-token";

describe("session token", () => {
  it("membuat token acak yang berbeda", () => {
    const first = generateSessionToken();
    const second = generateSessionToken();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(43);
  });

  it("menghasilkan hash tetap tanpa menyimpan token mentah", () => {
    const token = "token-lokal";
    const secret = "s".repeat(32);

    expect(hashSessionToken(token, secret)).toHaveLength(64);
    expect(hashSessionToken(token, secret)).toBe(
      hashSessionToken(token, secret),
    );
    expect(hashSessionToken(token, "x".repeat(32))).not.toBe(
      hashSessionToken(token, secret),
    );
  });
});
