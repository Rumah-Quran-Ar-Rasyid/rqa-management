import "server-only";

import type {
  FluencyPredicate,
  MemorizationAuditAction,
  MemorizationRecordStatus,
  SubmissionCategory,
} from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import { hasPermission, PERMISSIONS } from "@/modules/auth/domain/authorization";
import {
  canAccessMemorizationRecord,
  canCorrectMemorizationRecord,
  canVoidMemorizationRecord,
} from "@/modules/memorization/domain/memorization-correction-policy";
import { canCreateMemorizationRecord } from "@/modules/memorization/domain/memorization-policy";
import type { MemorizationHistoryFilters } from "@/modules/memorization/domain/memorization-history-filter";
import {
  correctMemorizationRecordSchema,
  createMemorizationRecordSchema,
  voidMemorizationRecordSchema,
  type CorrectMemorizationRecordInput,
  type CreateMemorizationRecordInput,
  type VoidMemorizationRecordInput,
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

export type MemorizationHistoryPeriodOption = {
  id: string;
  label: string;
};

export type MemorizationRecordAuditItem = {
  id: string;
  action: MemorizationAuditAction;
  details: string[];
  performedAt: string;
  performedByName: string;
  reason: string | null;
};

export type MemorizationRecordDetail = {
  id: string;
  academicPeriodName: string;
  academicPeriodStatus: "ACTIVE" | "CLOSED" | "PLANNED";
  canCorrect: boolean;
  canViewAudit: boolean;
  canVoid: boolean;
  canViewAuditDetails: boolean;
  createdAt: string;
  fluencyPredicate: FluencyPredicate;
  halaqahName: string;
  nextTarget: string | null;
  pageNumber: number | null;
  recordStatus: MemorizationRecordStatus;
  startVerse: number;
  endVerse: number;
  studentName: string;
  submissionCategory: SubmissionCategory;
  submissionDate: string;
  surahName: string;
  surahNumber: number;
  surahs: QuranSurahOption[];
  teacherName: string;
  teacherNote: string | null;
  audits: MemorizationRecordAuditItem[];
};

const HISTORY_PAGE_SIZE = 20;

export type MemorizationEntryContext = {
  submissionDate: string;
  activePeriod: { name: string } | null;
  halaqahs: MemorizationHalaqahOption[];
  surahs: QuranSurahOption[];
  historyPeriods: MemorizationHistoryPeriodOption[];
  historyFilters: MemorizationHistoryFilters;
  historyPage: number;
  historyPageCount: number;
  historyRecordCount: number;
  historyRecords: RecentMemorizationRecord[];
};

type MemorizationErrorCode =
  | "ACTIVE_PERIOD_NOT_FOUND"
  | "DUPLICATE_OVERRIDE_REQUIRED"
  | "FORBIDDEN"
  | "HALAQAH_INVALID"
  | "RECORD_INACTIVE"
  | "RECORD_NOT_FOUND"
  | "RECORD_UPDATE_FORBIDDEN"
  | "RECORD_VOID_FORBIDDEN"
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

function academicAuditData({
  endVerse,
  fluencyPredicate,
  nextTarget,
  pageNumber,
  recordStatus,
  startVerse,
  submissionCategory,
  surahNumber,
  teacherNote,
}: {
  endVerse: number;
  fluencyPredicate: FluencyPredicate;
  nextTarget: string | null;
  pageNumber: number | null;
  recordStatus: MemorizationRecordStatus;
  startVerse: number;
  submissionCategory: SubmissionCategory;
  surahNumber: number;
  teacherNote: string | null;
}) {
  return {
    submissionCategory,
    surahNumber,
    startVerse,
    endVerse,
    fluencyPredicate,
    teacherNote,
    nextTarget,
    pageNumber,
    recordStatus,
  };
}

function auditObject(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function auditString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function auditNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

const categoryLabels: Record<SubmissionCategory, string> = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
};

const fluencyLabels: Record<FluencyPredicate, string> = {
  FLUENT: "Lancar",
  FAIRLY_FLUENT: "Cukup Lancar",
  LESS_FLUENT: "Kurang Lancar",
};

function isSubmissionCategory(value: string | null): value is SubmissionCategory {
  return value !== null && value in categoryLabels;
}

function isFluencyPredicate(value: string | null): value is FluencyPredicate {
  return value !== null && value in fluencyLabels;
}

function describeAcademicAuditChange({
  action,
  afterData,
  beforeData,
}: {
  action: MemorizationAuditAction;
  afterData: unknown;
  beforeData: unknown;
}) {
  if (action === "CREATE") {
    return ["Setoran dicatat."];
  }

  if (action === "VOID") {
    return ["Status diubah menjadi Dibatalkan."];
  }

  const before = auditObject(beforeData);
  const after = auditObject(afterData);
  const details: string[] = [];
  const beforeCategory = auditString(before.submissionCategory);
  const afterCategory = auditString(after.submissionCategory);
  const beforeSurah = auditNumber(before.surahNumber);
  const afterSurah = auditNumber(after.surahNumber);
  const beforeStartVerse = auditNumber(before.startVerse);
  const afterStartVerse = auditNumber(after.startVerse);
  const beforeEndVerse = auditNumber(before.endVerse);
  const afterEndVerse = auditNumber(after.endVerse);
  const beforeFluency = auditString(before.fluencyPredicate);
  const afterFluency = auditString(after.fluencyPredicate);

  if (
    isSubmissionCategory(beforeCategory) &&
    isSubmissionCategory(afterCategory) &&
    beforeCategory !== afterCategory
  ) {
    details.push(
      `Kategori: ${categoryLabels[beforeCategory]} menjadi ${categoryLabels[afterCategory]}.`,
    );
  }

  if (beforeSurah !== null && afterSurah !== null && beforeSurah !== afterSurah) {
    details.push(`Surah: nomor ${beforeSurah} menjadi nomor ${afterSurah}.`);
  }

  if (
    beforeStartVerse !== null &&
    afterStartVerse !== null &&
    beforeEndVerse !== null &&
    afterEndVerse !== null &&
    (beforeStartVerse !== afterStartVerse || beforeEndVerse !== afterEndVerse)
  ) {
    details.push(
      `Ayat: ${beforeStartVerse}-${beforeEndVerse} menjadi ${afterStartVerse}-${afterEndVerse}.`,
    );
  }

  if (
    isFluencyPredicate(beforeFluency) &&
    isFluencyPredicate(afterFluency) &&
    beforeFluency !== afterFluency
  ) {
    details.push(
      `Kelancaran: ${fluencyLabels[beforeFluency]} menjadi ${fluencyLabels[afterFluency]}.`,
    );
  }

  if (before.teacherNote !== after.teacherNote) {
    details.push("Catatan Pengajar diperbarui.");
  }

  if (before.nextTarget !== after.nextTarget) {
    details.push("Target berikutnya diperbarui.");
  }

  if (before.pageNumber !== after.pageNumber) {
    details.push("Nomor halaman diperbarui.");
  }

  return details.length > 0 ? details : ["Data setoran diperbarui."];
}

export async function getMemorizationEntryContext(
  actor: AuthenticatedUser,
  requestedHistoryFilters: MemorizationHistoryFilters & { page: number } = {
    page: 1,
  },
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

  const [activePeriod, assignments, surahs, historyPeriods] = await Promise.all([
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
    db.academicPeriod.findMany({
      where: { organizationId: actor.organizationId },
      select: { id: true, name: true },
      orderBy: [{ startDate: "desc" }, { name: "asc" }],
    }),
  ]);

  const validPeriodIds = new Set(historyPeriods.map((period) => period.id));
  const historyFilters: MemorizationHistoryFilters = {
    academicPeriodId: validPeriodIds.has(
      requestedHistoryFilters.academicPeriodId ?? "",
    )
      ? requestedHistoryFilters.academicPeriodId
      : undefined,
    submissionCategory: requestedHistoryFilters.submissionCategory,
  };
  const historyWhere = {
    organizationId: actor.organizationId,
    teacherUserId: actor.id,
    ...(historyFilters.academicPeriodId
      ? { academicPeriodId: historyFilters.academicPeriodId }
      : {}),
    ...(historyFilters.submissionCategory
      ? { submissionCategory: historyFilters.submissionCategory }
      : {}),
  };
  const historyRecordCount = await db.memorizationRecord.count({
    where: historyWhere,
  });
  const historyPageCount = Math.max(
    1,
    Math.ceil(historyRecordCount / HISTORY_PAGE_SIZE),
  );
  const historyPage = Math.min(requestedHistoryFilters.page, historyPageCount);
  const historyRecords = await db.memorizationRecord.findMany({
    where: historyWhere,
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
    skip: (historyPage - 1) * HISTORY_PAGE_SIZE,
    take: HISTORY_PAGE_SIZE,
  });

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
    historyPeriods: historyPeriods.map((period) => ({
      id: period.id,
      label: period.name,
    })),
    historyFilters,
    historyPage,
    historyPageCount,
    historyRecordCount,
    historyRecords: historyRecords.map((record) => ({
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

export async function getMemorizationRecordDetail(
  actor: AuthenticatedUser,
  recordId: string,
): Promise<MemorizationRecordDetail> {
  const [record, surahs] = await Promise.all([
    db.memorizationRecord.findUnique({
    where: {
      id_organizationId: {
        id: recordId,
        organizationId: actor.organizationId,
      },
    },
    select: {
      id: true,
      submissionDate: true,
      submissionCategory: true,
      startVerse: true,
      endVerse: true,
      fluencyPredicate: true,
      teacherNote: true,
      nextTarget: true,
      pageNumber: true,
      recordStatus: true,
      studentNameSnapshot: true,
      halaqahNameSnapshot: true,
      teacherNameSnapshot: true,
      teacherUserId: true,
      createdAt: true,
      surah: { select: { surahNumber: true, latinName: true } },
      academicPeriod: { select: { name: true, status: true } },
      audits: {
        select: {
          id: true,
          action: true,
          beforeData: true,
          afterData: true,
          reason: true,
          performedAt: true,
          performedBy: { select: { name: true } },
        },
        orderBy: { performedAt: "desc" },
      },
    },
    }),
    db.quranSurah.findMany({
      select: {
        surahNumber: true,
        latinName: true,
        verseCount: true,
      },
      orderBy: { surahNumber: "asc" },
    }),
  ]);

  if (!record) {
    throw new MemorizationError("RECORD_NOT_FOUND", "Setoran tidak ditemukan.");
  }

  if (
    !canAccessMemorizationRecord({
      actorId: actor.id,
      actorRoles: actor.roles,
      teacherUserId: record.teacherUserId,
    })
  ) {
    throw new MemorizationError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk melihat setoran ini.",
    );
  }

  const canViewAuditDetails = hasPermission(
    actor.roles,
    PERMISSIONS.VIEW_ACADEMIC_AUDIT,
  );
  const canViewAudit =
    canViewAuditDetails ||
    (actor.roles.includes("TEACHER") && actor.id === record.teacherUserId);
  const now = new Date();

  return {
    id: record.id,
    academicPeriodName: record.academicPeriod.name,
    academicPeriodStatus: record.academicPeriod.status,
    canCorrect: canCorrectMemorizationRecord({
      actorId: actor.id,
      actorRoles: actor.roles,
      teacherUserId: record.teacherUserId,
      createdAt: record.createdAt,
      academicPeriodStatus: record.academicPeriod.status,
      recordStatus: record.recordStatus,
      now,
    }),
    canVoid: canVoidMemorizationRecord({
      actorRoles: actor.roles,
      academicPeriodStatus: record.academicPeriod.status,
      recordStatus: record.recordStatus,
    }),
    canViewAudit,
    canViewAuditDetails,
    createdAt: record.createdAt.toISOString(),
    fluencyPredicate: record.fluencyPredicate,
    halaqahName: record.halaqahNameSnapshot,
    nextTarget: record.nextTarget,
    pageNumber: record.pageNumber,
    recordStatus: record.recordStatus,
    startVerse: record.startVerse,
    endVerse: record.endVerse,
    studentName: record.studentNameSnapshot,
    submissionCategory: record.submissionCategory,
    submissionDate: dateInputValue(record.submissionDate),
    surahName: record.surah.latinName,
    surahNumber: record.surah.surahNumber,
    surahs: surahs.map((surah) => ({
      number: surah.surahNumber,
      label: `${surah.surahNumber}. ${surah.latinName}`,
      verseCount: surah.verseCount,
    })),
    teacherName: record.teacherNameSnapshot,
    teacherNote: record.teacherNote,
    audits: canViewAudit
      ? record.audits.map((audit) => ({
          id: audit.id,
          action: audit.action,
          details: canViewAuditDetails
            ? describeAcademicAuditChange(audit)
            : [],
          performedAt: audit.performedAt.toISOString(),
          performedByName: audit.performedBy.name,
          reason: audit.reason,
        }))
      : [],
  };
}

export async function correctMemorizationRecord(
  actor: AuthenticatedUser,
  input: CorrectMemorizationRecordInput,
) {
  const values = correctMemorizationRecordSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const [record, surah] = await Promise.all([
        transaction.memorizationRecord.findUnique({
          where: {
            id_organizationId: {
              id: values.recordId,
              organizationId: actor.organizationId,
            },
          },
          select: {
            id: true,
            teacherUserId: true,
            createdAt: true,
            recordStatus: true,
            submissionCategory: true,
            surahNumber: true,
            startVerse: true,
            endVerse: true,
            fluencyPredicate: true,
            teacherNote: true,
            nextTarget: true,
            pageNumber: true,
            academicPeriod: { select: { status: true } },
          },
        }),
        transaction.quranSurah.findUnique({
          where: { surahNumber: values.surahNumber },
          select: { verseCount: true },
        }),
      ]);

      if (!record) {
        throw new MemorizationError(
          "RECORD_NOT_FOUND",
          "Setoran tidak ditemukan.",
        );
      }

      if (record.recordStatus !== "ACTIVE") {
        throw new MemorizationError(
          "RECORD_INACTIVE",
          "Setoran yang sudah dibatalkan tidak dapat dikoreksi.",
        );
      }

      if (record.academicPeriod.status !== "ACTIVE") {
        throw new MemorizationError(
          "RECORD_UPDATE_FORBIDDEN",
          "Periode setoran sudah ditutup. Buka kembali periode sebelum melakukan koreksi.",
        );
      }

      if (
        !canCorrectMemorizationRecord({
          actorId: actor.id,
          actorRoles: actor.roles,
          teacherUserId: record.teacherUserId,
          createdAt: record.createdAt,
          academicPeriodStatus: record.academicPeriod.status,
          recordStatus: record.recordStatus,
          now: new Date(),
        })
      ) {
        throw new MemorizationError(
          "RECORD_UPDATE_FORBIDDEN",
          "Anda hanya dapat mengoreksi setoran milik sendiri dalam 24 jam, kecuali sebagai Kepala.",
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

      const beforeData = academicAuditData(record);
      const afterData = academicAuditData({
        ...record,
        submissionCategory: values.submissionCategory,
        surahNumber: values.surahNumber,
        startVerse: values.startVerse,
        endVerse: values.endVerse,
        fluencyPredicate: values.fluencyPredicate,
        teacherNote: values.teacherNote ?? null,
        nextTarget: values.nextTarget ?? null,
        pageNumber: values.pageNumber ?? null,
      });

      await transaction.memorizationRecord.update({
        where: {
          id_organizationId: {
            id: record.id,
            organizationId: actor.organizationId,
          },
        },
        data: {
          submissionCategory: values.submissionCategory,
          surahNumber: values.surahNumber,
          startVerse: values.startVerse,
          endVerse: values.endVerse,
          fluencyPredicate: values.fluencyPredicate,
          teacherNote: values.teacherNote ?? null,
          nextTarget: values.nextTarget ?? null,
          pageNumber: values.pageNumber ?? null,
          updatedById: actor.id,
        },
      });

      await transaction.memorizationRecordAudit.create({
        data: {
          organizationId: actor.organizationId,
          memorizationRecordId: record.id,
          action: "UPDATE",
          beforeData,
          afterData,
          reason: values.reason,
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function voidMemorizationRecord(
  actor: AuthenticatedUser,
  input: VoidMemorizationRecordInput,
) {
  const values = voidMemorizationRecordSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const record = await transaction.memorizationRecord.findUnique({
        where: {
          id_organizationId: {
            id: values.recordId,
            organizationId: actor.organizationId,
          },
        },
        select: {
          id: true,
          recordStatus: true,
          submissionCategory: true,
          surahNumber: true,
          startVerse: true,
          endVerse: true,
          fluencyPredicate: true,
          teacherNote: true,
          nextTarget: true,
          pageNumber: true,
          academicPeriod: { select: { status: true } },
        },
      });

      if (!record) {
        throw new MemorizationError(
          "RECORD_NOT_FOUND",
          "Setoran tidak ditemukan.",
        );
      }

      if (record.recordStatus !== "ACTIVE") {
        throw new MemorizationError(
          "RECORD_INACTIVE",
          "Setoran tersebut sudah dibatalkan.",
        );
      }

      if (record.academicPeriod.status !== "ACTIVE") {
        throw new MemorizationError(
          "RECORD_VOID_FORBIDDEN",
          "Periode setoran sudah ditutup. Buka kembali periode sebelum membatalkan setoran.",
        );
      }

      if (
        !canVoidMemorizationRecord({
          actorRoles: actor.roles,
          academicPeriodStatus: record.academicPeriod.status,
          recordStatus: record.recordStatus,
        })
      ) {
        throw new MemorizationError(
          "RECORD_VOID_FORBIDDEN",
          "Hanya Kepala yang dapat membatalkan setoran.",
        );
      }

      const beforeData = academicAuditData(record);
      const afterData = academicAuditData({
        ...record,
        recordStatus: "VOID",
      });

      await transaction.memorizationRecord.update({
        where: {
          id_organizationId: {
            id: record.id,
            organizationId: actor.organizationId,
          },
        },
        data: {
          recordStatus: "VOID",
          updatedById: actor.id,
        },
      });

      await transaction.memorizationRecordAudit.create({
        data: {
          organizationId: actor.organizationId,
          memorizationRecordId: record.id,
          action: "VOID",
          beforeData,
          afterData,
          reason: values.reason,
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}
