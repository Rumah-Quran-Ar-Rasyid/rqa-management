import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AcademicPeriodStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import {
  canAccessAcademicPeriods,
  canCloseAcademicPeriod,
  canManageAcademicPeriods,
  canReopenAcademicPeriod,
} from "@/modules/periods/domain/academic-period-policy";
import {
  academicPeriodIdSchema,
  academicPeriodReasonSchema,
  createAcademicPeriodSchema,
  type AcademicPeriodIdInput,
  type AcademicPeriodReasonInput,
  type CreateAcademicPeriodInput,
} from "@/modules/periods/domain/academic-period-schemas";

export type AcademicPeriodAuditItem = {
  id: string;
  action: string;
  previousStatus: AcademicPeriodStatus | null;
  nextStatus: AcademicPeriodStatus | null;
  reason: string | null;
  performedAt: string;
  performedByName: string;
};

export type AcademicPeriodDirectoryItem = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicPeriodStatus;
  wasReopened: boolean;
  history: AcademicPeriodAuditItem[];
};

type AcademicPeriodErrorCode =
  | "ACTIVE_PERIOD_EXISTS"
  | "FORBIDDEN"
  | "INVALID_STATUS"
  | "PERIOD_NAME_IN_USE"
  | "PERIOD_NOT_FOUND";

export class AcademicPeriodError extends Error {
  constructor(
    readonly code: AcademicPeriodErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const periodStatuses = ["PLANNED", "ACTIVE", "CLOSED"] as const;

function isAcademicPeriodStatus(value: unknown): value is AcademicPeriodStatus {
  return (
    typeof value === "string" &&
    (periodStatuses as readonly string[]).includes(value)
  );
}

function auditStatus(data: Prisma.JsonValue | null) {
  if (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "status" in data &&
    isAcademicPeriodStatus(data.status)
  ) {
    return data.status;
  }

  return null;
}

function databaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function periodNotFound() {
  return new AcademicPeriodError(
    "PERIOD_NOT_FOUND",
    "Periode tidak ditemukan.",
  );
}

function activePeriodExists() {
  return new AcademicPeriodError(
    "ACTIVE_PERIOD_EXISTS",
    "Masih ada periode aktif. Tutup periode tersebut terlebih dahulu.",
  );
}

export async function listAcademicPeriods(actor: AuthenticatedUser) {
  if (!canAccessAcademicPeriods(actor.roles)) {
    throw new AcademicPeriodError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk melihat periode.",
    );
  }

  const periods = await db.academicPeriod.findMany({
    where: { organizationId: actor.organizationId },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
    },
    orderBy: [{ startDate: "desc" }, { name: "asc" }],
  });

  const periodIds = periods.map((period) => period.id);
  const logs =
    periodIds.length === 0
      ? []
      : await db.operationalAuditLog.findMany({
          where: {
            organizationId: actor.organizationId,
            domain: "ACADEMIC_PERIOD",
            entityId: { in: periodIds },
          },
          select: {
            id: true,
            entityId: true,
            action: true,
            beforeData: true,
            afterData: true,
            reason: true,
            performedAt: true,
            performedBy: { select: { name: true } },
          },
          orderBy: { performedAt: "desc" },
        });

  const historyByPeriod = new Map<string, AcademicPeriodAuditItem[]>();

  for (const log of logs) {
    const history = historyByPeriod.get(log.entityId) ?? [];
    history.push({
      id: log.id,
      action: log.action,
      previousStatus: auditStatus(log.beforeData),
      nextStatus: auditStatus(log.afterData),
      reason: log.reason,
      performedAt: log.performedAt.toISOString(),
      performedByName: log.performedBy.name,
    });
    historyByPeriod.set(log.entityId, history);
  }

  return periods.map((period) => {
    const history = historyByPeriod.get(period.id) ?? [];

    return {
      id: period.id,
      name: period.name,
      startDate: dateInputValue(period.startDate),
      endDate: dateInputValue(period.endDate),
      status: period.status,
      wasReopened: history.some((entry) => entry.action === "PERIOD_REOPENED"),
      history,
    } satisfies AcademicPeriodDirectoryItem;
  });
}

