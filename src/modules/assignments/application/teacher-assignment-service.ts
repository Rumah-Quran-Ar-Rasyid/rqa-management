import "server-only";

import type { TeacherAssignmentType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import {
  canAccessTeacherAssignments,
  canManageTeacherAssignments,
} from "@/modules/assignments/domain/teacher-assignment-policy";
import {
  closeTeacherAssignmentSchema,
  createTeacherAssignmentSchema,
  type CloseTeacherAssignmentInput,
  type CreateTeacherAssignmentInput,
} from "@/modules/assignments/domain/teacher-assignment-schemas";

export type AssignmentOption = {
  id: string;
  label: string;
};

export type TeacherAssignmentItem = {
  id: string;
  halaqahName: string;
  teacherName: string;
  assignmentType: TeacherAssignmentType;
  validFrom: string;
  validUntil: string | null;
};

type TeacherAssignmentErrorCode =
  | "ASSIGNMENT_NOT_FOUND"
  | "FORBIDDEN"
  | "HALAQAH_INACTIVE"
  | "PRIMARY_OVERLAP"
  | "TEACHER_INACTIVE"
  | "VALID_UNTIL_INVALID";

export class TeacherAssignmentError extends Error {
  constructor(
    readonly code: TeacherAssignmentErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function databaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateInputValue(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

export async function getTeacherAssignmentDirectory(actor: AuthenticatedUser) {
  if (!canAccessTeacherAssignments(actor.roles)) {
    throw new TeacherAssignmentError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk melihat penugasan Pengajar.",
    );
  }

  const [assignments, halaqahs, teachers] = await Promise.all([
    db.halaqahTeacherAssignment.findMany({
      where: { organizationId: actor.organizationId },
      select: {
        id: true,
        assignmentType: true,
        validFrom: true,
        validUntil: true,
        halaqah: { select: { name: true } },
        teacher: { select: { name: true } },
      },
      orderBy: [{ validUntil: "asc" }, { validFrom: "desc" }],
    }),
    db.halaqah.findMany({
      where: { organizationId: actor.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: {
        organizationId: actor.organizationId,
        status: "ACTIVE",
        roles: {
          some: { revokedAt: null, role: { code: "TEACHER" } },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      halaqahName: assignment.halaqah.name,
      teacherName: assignment.teacher.name,
      assignmentType: assignment.assignmentType,
      validFrom: dateInputValue(assignment.validFrom) ?? "",
      validUntil: dateInputValue(assignment.validUntil),
    })),
    halaqahs: halaqahs.map((halaqah) => ({ id: halaqah.id, label: halaqah.name })),
    teachers: teachers.map((teacher) => ({ id: teacher.id, label: teacher.name })),
  };
}

export async function createTeacherAssignment(
  actor: AuthenticatedUser,
  input: CreateTeacherAssignmentInput,
) {
  if (!canManageTeacherAssignments(actor.roles)) {
    throw new TeacherAssignmentError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk menetapkan Pengajar.",
    );
  }

  const values = createTeacherAssignmentSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const [halaqah, teacher] = await Promise.all([
        transaction.halaqah.findUnique({
          where: {
            id_organizationId: {
              id: values.halaqahId,
              organizationId: actor.organizationId,
            },
          },
          select: { id: true, status: true },
        }),
        transaction.user.findUnique({
          where: {
            id_organizationId: {
              id: values.teacherUserId,
              organizationId: actor.organizationId,
            },
          },
          select: {
            id: true,
            status: true,
            roles: {
              where: { revokedAt: null },
              select: { role: { select: { code: true } } },
            },
          },
        }),
      ]);

      if (!halaqah || halaqah.status !== "ACTIVE") {
        throw new TeacherAssignmentError(
          "HALAQAH_INACTIVE",
          "Pilih halaqah yang masih aktif.",
        );
      }

      if (
        !teacher ||
        teacher.status !== "ACTIVE" ||
        !teacher.roles.some(({ role }) => role.code === "TEACHER")
      ) {
        throw new TeacherAssignmentError(
          "TEACHER_INACTIVE",
          "Pilih akun Pengajar yang masih aktif.",
        );
      }

      if (values.assignmentType === "PRIMARY") {
        const candidateEnd = values.validUntil
          ? databaseDate(values.validUntil)
          : null;
        const overlappingPrimary = await transaction.halaqahTeacherAssignment.findFirst({
          where: {
            organizationId: actor.organizationId,
            halaqahId: halaqah.id,
            assignmentType: "PRIMARY",
            AND: [
              {
                OR: [
                  { validUntil: null },
                  { validUntil: { gte: databaseDate(values.validFrom) } },
                ],
              },
              ...(candidateEnd ? [{ validFrom: { lte: candidateEnd } }] : []),
            ],
          },
          select: { id: true },
        });

        if (overlappingPrimary) {
          throw new TeacherAssignmentError(
            "PRIMARY_OVERLAP",
            "Halaqah ini sudah memiliki Pengajar Utama pada rentang tersebut.",
          );
        }
      }

      const assignment = await transaction.halaqahTeacherAssignment.create({
        data: {
          organizationId: actor.organizationId,
          halaqahId: halaqah.id,
          teacherUserId: teacher.id,
          assignmentType: values.assignmentType,
          validFrom: databaseDate(values.validFrom),
          validUntil: values.validUntil
            ? databaseDate(values.validUntil)
            : undefined,
          createdById: actor.id,
        },
        select: { id: true },
      });

      await transaction.operationalAuditLog.create({
        data: {
          organizationId: actor.organizationId,
          domain: "TEACHER_ASSIGNMENT",
          entityId: assignment.id,
          action: "TEACHER_ASSIGNED",
          afterData: {
            halaqahId: halaqah.id,
            teacherUserId: teacher.id,
            assignmentType: values.assignmentType,
            validFrom: values.validFrom,
            validUntil: values.validUntil ?? null,
          },
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function closeTeacherAssignment(
  actor: AuthenticatedUser,
  input: CloseTeacherAssignmentInput,
) {
  if (!canManageTeacherAssignments(actor.roles)) {
    throw new TeacherAssignmentError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mengakhiri penugasan Pengajar.",
    );
  }

  const values = closeTeacherAssignmentSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const assignment = await transaction.halaqahTeacherAssignment.findFirst({
        where: {
          id: values.assignmentId,
          organizationId: actor.organizationId,
        },
        select: { id: true, validFrom: true, validUntil: true },
      });

      if (!assignment) {
        throw new TeacherAssignmentError(
          "ASSIGNMENT_NOT_FOUND",
          "Penugasan tidak ditemukan.",
        );
      }

      if (assignment.validUntil !== null) {
        throw new TeacherAssignmentError(
          "VALID_UNTIL_INVALID",
          "Penugasan ini sudah memiliki tanggal selesai.",
        );
      }

      const validUntil = databaseDate(values.validUntil);
      if (validUntil < assignment.validFrom) {
        throw new TeacherAssignmentError(
          "VALID_UNTIL_INVALID",
          "Tanggal selesai tidak boleh sebelum tanggal mulai.",
        );
      }

      await transaction.halaqahTeacherAssignment.updateMany({
        where: {
          id: assignment.id,
          organizationId: actor.organizationId,
        },
        data: { validUntil },
      });

      await transaction.operationalAuditLog.create({
        data: {
          organizationId: actor.organizationId,
          domain: "TEACHER_ASSIGNMENT",
          entityId: assignment.id,
          action: "TEACHER_ASSIGNMENT_CLOSED",
          beforeData: { validUntil: null },
          afterData: { validUntil: values.validUntil },
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}
