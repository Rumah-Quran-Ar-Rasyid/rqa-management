import "server-only";

import { randomUUID } from "node:crypto";

import type { FluencyPredicate, SubmissionCategory } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import { canGenerateReports } from "@/modules/reports/domain/report-policy";
import {
  canSupersedeReport,
  type ReportScope,
} from "@/modules/reports/domain/report-version-policy";
import {
  reportRequestSchema,
  type ReportRequestInput,
} from "@/modules/reports/domain/report-schemas";

export type ReportDirectory = {
  students: Array<{ id: string; label: string }>;
  academicPeriods: Array<{ id: string; label: string }>;
  defaultAcademicPeriodId: string | null;
};

export type ReportSnapshot = {
  schemaVersion: 1;
  reportNumber: string | null;
  reportVersion: number | null;
  organizationName: string;
  issuedAt: string;
  student: { id: string; name: string; studentNumber: string };
  academicPeriod: { id: string; name: string } | null;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  halaqahNames: string[];
  teacherNames: string[];
  summary: {
    totalRecords: number;
    categories: Record<SubmissionCategory, number>;
    fluencies: Record<FluencyPredicate, number>;
  };
  records: Array<{
    id: string;
    submissionDate: string;
    submissionCategory: SubmissionCategory;
    fluencyPredicate: FluencyPredicate;
    surahName: string;
    startVerse: number;
    endVerse: number;
    halaqahName: string;
    teacherName: string;
    teacherNote: string | null;
    nextTarget: string | null;
  }>;
};

export type CurrentReport = {
  id: string;
  reportNumber: string;
  version: number;
  issuedAt: string;
};

export type ReportPreview = {
  snapshot: ReportSnapshot;
  currentReport: CurrentReport | null;
};

