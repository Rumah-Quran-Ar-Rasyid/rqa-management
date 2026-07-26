import { describe, expect, it } from "vitest";

import { createHalaqahSchema } from "./halaqah-schemas";

describe("halaqah schemas", () => {
  it("menormalkan keterangan kosong menjadi undefined", () => {
    expect(
      createHalaqahSchema.parse({
        name: "Halaqah An-Nur",
        description: "   ",
      }),
    ).toMatchObject({
      name: "Halaqah An-Nur",
      description: undefined,
    });
  });

  it("menolak nama halaqah terlalu pendek", () => {
    const result = createHalaqahSchema.safeParse({
      name: "A",
      description: "",
    });

    expect(result.success).toBe(false);
  });
});
