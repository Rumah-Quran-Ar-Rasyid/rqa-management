import "server-only";

import type { MembershipStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import {
  canAccessHalaqahMemberships,
  canManageHalaqahMemberships,
  canMoveMembership,
} from "@/modules/memberships/domain/halaqah-membership-policy";
import {
  createHalaqahMembershipSchema,
  type CreateHalaqahMembershipInput,
} from "@/modules/memberships/domain/halaqah-membership-schemas";

export type MembershipOption = {
  id: string;
  label: string;
};

export type HalaqahMembershipItem = {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  halaqahName: string;
  validFrom: string;
  validUntil: string | null;
  status: MembershipStatus;
};

type HalaqahMembershipErrorCode =
  | "FORBIDDEN"
  | "HALAQAH_INACTIVE"
  | "MEMBERSHIP_CONFLICT"
  | "SAME_HALAQAH"
  | "STUDENT_INACTIVE"
  | "TRANSFER_DATE_INVALID";

export class HalaqahMembershipError extends Error {
  constructor(
    readonly code: HalaqahMembershipErrorCode,
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

function dayBefore(value: Date) {
  const previousDate = new Date(value);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);
  return previousDate;
}

export async function getHalaqahMembershipDirectory(actor: AuthenticatedUser) {
  if (!canAccessHalaqahMemberships(actor.roles)) {
    throw new HalaqahMembershipError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk melihat keanggotaan halaqah.",
    );
  }

  const [memberships, students, halaqahs] = await Promise.all([
    db.halaqahMembership.findMany({
      where: { organizationId: actor.organizationId },
      select: {
        id: true,
        validFrom: true,
        validUntil: true,
        status: true,
        student: { select: { id: true, fullName: true, studentNumber: true } },
        halaqah: { select: { name: true } },
      },
      orderBy: [{ validUntil: "asc" }, { validFrom: "desc" }],
    }),
    db.student.findMany({
      where: { organizationId: actor.organizationId, status: "ACTIVE" },
      select: { id: true, fullName: true, studentNumber: true },
      orderBy: { fullName: "asc" },
    }),
    db.halaqah.findMany({
      where: { organizationId: actor.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    memberships: memberships.map((membership) => ({
      id: membership.id,
      studentId: membership.student.id,
      studentName: membership.student.fullName,
      studentNumber: membership.student.studentNumber,
      halaqahName: membership.halaqah.name,
      validFrom: dateInputValue(membership.validFrom),
      validUntil: membership.validUntil
        ? dateInputValue(membership.validUntil)
        : null,
      status: membership.status,
    })) satisfies HalaqahMembershipItem[],
    students: students.map((student) => ({
      id: student.id,
      label: `${student.fullName} (${student.studentNumber})`,
    })) satisfies MembershipOption[],
    halaqahs: halaqahs.map((halaqah) => ({
      id: halaqah.id,
      label: halaqah.name,
    })) satisfies MembershipOption[],
  };
}

export async function createOrMoveHalaqahMembership(
  actor: AuthenticatedUser,
  input: CreateHalaqahMembershipInput,
) {
  if (!canManageHalaqahMemberships(actor.roles)) {
    throw new HalaqahMembershipError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mengatur keanggotaan halaqah.",
    );
  }

  const values = createHalaqahMembershipSchema.parse(input);
  const validFrom = databaseDate(values.validFrom);

  await db.$transaction(
    async (transaction) => {
      const [student, halaqah] = await Promise.all([
        transaction.student.findUnique({
          where: {
            id_organizationId: {
              id: values.studentId,
              organizationId: actor.organizationId,
            },
          },
          select: { id: true, status: true },
        }),
        transaction.halaqah.findUnique({
          where: {
            id_organizationId: {
              id: values.halaqahId,
              organizationId: actor.organizationId,
            },
          },
          select: { id: true, status: true },
        }),
      ]);

      if (!student || student.status !== "ACTIVE") {
        throw new HalaqahMembershipError(
          "STUDENT_INACTIVE",
          "Pilih santri yang masih aktif.",
        );
      }

      if (!halaqah || halaqah.status !== "ACTIVE") {
        throw new HalaqahMembershipError(
          "HALAQAH_INACTIVE",
          "Pilih halaqah yang masih aktif.",
        );
      }

      const currentMembership = await transaction.halaqahMembership.findFirst({
        where: {
          organizationId: actor.organizationId,
          studentId: student.id,
          status: "ACTIVE",
          validUntil: null,
        },
        select: { id: true, halaqahId: true, validFrom: true },
        orderBy: { validFrom: "desc" },
      });

      if (currentMembership?.halaqahId === halaqah.id) {
        throw new HalaqahMembershipError(
          "SAME_HALAQAH",
          "Santri sudah aktif di halaqah tersebut.",
        );
      }

      if (
        currentMembership &&
        !canMoveMembership({
          currentValidFrom: dateInputValue(currentMembership.validFrom),
          nextValidFrom: values.validFrom,
        })
      ) {
        throw new HalaqahMembershipError(
          "TRANSFER_DATE_INVALID",
          "Tanggal pindah harus setelah tanggal mulai halaqah sebelumnya.",
        );
      }

      const conflictingMembership = await transaction.halaqahMembership.findFirst({
        where: {
          organizationId: actor.organizationId,
          studentId: student.id,
          OR: [
            { validUntil: null },
            { validUntil: { gte: validFrom } },
          ],
          ...(currentMembership ? { id: { not: currentMembership.id } } : {}),
        },
        select: { id: true },
      });

      if (conflictingMembership) {
        throw new HalaqahMembershipError(
          "MEMBERSHIP_CONFLICT",
          "Santri memiliki riwayat halaqah yang bertumpang tindih pada tanggal tersebut.",
        );
      }

      if (currentMembership) {
        const previousValidUntil = dayBefore(validFrom);

        await transaction.halaqahMembership.updateMany({
          where: {
            id: currentMembership.id,
            organizationId: actor.organizationId,
            status: "ACTIVE",
            validUntil: null,
          },
          data: { status: "CLOSED", validUntil: previousValidUntil },
        });

        await transaction.operationalAuditLog.create({
          data: {
            organizationId: actor.organizationId,
            domain: "STUDENT_MEMBERSHIP",
            entityId: currentMembership.id,
            action: "STUDENT_MEMBERSHIP_CLOSED",
            beforeData: {
              halaqahId: currentMembership.halaqahId,
              validFrom: dateInputValue(currentMembership.validFrom),
              validUntil: null,
              status: "ACTIVE",
            },
            afterData: {
              validUntil: dateInputValue(previousValidUntil),
              status: "CLOSED",
            },
            performedById: actor.id,
          },
        });
      }

      const membership = await transaction.halaqahMembership.create({
        data: {
          organizationId: actor.organizationId,
          studentId: student.id,
          halaqahId: halaqah.id,
          validFrom,
          status: "ACTIVE",
          createdById: actor.id,
        },
        select: { id: true },
      });

      await transaction.operationalAuditLog.create({
        data: {
          organizationId: actor.organizationId,
          domain: "STUDENT_MEMBERSHIP",
          entityId: membership.id,
          action: currentMembership
            ? "STUDENT_MOVED_TO_HALAQAH"
            : "STUDENT_MEMBERSHIP_CREATED",
          afterData: {
            studentId: student.id,
            halaqahId: halaqah.id,
            validFrom: values.validFrom,
            validUntil: null,
            status: "ACTIVE",
          },
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}
