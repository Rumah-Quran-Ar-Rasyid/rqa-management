import "server-only";

import type {
  FluencyPredicate,
  SubmissionCategory,
} from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import { canCreateMemorizationRecord } from "@/modules/memorization/domain/memorization-policy";
import {
  createMemorizationRecordSchema,
  type CreateMemorizationRecordInput,
} from "@/modules/memorization/domain/memorization-schemas";

export type MemorizationStudentOption = {
  id: string;
  label: string;
};

export type MemorizationHalaqahOption = {
  id: string;
  label: string;
  students: MemorizationStudentOption[];
};

export type QuranSurahOption = {
  number: number;
  label: string;
  verseCount: number;
};

export type RecentMemorizationRecord = {
  id: string;
  studentName: string;
  halaqahName: string;
  submissionDate: string;
  submissionCategory: SubmissionCategory;
  surahName: string;
  startVerse: number;
  endVerse: number;
  fluencyPredicate: FluencyPredicate;
};

export type MemorizationEntryContext = {
  submissionDate: string;
  activePeriod: { name: string } | null;
  halaqahs: MemorizationHalaqahOption[];
  surahs: QuranSurahOption[];
  recentRecords: RecentMemorizationRecord[];
};

type MemorizationErrorCode =
  | "ACTIVE_PERIOD_NOT_FOUND"
  | "DUPLICATE_OVERRIDE_REQUIRED"
  | "FORBIDDEN"
  | "HALAQAH_INVALID"
  | "STUDENT_INVALID"
  | "STUDENT_NOT_MEMBER"
  | "SURAH_NOT_FOUND"
  | "TEACHER_NOT_ASSIGNED"
  | "VERSE_RANGE_INVALID";

