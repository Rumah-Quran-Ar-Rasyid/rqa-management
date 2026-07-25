import "server-only";

import type { FluencyPredicate, SubmissionCategory } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import { canAccessHeadDashboard } from "@/modules/dashboard/domain/head-dashboard-policy";
import {
  attentionReasons,
  type AttentionReason,
} from "@/modules/dashboard/domain/attention-policy";
import type { HeadDashboardFilters } from "@/modules/dashboard/domain/head-dashboard-filter";

export type HeadDashboardFilterOption = {
  id: string;
  label: string;
};

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

export type AttentionStudent = {
  id: string;
  name: string;
  lastSubmissionDate: string | null;
  reasons: AttentionReason[];
};

export type HeadStudentDetail = {
  id: string;
  name: string;
  studentNumber: string;
  joinedAt: string;
  currentHalaqahName: string | null;
  activeRecordCount: number;
  categoryCounts: Record<SubmissionCategory, number>;
  lastRecord: {
    submissionDate: string;
    fluencyPredicate: FluencyPredicate;
  } | null;
  attentionReasons: AttentionReason[];
  recentRecords: Array<{
    id: string;
    submissionDate: string;
    submissionCategory: SubmissionCategory;
    fluencyPredicate: FluencyPredicate;
    surahName: string;
    startVerse: number;
    endVerse: number;
    halaqahName: string;
    teacherName: string;
  }>;
};