export class ReportError extends Error {
  constructor(
    readonly code:
      | "FORBIDDEN"
      | "PERIOD_NOT_FOUND"
      | "REPORT_EMPTY"
      | "REPORT_NOT_FOUND"
      | "REPORT_REPLACEMENT_INVALID"
      | "STUDENT_NOT_FOUND",
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

function distinct(values: string[]) {
  return [...new Set(values)];
}

function periodStatusLabel(status: "ACTIVE" | "CLOSED" | "PLANNED") {
  if (status === "ACTIVE") return "Aktif";
  if (status === "CLOSED") return "Ditutup";
  return "Direncanakan";
}

function makeReportNumber() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `RQA-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function assertReportAccess(actor: AuthenticatedUser) {
  if (!canGenerateReports(actor.roles)) {
    throw new ReportError("FORBIDDEN", "Anda tidak memiliki hak untuk membuat laporan.");
  }
}

function reportScope(snapshot: ReportSnapshot): ReportScope {
  return {
    studentId: snapshot.student.id,
    academicPeriodId: snapshot.academicPeriod?.id ?? null,
    periodStart: snapshot.periodStart,
    periodEnd: snapshot.periodEnd,
  };
}

function reportScopeFromDatabase(report: {
  studentId: string;
  academicPeriodId: string | null;
  periodStart: Date;
  periodEnd: Date;
}): ReportScope {
  return {
    studentId: report.studentId,
    academicPeriodId: report.academicPeriodId,
    periodStart: dateInputValue(report.periodStart),
    periodEnd: dateInputValue(report.periodEnd),
  };
}

async function findCurrentReport(
  organizationId: string,
  scope: ReportScope,
) {
  return db.generatedReport.findFirst({
    where: {
      organizationId,
      studentId: scope.studentId,
      academicPeriodId: scope.academicPeriodId,
      periodStart: databaseDate(scope.periodStart),
      periodEnd: databaseDate(scope.periodEnd),
      status: "ISSUED",
    },
    select: { id: true, reportNumber: true, version: true, issuedAt: true },
    orderBy: { issuedAt: "desc" },
  });
}

export async function getReportDirectory(actor: AuthenticatedUser): Promise<ReportDirectory> {
  assertReportAccess(actor);

  const [students, academicPeriods] = await Promise.all([
    db.student.findMany({
      where: { organizationId: actor.organizationId },
      select: { id: true, fullName: true, preferredName: true, studentNumber: true, status: true },
      orderBy: { fullName: "asc" },
    }),
    db.academicPeriod.findMany({
      where: { organizationId: actor.organizationId },
      select: { id: true, name: true, status: true, startDate: true },
      orderBy: [{ startDate: "desc" }, { name: "asc" }],
    }),
  ]);

  return {
    students: students.map((student) => ({
      id: student.id,
      label: `${student.preferredName || student.fullName} (${student.studentNumber})${student.status === "ACTIVE" ? "" : " - Tidak aktif"}`,
    })),
    academicPeriods: academicPeriods.map((period) => ({
      id: period.id,
      label: `${period.name} (${periodStatusLabel(period.status)})`,
    })),
    defaultAcademicPeriodId:
      academicPeriods.find((period) => period.status === "ACTIVE")?.id ?? null,
  };
}

async function buildReportSnapshot(
  actor: AuthenticatedUser,
  input: ReportRequestInput,
  reportNumber: string | null,
  reportVersion: number | null,
  issuedAt: Date,
): Promise<ReportSnapshot> {
  assertReportAccess(actor);
  const values = reportRequestSchema.parse(input);

  const [organization, student] = await Promise.all([
    db.organization.findUnique({
      where: { id: actor.organizationId },
      select: { name: true },
    }),
    db.student.findUnique({
      where: {
        id_organizationId: {
          id: values.studentId,
          organizationId: actor.organizationId,
        },
      },
      select: { id: true, fullName: true, preferredName: true, studentNumber: true },
    }),
  ]);

  if (!student) {
    throw new ReportError("STUDENT_NOT_FOUND", "Santri tidak ditemukan.");
  }

  const academicPeriod =
    values.selectionType === "ACADEMIC_PERIOD"
      ? await db.academicPeriod.findUnique({
          where: {
            id_organizationId: {
              id: values.academicPeriodId!,
              organizationId: actor.organizationId,
            },
          },
          select: { id: true, name: true, startDate: true, endDate: true },
        })
      : null;

  if (values.selectionType === "ACADEMIC_PERIOD" && !academicPeriod) {
    throw new ReportError("PERIOD_NOT_FOUND", "Periode pembelajaran tidak ditemukan.");
  }

  const periodStart = academicPeriod
    ? dateInputValue(academicPeriod.startDate)
    : values.periodStart!;
  const periodEnd = academicPeriod ? dateInputValue(academicPeriod.endDate) : values.periodEnd!;
  const records = await db.memorizationRecord.findMany({
    where: {
      organizationId: actor.organizationId,
      studentId: student.id,
      recordStatus: "ACTIVE",
      submissionDate: { gte: databaseDate(periodStart), lte: databaseDate(periodEnd) },
    },
    select: {
      id: true,
      submissionDate: true,
      submissionCategory: true,
      fluencyPredicate: true,
      startVerse: true,
      endVerse: true,
      halaqahNameSnapshot: true,
      teacherNameSnapshot: true,
      teacherNote: true,
      nextTarget: true,
      surah: { select: { latinName: true } },
    },
    orderBy: [{ submissionDate: "asc" }, { createdAt: "asc" }],
  });

  if (records.length === 0) {
    throw new ReportError("REPORT_EMPTY", "Belum ada setoran aktif pada periode yang dipilih.");
  }

  const categories: Record<SubmissionCategory, number> = { SABAQ: 0, SABQI: 0, MANZIL: 0 };
  const fluencies: Record<FluencyPredicate, number> = {
    FLUENT: 0,
    FAIRLY_FLUENT: 0,
    LESS_FLUENT: 0,
  };
  for (const record of records) {
    categories[record.submissionCategory] += 1;
    fluencies[record.fluencyPredicate] += 1;
  }

  return {
    schemaVersion: 1 as const,
    reportNumber,
    reportVersion,
    organizationName: organization?.name ?? "Rumah Qur'an Ar-Rasyid",
    issuedAt: issuedAt.toISOString(),
    student: {
      id: student.id,
      name: student.preferredName || student.fullName,
      studentNumber: student.studentNumber,
    },
    academicPeriod: academicPeriod ? { id: academicPeriod.id, name: academicPeriod.name } : null,
    periodStart,
    periodEnd,
    periodLabel: academicPeriod
      ? academicPeriod.name
      : `${periodStart} sampai ${periodEnd}`,
    halaqahNames: distinct(records.map((record) => record.halaqahNameSnapshot)),
    teacherNames: distinct(records.map((record) => record.teacherNameSnapshot)),
    summary: { totalRecords: records.length, categories, fluencies },
    records: records.map((record) => ({
      id: record.id,
      submissionDate: dateInputValue(record.submissionDate),
      submissionCategory: record.submissionCategory,
      fluencyPredicate: record.fluencyPredicate,
      surahName: record.surah.latinName,
      startVerse: record.startVerse,
      endVerse: record.endVerse,
      halaqahName: record.halaqahNameSnapshot,
      teacherName: record.teacherNameSnapshot,
      teacherNote: record.teacherNote,
      nextTarget: record.nextTarget,
    })),
  };
}

export async function previewReport(actor: AuthenticatedUser, input: ReportRequestInput) {
  const snapshot = await buildReportSnapshot(actor, input, null, null, new Date());
  const currentReport = await findCurrentReport(actor.organizationId, reportScope(snapshot));

  return {
    snapshot,
    currentReport: currentReport
      ? {
          id: currentReport.id,
          reportNumber: currentReport.reportNumber,
          version: currentReport.version,
          issuedAt: currentReport.issuedAt.toISOString(),
        }
      : null,
  } satisfies ReportPreview;
}

export async function generateReport(actor: AuthenticatedUser, input: ReportRequestInput) {
  const values = reportRequestSchema.parse(input);
  const reportNumber = makeReportNumber();
  const issuedAt = new Date();
  const draftSnapshot = await buildReportSnapshot(
    actor,
    values,
    reportNumber,
    null,
    issuedAt,
  );
  const scope = reportScope(draftSnapshot);

  return db.$transaction(
    async (transaction) => {
      if (!values.supersedesReportId) {
        const currentReport = await transaction.generatedReport.findFirst({
          where: {
            organizationId: actor.organizationId,
            studentId: scope.studentId,
            academicPeriodId: scope.academicPeriodId,
            periodStart: databaseDate(scope.periodStart),
            periodEnd: databaseDate(scope.periodEnd),
            status: "ISSUED",
          },
          select: { id: true, reportNumber: true, version: true },
          orderBy: { issuedAt: "desc" },
        });

        if (currentReport) {
          return { ...currentReport, reusedExisting: true };
        }

        const snapshot = { ...draftSnapshot, reportVersion: 1 } satisfies ReportSnapshot;
        const report = await transaction.generatedReport.create({
          data: {
            organizationId: actor.organizationId,
            studentId: scope.studentId,
            academicPeriodId: scope.academicPeriodId,
            periodStart: databaseDate(scope.periodStart),
            periodEnd: databaseDate(scope.periodEnd),
            reportNumber,
            version: 1,
            status: "ISSUED",
            reportSnapshot: snapshot,
            issuedAt,
            generatedById: actor.id,
          },
          select: { id: true, reportNumber: true, version: true },
        });

        return { ...report, reusedExisting: false };
      }

      const previousReport = await transaction.generatedReport.findFirst({
        where: {
          id: values.supersedesReportId,
          organizationId: actor.organizationId,
        },
        select: {
          id: true,
          studentId: true,
          academicPeriodId: true,
          periodStart: true,
          periodEnd: true,
          status: true,
          version: true,
        },
      });

      if (
        !previousReport ||
        !canSupersedeReport({
          candidateScope: reportScopeFromDatabase(previousReport),
          candidateStatus: previousReport.status,
          nextScope: scope,
        })
      ) {
        throw new ReportError(
          "REPORT_REPLACEMENT_INVALID",
          "Laporan yang akan digantikan sudah tidak berlaku atau tidak sesuai dengan periode ini.",
        );
      }

      const update = await transaction.generatedReport.updateMany({
        where: {
          id: previousReport.id,
          organizationId: actor.organizationId,
          status: "ISSUED",
        },
        data: { status: "SUPERSEDED" },
      });

      if (update.count !== 1) {
        throw new ReportError(
          "REPORT_REPLACEMENT_INVALID",
          "Laporan yang akan digantikan sudah berubah. Periksa pratinjau lagi.",
        );
      }

      const version = previousReport.version + 1;
      const snapshot = { ...draftSnapshot, reportVersion: version } satisfies ReportSnapshot;
      const report = await transaction.generatedReport.create({
        data: {
          organizationId: actor.organizationId,
          studentId: scope.studentId,
          academicPeriodId: scope.academicPeriodId,
          periodStart: databaseDate(scope.periodStart),
          periodEnd: databaseDate(scope.periodEnd),
          reportNumber,
          version,
          status: "ISSUED",
          supersedesReportId: previousReport.id,
          reportSnapshot: snapshot,
          issuedAt,
          generatedById: actor.id,
        },
        select: { id: true, reportNumber: true, version: true },
      });

      return { ...report, reusedExisting: false };
    },
    { isolationLevel: "Serializable" },
  );
}

export async function getGeneratedReportSnapshot(actor: AuthenticatedUser, reportId: string) {
  assertReportAccess(actor);

  const report = await db.generatedReport.findFirst({
    where: { id: reportId, organizationId: actor.organizationId },
    select: { reportNumber: true, reportSnapshot: true, version: true, issuedAt: true },
  });

  if (!report) {
    throw new ReportError("REPORT_NOT_FOUND", "Laporan tidak ditemukan.");
  }

  const legacySnapshot = report.reportSnapshot as unknown as Omit<
    ReportSnapshot,
    "issuedAt" | "reportNumber" | "reportVersion" | "schemaVersion"
  > & { generatedAt?: string };

  return {
    ...legacySnapshot,
    schemaVersion: 1 as const,
    reportNumber: report.reportNumber,
    reportVersion: report.version,
    issuedAt: report.issuedAt.toISOString(),
  };
}
