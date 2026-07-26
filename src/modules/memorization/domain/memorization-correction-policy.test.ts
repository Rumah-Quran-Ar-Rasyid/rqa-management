import { describe, expect, it } from "vitest";

import {
  canAccessMemorizationRecord,
  canCorrectMemorizationRecord,
  canVoidMemorizationRecord,
  isWithinTeacherCorrectionWindow,
} from "./memorization-correction-policy";

const now = new Date("2026-07-25T10:00:00.000Z");

describe("memorization correction policy", () => {
  it("membatasi detail record Pengajar pada record miliknya", () => {
    expect(
      canAccessMemorizationRecord({
        actorId: "teacher-a",
        actorRoles: ["TEACHER"],
        teacherUserId: "teacher-a",
      }),
    ).toBe(true);
    expect(
      canAccessMemorizationRecord({
        actorId: "teacher-a",
        actorRoles: ["TEACHER"],
        teacherUserId: "teacher-b",
      }),
    ).toBe(false);
    expect(
      canAccessMemorizationRecord({
        actorId: "head-a",
        actorRoles: ["HEAD"],
        teacherUserId: "teacher-a",
      }),
    ).toBe(true);
  });

  it("mengizinkan Pengajar mengoreksi record miliknya sampai batas 24 jam", () => {
    expect(
      canCorrectMemorizationRecord({
        actorId: "teacher-a",
        actorRoles: ["TEACHER"],
        teacherUserId: "teacher-a",
        createdAt: new Date("2026-07-24T10:00:00.000Z"),
        academicPeriodStatus: "ACTIVE",
        recordStatus: "ACTIVE",
        now,
      }),
    ).toBe(true);
  });

  it("menolak Pengajar untuk record orang lain atau record yang melewati batas", () => {
    expect(
      canCorrectMemorizationRecord({
        actorId: "teacher-a",
        actorRoles: ["TEACHER"],
        teacherUserId: "teacher-b",
        createdAt: new Date("2026-07-25T09:00:00.000Z"),
        academicPeriodStatus: "ACTIVE",
        recordStatus: "ACTIVE",
        now,
      }),
    ).toBe(false);
    expect(
      isWithinTeacherCorrectionWindow({
        createdAt: new Date("2026-07-24T09:59:59.999Z"),
        now,
      }),
    ).toBe(false);
  });

  it("mengizinkan Kepala mengoreksi dan membatalkan record aktif", () => {
    const context = {
      actorId: "head-a",
      actorRoles: ["HEAD" as const],
      teacherUserId: "teacher-a",
      createdAt: new Date("2026-07-20T10:00:00.000Z"),
      academicPeriodStatus: "ACTIVE" as const,
      recordStatus: "ACTIVE" as const,
    };

    expect(canCorrectMemorizationRecord({ ...context, now })).toBe(true);
    expect(canVoidMemorizationRecord(context)).toBe(true);
  });

  it("menolak koreksi dan void pada periode ditutup atau record dibatalkan", () => {
    expect(
      canCorrectMemorizationRecord({
        actorId: "head-a",
        actorRoles: ["HEAD"],
        teacherUserId: "teacher-a",
        createdAt: now,
        academicPeriodStatus: "CLOSED",
        recordStatus: "ACTIVE",
        now,
      }),
    ).toBe(false);
    expect(
      canVoidMemorizationRecord({
        actorRoles: ["HEAD"],
        academicPeriodStatus: "ACTIVE",
        recordStatus: "VOID",
      }),
    ).toBe(false);
  });

  it("menolak Admin tanpa role Kepala untuk koreksi dan pembatalan", () => {
    const context = {
      actorId: "admin-a",
      actorRoles: ["ADMIN" as const],
      teacherUserId: "teacher-a",
      createdAt: now,
      academicPeriodStatus: "ACTIVE" as const,
      recordStatus: "ACTIVE" as const,
    };

    expect(canCorrectMemorizationRecord({ ...context, now })).toBe(false);
    expect(canVoidMemorizationRecord(context)).toBe(false);
  });
});
