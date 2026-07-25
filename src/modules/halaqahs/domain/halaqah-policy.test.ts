import { describe, expect, it } from "vitest";

import {
  canAccessHalaqahDirectory,
  canChangeHalaqahStatus,
  canEditHalaqah,
  canManageHalaqahs,
} from "./halaqah-policy";

describe("halaqah policy", () => {
  it("mengizinkan Admin mengelola halaqah dan Kepala melihatnya", () => {
    expect(canAccessHalaqahDirectory(["ADMIN"])).toBe(true);
    expect(canManageHalaqahs(["ADMIN"])).toBe(true);
    expect(canAccessHalaqahDirectory(["HEAD"])).toBe(true);
    expect(canManageHalaqahs(["HEAD"])).toBe(false);
  });

  it("mencegah Pengajar membuka daftar halaqah operasional", () => {
    expect(canAccessHalaqahDirectory(["TEACHER"])).toBe(false);
  });

  it("menjaga arsip sebagai status akhir", () => {
    expect(canEditHalaqah("ARCHIVED")).toBe(false);
    expect(
      canChangeHalaqahStatus({
        currentStatus: "ARCHIVED",
        nextStatus: "ACTIVE",
      }),
    ).toBe(false);
    expect(
      canChangeHalaqahStatus({
        currentStatus: "ACTIVE",
        nextStatus: "INACTIVE",
      }),
    ).toBe(true);
  });
});