export async function createAcademicPeriod(
  actor: AuthenticatedUser,
  input: CreateAcademicPeriodInput,
) {
  if (!canManageAcademicPeriods(actor.roles)) {
    throw new AcademicPeriodError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk membuat periode.",
    );
  }

  const values = createAcademicPeriodSchema.parse(input);

  try {
    await db.$transaction(
      async (transaction) => {
        const period = await transaction.academicPeriod.create({
          data: {
            organizationId: actor.organizationId,
            name: values.name,
            startDate: databaseDate(values.startDate),
            endDate: databaseDate(values.endDate),
          },
          select: { id: true },
        });

        await transaction.operationalAuditLog.create({
          data: {
            organizationId: actor.organizationId,
            domain: "ACADEMIC_PERIOD",
            entityId: period.id,
            action: "PERIOD_CREATED",
            afterData: {
              name: values.name,
              startDate: values.startDate,
              endDate: values.endDate,
              status: "PLANNED",
            },
            performedById: actor.id,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof AcademicPeriodError) {
      throw error;
    }

    if (hasErrorCode(error, "P2002")) {
      throw new AcademicPeriodError(
        "PERIOD_NAME_IN_USE",
        "Nama periode tersebut sudah digunakan.",
      );
    }

    throw error;
  }
}

export async function activateAcademicPeriod(
  actor: AuthenticatedUser,
  input: AcademicPeriodIdInput,
) {
  if (!canManageAcademicPeriods(actor.roles)) {
    throw new AcademicPeriodError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mengaktifkan periode.",
    );
  }

  const values = academicPeriodIdSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const period = await transaction.academicPeriod.findUnique({
        where: {
          id_organizationId: {
            id: values.periodId,
            organizationId: actor.organizationId,
          },
        },
        select: { id: true, status: true },
      });

      if (!period) {
        throw periodNotFound();
      }

      if (period.status !== "PLANNED") {
        throw new AcademicPeriodError(
          "INVALID_STATUS",
          "Hanya periode yang direncanakan dapat diaktifkan.",
        );
      }

      const activePeriod = await transaction.academicPeriod.findFirst({
        where: {
          organizationId: actor.organizationId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (activePeriod) {
        throw activePeriodExists();
      }

      await transaction.academicPeriod.update({
        where: {
          id_organizationId: {
            id: period.id,
            organizationId: actor.organizationId,
          },
        },
        data: { status: "ACTIVE" },
      });

      await transaction.operationalAuditLog.create({
        data: {
          organizationId: actor.organizationId,
          domain: "ACADEMIC_PERIOD",
          entityId: period.id,
          action: "PERIOD_ACTIVATED",
          beforeData: { status: period.status },
          afterData: { status: "ACTIVE" },
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function closeAcademicPeriod(
  actor: AuthenticatedUser,
  input: AcademicPeriodReasonInput,
) {
  if (!canCloseAcademicPeriod(actor.roles)) {
    throw new AcademicPeriodError(
      "FORBIDDEN",
      "Hanya Kepala yang dapat menutup periode.",
    );
  }

  const values = academicPeriodReasonSchema.parse(input);

  await transitionPeriodWithReason({
    actor,
    periodId: values.periodId,
    reason: values.reason,
    expectedStatus: "ACTIVE",
    nextStatus: "CLOSED",
    action: "PERIOD_CLOSED",
    invalidStatusMessage: "Hanya periode aktif yang dapat ditutup.",
  });
}

export async function reopenAcademicPeriod(
  actor: AuthenticatedUser,
  input: AcademicPeriodReasonInput,
) {
  if (!canReopenAcademicPeriod(actor.roles)) {
    throw new AcademicPeriodError(
      "FORBIDDEN",
      "Hanya Kepala yang dapat membuka kembali periode.",
    );
  }

  const values = academicPeriodReasonSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const activePeriod = await transaction.academicPeriod.findFirst({
        where: {
          organizationId: actor.organizationId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (activePeriod) {
        throw activePeriodExists();
      }

      await updatePeriodStatus({
        transaction,
        actor,
        periodId: values.periodId,
        reason: values.reason,
        expectedStatus: "CLOSED",
        nextStatus: "ACTIVE",
        action: "PERIOD_REOPENED",
        invalidStatusMessage: "Hanya periode yang sudah ditutup dapat dibuka kembali.",
      });
    },
    { isolationLevel: "Serializable" },
  );
}

async function transitionPeriodWithReason({
  actor,
  periodId,
  reason,
  expectedStatus,
  nextStatus,
  action,
  invalidStatusMessage,
}: {
  actor: AuthenticatedUser;
  periodId: string;
  reason: string;
  expectedStatus: AcademicPeriodStatus;
  nextStatus: AcademicPeriodStatus;
  action: "PERIOD_CLOSED";
  invalidStatusMessage: string;
}) {
  await db.$transaction(
    (transaction) =>
      updatePeriodStatus({
        transaction,
        actor,
        periodId,
        reason,
        expectedStatus,
        nextStatus,
        action,
        invalidStatusMessage,
      }),
    { isolationLevel: "Serializable" },
  );
}

async function updatePeriodStatus({
  transaction,
  actor,
  periodId,
  reason,
  expectedStatus,
  nextStatus,
  action,
  invalidStatusMessage,
}: {
  transaction: Prisma.TransactionClient;
  actor: AuthenticatedUser;
  periodId: string;
  reason: string;
  expectedStatus: AcademicPeriodStatus;
  nextStatus: AcademicPeriodStatus;
  action: "PERIOD_CLOSED" | "PERIOD_REOPENED";
  invalidStatusMessage: string;
}) {
  const period = await transaction.academicPeriod.findUnique({
    where: {
      id_organizationId: {
        id: periodId,
        organizationId: actor.organizationId,
      },
    },
    select: { id: true, status: true },
  });

  if (!period) {
    throw periodNotFound();
  }

  if (period.status !== expectedStatus) {
    throw new AcademicPeriodError("INVALID_STATUS", invalidStatusMessage);
  }

  await transaction.academicPeriod.update({
    where: {
      id_organizationId: {
        id: period.id,
        organizationId: actor.organizationId,
      },
    },
    data: { status: nextStatus },
  });

  await transaction.operationalAuditLog.create({
    data: {
      organizationId: actor.organizationId,
      domain: "ACADEMIC_PERIOD",
      entityId: period.id,
      action,
      beforeData: { status: period.status },
      afterData: { status: nextStatus },
      reason,
      performedById: actor.id,
    },
  });
}

function hasErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
