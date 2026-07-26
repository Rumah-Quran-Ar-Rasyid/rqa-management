import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { pilotDataSchema } from "./pilot-data-schema";

const example = JSON.parse(
  readFileSync("prisma/pilot-data.example.json", "utf8"),
) as unknown;

describe("pilot data schema", () => {
  it("menerima template pilot repository", () => {
    expect(pilotDataSchema.safeParse(example).success).toBe(true);
  });

  it("menolak kelompok tanpa Pengajar yang cocok", () => {
    const source = example as {
      halaqahs: Array<Record<string, unknown>>;
    } & Record<string, unknown>;
    const parsed = pilotDataSchema.safeParse({
      ...source,
      halaqahs: [
        {
          ...source.halaqahs[0],
          teacherEmail: "bukan-pengajar@example.com",
        },
        source.halaqahs[1],
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("menolak data di luar batas 10-20 santri", () => {
    const source = example as { students: unknown[] } & Record<string, unknown>;
    expect(
      pilotDataSchema.safeParse({ ...source, students: source.students.slice(0, 9) })
        .success,
    ).toBe(false);
  });
});