export type HeadDashboardData = {
  today: string;
  filters: HeadDashboardFilters;
  periodOptions: HeadDashboardFilterOption[];
  halaqahOptions: HeadDashboardFilterOption[];
  activeStudentCount: number;
  activeHalaqahCount: number;
  todayRecordCount: number;
  weekRecordCount: number;
  categoryCounts: Record<SubmissionCategory, number>;
  recentActivities: HeadDashboardActivity[];
  attentionStudents: AttentionStudent[];
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
  filters: HeadDashboardFilters = {},
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

  const [periodOptions, halaqahOptions] = await Promise.all([
    db.academicPeriod.findMany({
      where: { organizationId: actor.organizationId },
      select: { id: true, name: true, status: true },
      orderBy: [{ startDate: "desc" }, { name: "asc" }],
    }),
    db.halaqah.findMany({
      where: { organizationId: actor.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const selectedAcademicPeriodId = periodOptions.some(
    (period) => period.id === filters.academicPeriodId,
  )
    ? filters.academicPeriodId
    : undefined;
  const selectedHalaqahId = halaqahOptions.some(
    (halaqah) => halaqah.id === filters.halaqahId,
  )
    ? filters.halaqahId
    : undefined;
  const selectedFilters = {
    academicPeriodId: selectedAcademicPeriodId,
    halaqahId: selectedHalaqahId,
  } satisfies HeadDashboardFilters;
  const filteredRecordFilter: Prisma.MemorizationRecordWhereInput = {
    ...activeRecordFilter,
    ...(selectedAcademicPeriodId
      ? { academicPeriodId: selectedAcademicPeriodId }
      : {}),
    ...(selectedHalaqahId ? { halaqahId: selectedHalaqahId } : {}),
  };

  const [
    activeStudentCount,
    activeHalaqahCount,
    todayRecordCount,
    weekRecordCount,
    categoryGroups,
    recentRecords,
    activeStudents,
    activeStudentRecords,
  ] = await Promise.all([
    db.student.count({
      where: { organizationId: actor.organizationId, status: "ACTIVE" },
    }),
    db.halaqah.count({
      where: { organizationId: actor.organizationId, status: "ACTIVE" },
    }),
    db.memorizationRecord.count({
      where: { ...filteredRecordFilter, submissionDate: todayDate },
    }),
    db.memorizationRecord.count({
      where: {
        ...filteredRecordFilter,
        submissionDate: { gte: weekStart, lte: todayDate },
      },
    }),
    db.memorizationRecord.groupBy({
      by: ["submissionCategory"],
      where: {
        ...filteredRecordFilter,
        submissionDate: { gte: weekStart, lte: todayDate },
      },
      _count: { _all: true },
    }),
    db.memorizationRecord.findMany({
      where: filteredRecordFilter,
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
    db.student.findMany({
      where: { organizationId: actor.organizationId, status: "ACTIVE" },
      select: { id: true, fullName: true, preferredName: true },
      orderBy: { fullName: "asc" },
    }),
    db.memorizationRecord.findMany({
      where: {
        ...activeRecordFilter,
        submissionDate: { lte: todayDate },
      },
      select: {
        studentId: true,
        submissionDate: true,
        fluencyPredicate: true,
      },
      orderBy: [{ submissionDate: "desc" }, { createdAt: "desc" }],
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

  const latestRecordByStudent = new Map<
    string,
    { submissionDate: Date; fluencyPredicate: FluencyPredicate }
  >();
  for (const record of activeStudentRecords) {
    if (!latestRecordByStudent.has(record.studentId)) {
      latestRecordByStudent.set(record.studentId, record);
    }
  }

  const attentionStudents = activeStudents
    .map((student) => {
      const lastRecord = latestRecordByStudent.get(student.id);
      const lastSubmissionDate = lastRecord
        ? dateInputValue(lastRecord.submissionDate)
        : null;
      const reasons = attentionReasons({
        today,
        lastSubmissionDate,
        lastFluencyPredicate: lastRecord?.fluencyPredicate ?? null,
      });

      return {
        id: student.id,
        name: student.preferredName || student.fullName,
        lastSubmissionDate,
        reasons,
      } satisfies AttentionStudent;
    })
    .filter((student) => student.reasons.length > 0)
    .sort((first, second) => {
      if (first.lastSubmissionDate === null) return -1;
      if (second.lastSubmissionDate === null) return 1;
      return first.lastSubmissionDate.localeCompare(second.lastSubmissionDate);
    });

  return {
    today,
    filters: selectedFilters,
    periodOptions: periodOptions.map((period) => ({
      id: period.id,
      label: `${period.name} (${period.status === "ACTIVE" ? "Aktif" : period.status === "CLOSED" ? "Ditutup" : "Direncanakan"})`,
    })),
    halaqahOptions: halaqahOptions.map((halaqah) => ({
      id: halaqah.id,
      label: halaqah.name,
    })),
    activeStudentCount,
    activeHalaqahCount,
    todayRecordCount,
    weekRecordCount,
    categoryCounts,
    attentionStudents,
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

export async function getHeadStudentDetail(
  actor: AuthenticatedUser,
  studentId: string,
): Promise<HeadStudentDetail> {
  if (!canAccessHeadDashboard(actor.roles)) {
    throw new HeadDashboardError(
      "Anda tidak memiliki hak untuk melihat detail akademik santri.",
    );
  }

  const [organization, student] = await Promise.all([
    db.organization.findUnique({
      where: { id: actor.organizationId },
      select: { timezone: true },
    }),
    db.student.findFirst({
      where: {
        id: studentId,
        organizationId: actor.organizationId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullName: true,
        preferredName: true,
        studentNumber: true,
        joinedAt: true,
      },
    }),
  ]);

  if (!student) {
    throw new HeadDashboardError("Santri tidak ditemukan.");
  }

  const today = currentDateForTimezone(
    organization?.timezone ?? "Asia/Jakarta",
  );
  const todayDate = databaseDate(today);
  const activeRecordFilter: Prisma.MemorizationRecordWhereInput = {
    organizationId: actor.organizationId,
    studentId: student.id,
    recordStatus: "ACTIVE",
    submissionDate: { lte: todayDate },
  };

  const [currentMembership, activeRecordCount, categoryGroups, lastRecord, recentRecords] =
    await Promise.all([
      db.halaqahMembership.findFirst({
        where: {
          organizationId: actor.organizationId,
          studentId: student.id,
          status: "ACTIVE",
          validFrom: { lte: todayDate },
          OR: [{ validUntil: null }, { validUntil: { gte: todayDate } }],
        },
        select: { halaqah: { select: { name: true } } },
        orderBy: { validFrom: "desc" },
      }),
      db.memorizationRecord.count({ where: activeRecordFilter }),
      db.memorizationRecord.groupBy({
        by: ["submissionCategory"],
        where: activeRecordFilter,
        _count: { _all: true },
      }),
      db.memorizationRecord.findFirst({
        where: activeRecordFilter,
        select: { submissionDate: true, fluencyPredicate: true },
        orderBy: [{ submissionDate: "desc" }, { createdAt: "desc" }],
      }),
      db.memorizationRecord.findMany({
        where: activeRecordFilter,
        select: {
          id: true,
          submissionDate: true,
          submissionCategory: true,
          fluencyPredicate: true,
          startVerse: true,
          endVerse: true,
          halaqahNameSnapshot: true,
          teacherNameSnapshot: true,
          surah: { select: { latinName: true } },
        },
        orderBy: [{ submissionDate: "desc" }, { createdAt: "desc" }],
        take: 10,
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

  const lastSubmissionDate = lastRecord
    ? dateInputValue(lastRecord.submissionDate)
    : null;

  return {
    id: student.id,
    name: student.preferredName || student.fullName,
    studentNumber: student.studentNumber,
    joinedAt: dateInputValue(student.joinedAt),
    currentHalaqahName: currentMembership?.halaqah.name ?? null,
    activeRecordCount,
    categoryCounts,
    lastRecord: lastRecord
      ? {
          submissionDate: lastSubmissionDate!,
          fluencyPredicate: lastRecord.fluencyPredicate,
        }
      : null,
    attentionReasons: attentionReasons({
      today,
      lastSubmissionDate,
      lastFluencyPredicate: lastRecord?.fluencyPredicate ?? null,
    }),
    recentRecords: recentRecords.map((record) => ({
      id: record.id,
      submissionDate: dateInputValue(record.submissionDate),
      submissionCategory: record.submissionCategory,
      fluencyPredicate: record.fluencyPredicate,
      surahName: record.surah.latinName,
      startVerse: record.startVerse,
      endVerse: record.endVerse,
      halaqahName: record.halaqahNameSnapshot,
      teacherName: record.teacherNameSnapshot,
    })),
  };
}
