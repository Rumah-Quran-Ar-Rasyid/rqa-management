import { describe, expect, it } from "vitest";

import { createHalaqahMembershipSchema } from "./halaqah-membership-schemas";

describe("halaqah membership schema", () => {
  it("menolak tanggal mulai yang tidak valid", () => {
    const result = createHalaqahMembershipSchema.safeParse({
      studentId: "santri-1",
      halaqahId: "halaqah-1",
      validFrom: "2026-02-30",
    });

    expect(result.success).toBe(false);
  });
});
