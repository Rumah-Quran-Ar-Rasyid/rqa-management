import { describe, expect, it } from "vitest";

import { parseHeadDashboardFilters } from "./head-dashboard-filter";

describe("head dashboard filters", () => {
  it("menerima filter periode dan halaqah yang valid", () => {
    expect(
      parseHeadDashboardFilters({
        academicPeriodId: "period-2026",
        halaqahId: "halaqah-a",
      }),
    ).toEqual({
      academicPeriodId: "period-2026",
      halaqahId: "halaqah-a",
    });
  });

  it("mengabaikan query ganda tanpa membuang filter lain yang valid", () => {
    expect(
      parseHeadDashboardFilters({
        academicPeriodId: ["period-a", "period-b"],
        halaqahId: "halaqah-a",
      }),
    ).toEqual({ halaqahId: "halaqah-a" });
  });

  it("mengabaikan query kosong", () => {
    expect(
      parseHeadDashboardFilters({
        academicPeriodId: " ",
        halaqahId: "",
      }),
    ).toEqual({});
  });
});
