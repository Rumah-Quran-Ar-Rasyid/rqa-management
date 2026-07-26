import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../src/generated/prisma/client";
import { collectPilotReadiness } from "./pilot-readiness";

function prismaMock({ students = 10 }: { students?: number } = {}) {
  return {
    organization: { findMany: vi.fn().mockResolvedValue([{ id: "org-1", timezone: "Asia/Jakarta" }]) },
    user: { count: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(2) },
    academicPeriod: { count: vi.fn().mockResolvedValue(1) },
    halaqah: { count: vi.fn().mockResolvedValue(2) },
    student: { count: vi.fn().mockResolvedValue(students) },
    halaqahTeacherAssignment: { count: vi.fn().mockResolvedValue(2) },
    halaqahMembership: { count: vi.fn().mockResolvedValue(students) },
    quranSurah: { count: vi.fn().mockResolvedValue(114) },
  } as unknown as PrismaClient;
}

describe("pilot readiness", () => {
  it("meluluskan komposisi minimum pilot", async () => {
    const checks = await collectPilotReadiness(
      prismaMock(),
      new Date("2026-07-26T00:00:00.000Z"),
    );
    expect(checks.every((check) => check.ok)).toBe(true);
  });

  it("menolak jumlah santri di bawah batas pilot", async () => {
    const checks = await collectPilotReadiness(
      prismaMock({ students: 9 }),
      new Date("2026-07-26T00:00:00.000Z"),
    );
    expect(checks.find((check) => check.name === "Santri aktif")?.ok).toBe(false);
  });
});
