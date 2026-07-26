import { describe, expect, it } from "vitest";

import { parseMemorizationHistoryFilters } from "./memorization-history-filter";

describe("memorization history filters", () => {
  it("menerima filter periode, kategori, dan halaman yang valid", () => {
    expect(
      parseMemorizationHistoryFilters({
        academicPeriodId: "period-2026",
        submissionCategory: "MANZIL",
        page: "2",
      }),
    ).toEqual({
      academicPeriodId: "period-2026",
      submissionCategory: "MANZIL",
      page: 2,
    });
  });

  it("mengabaikan query filter yang tidak valid", () => {
    expect(
      parseMemorizationHistoryFilters({
        academicPeriodId: ["period-a", "period-b"],
        submissionCategory: "UNKNOWN",
        page: "0",
      }),
    ).toEqual({ page: 1 });
  });

  it("menggunakan halaman pertama saat filter tidak diisi", () => {
    expect(parseMemorizationHistoryFilters({})).toEqual({ page: 1 });
  });
});
