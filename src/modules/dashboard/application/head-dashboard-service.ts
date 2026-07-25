import "server-only";

import type { SubmissionCategory } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import { canAccessHeadDashboard } from "@/modules/dashboard/domain/head-dashboard-policy";

export type HeadDashboardActivity = {
  id: string;
  studentName: string;
  halaqahName: string;
  teacherName: string;
  submissionDate: string;
  submissionCategory: SubmissionCategory;
  surahName: string;
  startVerse: number;
  endVerse: number;
};

export type HeadDashboardData = {
  today: string;
  activeStudentCount: number;
  activeHalaqahCount: number;
  todayRecordCount: number;
  weekRecordCount: number;
  categoryCounts: Record<SubmissionCategory, number>;
  recentActivities: HeadDashboardActivity[];
};

export class HeadDashboardError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function databaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function currentDateForTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function mondayFor(date: string) {
  const monday = databaseDate(date);
  const day = monday.getUTCDay();
  monday.setUTCDate(monday.getUTCDate() - ((day + 6) % 7));
  return monday;
}

export async function getHeadDashboard(
  actor: AuthenticatedUser,
): Promise<HeadDashboardData> {
  if (!canAccessHeadDashboard(actor.roles)) {
    throw new HeadDashboardError(
      "Anda tidak memiliki hak untuk melihat dashboard akademik.",
    );
  }

  const organization = await db.organization.findUnique({
    where: { id: actor.organizationId },
    select: { timezone: true },
  });
  const today = currentDateForTimezone(
    organization?.timezone ?? "Asia/Jakarta",
  );
  const todayDate = databaseDate(today);
  const weekStart = mondayFor(today);
  const activeRecordFilter = {
    organizationId: actor.organizationId,
    recordStatus: "ACTIVE" as const,
  };

  const [
    activeStudentCount,
    activeHalaqahCount,
    todayRecordCount,
    weekRecordCount,
    categoryGroups,
    recentRecords,
  ] = await Promise.all([
    db.student.count({
      where: { organizationId: actor.organizationId, status: "ACTIVE" },
    }),
    db.halaqah.count({
      where: { organizationId: actor.organizationId, status: "ACTIVE" },
    }),
    db.memorizationRecord.count({
      where: { ...activeRecordFilter, submissionDate: todayDate },
    }),
    db.memorizationRecord.count({
      where: {
        ...activeRecordFilter,
        submissionDate: { gte: weekStart, lte: todayDate },
      },
    }),
    db.memorizationRecord.groupBy({
      by: ["submissionCategory"],
      where: {
        ...activeRecordFilter,
        submissionDate: { gte: weekStart, lte: todayDate },
      },
      _count: { _all: true },
    }),
    db.memorizationRecord.findMany({
      where: activeRecordFilter,
      select: {
        id: true,
        studentNameSnapshot: true,
        halaqahNameSnapshot: true,
        teacherNameSnapshot: true,
        submissionDate: true,
        submissionCategory: true,
        startVerse: true,
        endVerse: true,
        surah: { select: { latinName: true } },
      },
      orderBy: [{ submissionDate: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ]);

  const categoryCounts: Record<SubmissionCategory, number> = {
    SABAQ: 0,
    SABQI: 0,
    MANZIL: 0,
  };
  for (const group of categoryGroups) {
    categoryCounts[group.submissionCategory] = group._count._all;
  }

  return {
    today,
    activeStudentCount,
    activeHalaqahCount,
    todayRecordCount,
    weekRecordCount,
    categoryCounts,
    recentActivities: recentRecords.map((record) => ({
      id: record.id,
      studentName: record.studentNameSnapshot,
      halaqahName: record.halaqahNameSnapshot,
      teacherName: record.teacherNameSnapshot,
      submissionDate: dateInputValue(record.submissionDate),
      submissionCategory: record.submissionCategory,
      surahName: record.surah.latinName,
      startVerse: record.startVerse,
      endVerse: record.endVerse,
    })),
  };
}
