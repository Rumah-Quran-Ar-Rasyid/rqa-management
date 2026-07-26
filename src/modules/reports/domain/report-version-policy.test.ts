import { describe, expect, it } from "vitest";

import { canSupersedeReport } from "./report-version-policy";

const scope = {
  studentId: "santri-1",
  academicPeriodId: "periode-1",
  periodStart: "2026-01-01",
  periodEnd: "2026-06-30",
};

describe("report version policy", () => {
  it("hanya menggantikan laporan berlaku dengan scope yang sama", () => {
    expect(
      canSupersedeReport({
        candidateScope: scope,
        candidateStatus: "ISSUED",
        nextScope: scope,
      }),
    ).toBe(true);
    expect(
      canSupersedeReport({
        candidateScope: scope,
        candidateStatus: "SUPERSEDED",
        nextScope: scope,
      }),
    ).toBe(false);
    expect(
      canSupersedeReport({
        candidateScope: scope,
        candidateStatus: "ISSUED",
        nextScope: { ...scope, periodEnd: "2026-07-31" },
      }),
    ).toBe(false);
  });
});
