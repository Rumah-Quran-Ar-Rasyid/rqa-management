import { describe, expect, it } from "vitest";

import {
  canAccessHalaqahMemberships,
  canManageHalaqahMemberships,
  canMoveMembership,
} from "./halaqah-membership-policy";

describe("halaqah membership policy", () => {
  it("mengizinkan Admin mengelola dan Kepala melihat membership", () => {
    expect(canAccessHalaqahMemberships(["ADMIN"])).toBe(true);
    expect(canManageHalaqahMemberships(["ADMIN"])).toBe(true);
    expect(canAccessHalaqahMemberships(["HEAD"])).toBe(true);
    expect(canManageHalaqahMemberships(["HEAD"])).toBe(false);
  });

  it("hanya mengizinkan pindah setelah membership sebelumnya dimulai", () => {
    expect(
      canMoveMembership({
        currentValidFrom: "2026-07-01",
        nextValidFrom: "2026-07-02",
      }),
    ).toBe(true);
    expect(
      canMoveMembership({
        currentValidFrom: "2026-07-01",
        nextValidFrom: "2026-07-01",
      }),
    ).toBe(false);
  });
});