export class MemorizationError extends Error {
  constructor(
    readonly code: MemorizationErrorCode,
    message: string,
  ) {
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

function activeRangeFilter(date: Date) {
  return {
    validFrom: { lte: date },
    OR: [{ validUntil: null }, { validUntil: { gte: date } }],
  };
}

function displayStudentName({
  fullName,
  preferredName,
}: {
  fullName: string;
  preferredName: string | null;
}) {
  return preferredName || fullName;
}

export async function getMemorizationEntryContext(
  actor: AuthenticatedUser,
): Promise<MemorizationEntryContext> {
  if (!canCreateMemorizationRecord(actor.roles)) {
    throw new MemorizationError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mencatat setoran.",
    );
  }

  const organization = await db.organization.findUnique({
    where: { id: actor.organizationId },
    select: { timezone: true },
  });
  const submissionDate = currentDateForTimezone(
    organization?.timezone ?? "Asia/Jakarta",
  );
  const submissionDateDatabase = databaseDate(submissionDate);

  const [activePeriod, assignments, surahs, records] = await Promise.all([
    db.academicPeriod.findFirst({
      where: {
        organizationId: actor.organizationId,
        status: "ACTIVE",
        startDate: { lte: submissionDateDatabase },
        endDate: { gte: submissionDateDatabase },
      },
      select: { name: true },
    }),
    db.halaqahTeacherAssignment.findMany({
      where: {
        organizationId: actor.organizationId,
        teacherUserId: actor.id,
        ...activeRangeFilter(submissionDateDatabase),
      },
      select: { halaqah: { select: { id: true, name: true, status: true } } },
      orderBy: { validFrom: "asc" },
    }),
    db.quranSurah.findMany({
      select: {
        surahNumber: true,
        latinName: true,
        verseCount: true,
      },
      orderBy: { surahNumber: "asc" },
    }),
    db.memorizationRecord.findMany({
      where: {
        organizationId: actor.organizationId,
        teacherUserId: actor.id,
      },
      select: {
        id: true,
        studentNameSnapshot: true,
        halaqahNameSnapshot: true,
        submissionDate: true,
        submissionCategory: true,
        startVerse: true,
        endVerse: true,
        fluencyPredicate: true,
        surah: { select: { latinName: true } },
      },
      orderBy: [{ submissionDate: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
  ]);

  const assignedHalaqahs = new Map<string, { id: string; name: string }>();
  for (const assignment of assignments) {
    if (assignment.halaqah.status === "ACTIVE") {
      assignedHalaqahs.set(assignment.halaqah.id, assignment.halaqah);
    }
  }

  const memberships =
    assignedHalaqahs.size === 0
      ? []
      : await db.halaqahMembership.findMany({
          where: {
            organizationId: actor.organizationId,
            halaqahId: { in: [...assignedHalaqahs.keys()] },
            status: "ACTIVE",
            ...activeRangeFilter(submissionDateDatabase),
          },
          select: {
            halaqahId: true,
            student: {
              select: {
                id: true,
                fullName: true,
                preferredName: true,
                studentNumber: true,
                status: true,
              },
            },
          },
          orderBy: { student: { fullName: "asc" } },
        });

  const studentsByHalaqah = new Map<string, MemorizationStudentOption[]>();
  for (const membership of memberships) {
    if (membership.student.status !== "ACTIVE") {
      continue;
    }

    const students = studentsByHalaqah.get(membership.halaqahId) ?? [];
    students.push({
      id: membership.student.id,
      label: `${displayStudentName(membership.student)} (${membership.student.studentNumber})`,
    });
    studentsByHalaqah.set(membership.halaqahId, students);
  }

  return {
    submissionDate,
    activePeriod,
    halaqahs: [...assignedHalaqahs.values()].map((halaqah) => ({
      id: halaqah.id,
      label: halaqah.name,
      students: studentsByHalaqah.get(halaqah.id) ?? [],
    })),
    surahs: surahs.map((surah) => ({
      number: surah.surahNumber,
      label: `${surah.surahNumber}. ${surah.latinName}`,
      verseCount: surah.verseCount,
    })),
    recentRecords: records.map((record) => ({
      id: record.id,
      studentName: record.studentNameSnapshot,
      halaqahName: record.halaqahNameSnapshot,
      submissionDate: dateInputValue(record.submissionDate),
      submissionCategory: record.submissionCategory,
      surahName: record.surah.latinName,
      startVerse: record.startVerse,
      endVerse: record.endVerse,
      fluencyPredicate: record.fluencyPredicate,
    })),
  };
}

export async function createMemorizationRecord(
  actor: AuthenticatedUser,
  input: CreateMemorizationRecordInput,
) {
  if (!canCreateMemorizationRecord(actor.roles)) {
    throw new MemorizationError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mencatat setoran.",
    );
  }

  const values = createMemorizationRecordSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const organization = await transaction.organization.findUnique({
        where: { id: actor.organizationId },
        select: { timezone: true },
      });
      const submissionDateText = currentDateForTimezone(
        organization?.timezone ?? "Asia/Jakarta",
      );
      const submissionDate = databaseDate(submissionDateText);

      const [period, assignment, halaqah, student, membership, surah] =
        await Promise.all([
          transaction.academicPeriod.findFirst({
            where: {
              organizationId: actor.organizationId,
              status: "ACTIVE",
              startDate: { lte: submissionDate },
              endDate: { gte: submissionDate },
            },
            select: { id: true, name: true },
          }),
          transaction.halaqahTeacherAssignment.findFirst({
            where: {
              organizationId: actor.organizationId,
              halaqahId: values.halaqahId,
              teacherUserId: actor.id,
              ...activeRangeFilter(submissionDate),
            },
            select: { id: true },
          }),
          transaction.halaqah.findUnique({
            where: {
              id_organizationId: {
                id: values.halaqahId,
                organizationId: actor.organizationId,
              },
            },
            select: { id: true, name: true, status: true },
          }),
          transaction.student.findUnique({
            where: {
              id_organizationId: {
                id: values.studentId,
                organizationId: actor.organizationId,
              },
            },
            select: { id: true, fullName: true, preferredName: true, status: true },
          }),
          transaction.halaqahMembership.findFirst({
            where: {
              organizationId: actor.organizationId,
              halaqahId: values.halaqahId,
              studentId: values.studentId,
              status: "ACTIVE",
              ...activeRangeFilter(submissionDate),
            },
            select: { id: true },
          }),
          transaction.quranSurah.findUnique({
            where: { surahNumber: values.surahNumber },
            select: { surahNumber: true, verseCount: true },
          }),
        ]);

      if (!period) {
        throw new MemorizationError(
          "ACTIVE_PERIOD_NOT_FOUND",
          "Belum ada periode aktif untuk mencatat setoran hari ini.",
        );
      }

      if (!assignment) {
        throw new MemorizationError(
          "TEACHER_NOT_ASSIGNED",
          "Anda tidak sedang ditugaskan pada halaqah tersebut.",
        );
      }

      if (!halaqah || halaqah.status !== "ACTIVE") {
        throw new MemorizationError(
          "HALAQAH_INVALID",
          "Halaqah tersebut tidak aktif.",
        );
      }

      if (!student || student.status !== "ACTIVE") {
        throw new MemorizationError(
          "STUDENT_INVALID",
          "Santri tersebut tidak aktif.",
        );
      }

      if (!membership) {
        throw new MemorizationError(
          "STUDENT_NOT_MEMBER",
          "Santri tidak terdaftar aktif pada halaqah tersebut.",
        );
      }

      if (!surah) {
        throw new MemorizationError("SURAH_NOT_FOUND", "Surah tidak ditemukan.");
      }

      if (values.endVerse > surah.verseCount) {
        throw new MemorizationError(
          "VERSE_RANGE_INVALID",
          `Surah ini hanya memiliki ${surah.verseCount} ayat.`,
        );
      }

      const duplicate = await transaction.memorizationRecord.findFirst({
        where: {
          organizationId: actor.organizationId,
          studentId: student.id,
          submissionDate,
          submissionCategory: values.submissionCategory,
          surahNumber: surah.surahNumber,
          startVerse: values.startVerse,
          endVerse: values.endVerse,
          recordStatus: "ACTIVE",
        },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });

      if (duplicate && !values.duplicateOverride) {
        throw new MemorizationError(
          "DUPLICATE_OVERRIDE_REQUIRED",
          "Setoran serupa sudah tercatat hari ini. Konfirmasi dan isi alasan untuk melanjutkan.",
        );
      }

      const record = await transaction.memorizationRecord.create({
        data: {
          organizationId: actor.organizationId,
          academicPeriodId: period.id,
          studentId: student.id,
          halaqahId: halaqah.id,
          teacherUserId: actor.id,
          submissionDate,
          submissionCategory: values.submissionCategory,
          surahNumber: surah.surahNumber,
          startVerse: values.startVerse,
          endVerse: values.endVerse,
          fluencyPredicate: values.fluencyPredicate,
          teacherNote: values.teacherNote,
          nextTarget: values.nextTarget,
          pageNumber: values.pageNumber,
          duplicateOverride: Boolean(duplicate),
          duplicateOverrideReason: duplicate
            ? values.duplicateOverrideReason
            : undefined,
          duplicateReferenceRecordId: duplicate?.id,
          recordStatus: "ACTIVE",
          studentNameSnapshot: displayStudentName(student),
          halaqahNameSnapshot: halaqah.name,
          teacherNameSnapshot: actor.name,
          periodNameSnapshot: period.name,
          createdById: actor.id,
          updatedById: actor.id,
        },
        select: { id: true },
      });

      await transaction.memorizationRecordAudit.create({
        data: {
          organizationId: actor.organizationId,
          memorizationRecordId: record.id,
          action: "CREATE",
          afterData: {
            submissionDate: submissionDateText,
            halaqahId: halaqah.id,
            studentId: student.id,
            submissionCategory: values.submissionCategory,
            surahNumber: surah.surahNumber,
            startVerse: values.startVerse,
            endVerse: values.endVerse,
            fluencyPredicate: values.fluencyPredicate,
            teacherNote: values.teacherNote ?? null,
            nextTarget: values.nextTarget ?? null,
            pageNumber: values.pageNumber ?? null,
            duplicateOverride: Boolean(duplicate),
            duplicateOverrideReason: duplicate
              ? values.duplicateOverrideReason ?? null
              : null,
            duplicateReferenceRecordId: duplicate?.id ?? null,
          },
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}
