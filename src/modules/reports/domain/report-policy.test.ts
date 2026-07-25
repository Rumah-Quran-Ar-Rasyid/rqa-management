import { describe, expect, it } from "vitest";

import { canGenerateReports } from "./report-policy";

describe("report policy", () => {
  it("mengizinkan Admin dan Kepala membuat laporan, bukan Pengajar", () => {
    expect(canGenerateReports(["ADMIN"])).toBe(true);
    expect(canGenerateReports(["HEAD"])).toBe(true);
    expect(canGenerateReports(["TEACHER"])).toBe(false);
  });
});
