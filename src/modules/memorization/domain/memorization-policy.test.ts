import { describe, expect, it } from "vitest";

import {
  canCreateMemorizationRecord,
  isDateWithinRange,
} from "./memorization-policy";

describe("memorization policy", () => {
  it("hanya mengizinkan Pengajar mencatat setoran", () => {
    expect(canCreateMemorizationRecord(["TEACHER"])).toBe(true);
    expect(canCreateMemorizationRecord(["ADMIN"])).toBe(false);
    expect(canCreateMemorizationRecord(["HEAD"])).toBe(false);
  });

  it("memeriksa batas tanggal penugasan dan membership secara inklusif", () => {
    expect(
      isDateWithinRange({
        date: "2026-07-25",
        validFrom: "2026-07-01",
        validUntil: "2026-07-25",
      }),
    ).toBe(true);
    expect(
      isDateWithinRange({
        date: "2026-07-26",
        validFrom: "2026-07-01",
        validUntil: "2026-07-25",
      }),
    ).toBe(false);
  });
});
