import { describe, expect, it } from "vitest";

import { canAccessHeadDashboard } from "./head-dashboard-policy";

describe("head dashboard policy", () => {
  it("hanya mengizinkan Kepala melihat dashboard akademik", () => {
    expect(canAccessHeadDashboard(["HEAD"])).toBe(true);
    expect(canAccessHeadDashboard(["ADMIN"])).toBe(false);
    expect(canAccessHeadDashboard(["TEACHER"])).toBe(false);
  });
});
