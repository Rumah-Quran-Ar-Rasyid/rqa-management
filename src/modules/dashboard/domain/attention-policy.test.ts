import { describe, expect, it } from "vitest";

import { attentionReasons, sevenDaysBefore } from "./attention-policy";

describe("attention policy", () => {
  it("menandai santri tanpa setoran selama minimal tujuh hari kalender", () => {
    expect(sevenDaysBefore("2026-07-25")).toBe("2026-07-18");
    expect(
      attentionReasons({
        today: "2026-07-25",
        lastSubmissionDate: "2026-07-18",
        lastFluencyPredicate: "FLUENT",
      }),
    ).toEqual(["NO_RECENT_RECORD"]);
  });

  it("menandai predikat terakhir Kurang Lancar walaupun setoran masih baru", () => {
    expect(
      attentionReasons({
        today: "2026-07-25",
        lastSubmissionDate: "2026-07-24",
        lastFluencyPredicate: "LESS_FLUENT",
      }),
    ).toEqual(["LESS_FLUENT"]);
  });

  it("menandai santri yang belum pernah memiliki setoran", () => {
    expect(
      attentionReasons({
        today: "2026-07-25",
        lastSubmissionDate: null,
        lastFluencyPredicate: null,
      }),
    ).toEqual(["NO_RECENT_RECORD"]);
  });
});
