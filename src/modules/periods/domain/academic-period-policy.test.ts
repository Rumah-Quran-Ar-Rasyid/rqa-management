import { describe, expect, it } from "vitest";

import {
  canAccessAcademicPeriods,
  canCloseAcademicPeriod,
  canManageAcademicPeriods,
  canReopenAcademicPeriod,
} from "./academic-period-policy";

describe("academic period policy", () => {
  it("mengizinkan Admin membuat dan mengaktifkan periode", () => {
    expect(canAccessAcademicPeriods(["ADMIN"])).toBe(true);
    expect(canManageAcademicPeriods(["ADMIN"])).toBe(true);
    expect(canCloseAcademicPeriod(["ADMIN"])).toBe(false);
  });

  it("mengizinkan Kepala melihat, menutup, dan membuka kembali periode", () => {
    expect(canAccessAcademicPeriods(["HEAD"])).toBe(true);
    expect(canManageAcademicPeriods(["HEAD"])).toBe(false);
    expect(canCloseAcademicPeriod(["HEAD"])).toBe(true);
    expect(canReopenAcademicPeriod(["HEAD"])).toBe(true);
  });

  it("mencegah Pengajar mengakses periode operasional", () => {
    expect(canAccessAcademicPeriods(["TEACHER"])).toBe(false);
  });
});
