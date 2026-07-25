import "server-only";

import type { MasterDataStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import {
  canAccessStudentDirectory,
  canChangeStudentStatus,
  canEditStudent,
  canManageStudents,
} from "@/modules/students/domain/student-policy";
import {
  createStudentSchema,
  studentStatusChangeSchema,
  updateStudentSchema,
  type CreateStudentInput,
  type StudentStatusChangeInput,
  type UpdateStudentInput,
} from "@/modules/students/domain/student-schemas";

export type PrimaryGuardian = {
  fullName: string;
  phone: string;
  email: string | null;
  relationship: string;
};

export type StudentDirectoryItem = {
  id: string;
  studentNumber: string;
  fullName: string;
  preferredName: string | null;
  joinedAt: string;
  status: MasterDataStatus;
  primaryGuardian: PrimaryGuardian | null;
};

type StudentErrorCode =
  | "FORBIDDEN"
  | "STUDENT_ARCHIVED"
  | "STUDENT_NOT_FOUND"
  | "STUDENT_NUMBER_IN_USE"
  | "STATUS_UNCHANGED";

export class StudentError extends Error {
  constructor(
    readonly code: StudentErrorCode,
    message: string,
  ) {
    super(message);
  }
}

type StudentValues = CreateStudentInput | UpdateStudentInput;

function studentNotFound() {
  return new StudentError("STUDENT_NOT_FOUND", "Santri tidak ditemukan.");
}

function archivedStudent() {
  return new StudentError(
    "STUDENT_ARCHIVED",
    "Santri yang sudah diarsipkan tidak dapat diubah.",
  );
}

function databaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function guardianDetails(values: StudentValues) {
  if (!values.guardianFullName) {
    return null;
  }

  return {
    fullName: values.guardianFullName,
    phone: values.guardianPhone,
    email: values.guardianEmail || null,
    relationship: values.guardianRelationship,
  };
}

export async function listStudents(actor: AuthenticatedUser) {
  if (!canAccessStudentDirectory(actor.roles)) {
    throw new StudentError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk melihat santri.",
    );
  }

  const students = await db.student.findMany({
    where: { organizationId: actor.organizationId },
    select: {
      id: true,
      studentNumber: true,
      fullName: true,
      preferredName: true,
      joinedAt: true,
      status: true,
      guardians: {
        where: { isPrimary: true, validUntil: null },
        select: {
          relationship: true,
          guardian: {
            select: {
              fullName: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { validFrom: "desc" },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  return students.map((student) => {
    const primaryGuardian = student.guardians[0];

    return {
      id: student.id,
      studentNumber: student.studentNumber,
      fullName: student.fullName,
      preferredName: student.preferredName,
      joinedAt: dateInputValue(student.joinedAt),
      status: student.status,
      primaryGuardian: primaryGuardian
        ? {
            ...primaryGuardian.guardian,
            relationship: primaryGuardian.relationship,
          }
        : null,
    } satisfies StudentDirectoryItem;
  });
}

export async function createStudent(
  actor: AuthenticatedUser,
  input: CreateStudentInput,
) {
  if (!canManageStudents(actor.roles)) {
    throw new StudentError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk membuat santri.",
    );
  }

  const values = createStudentSchema.parse(input);

  try {
    await db.$transaction(
      async (transaction) => {
        const student = await transaction.student.create({
          data: {
            organizationId: actor.organizationId,
            studentNumber: values.studentNumber,
            fullName: values.fullName,
            preferredName: values.preferredName,
            joinedAt: databaseDate(values.joinedAt),
          },
          select: { id: true },
        });

        await transaction.operationalAuditLog.create({
          data: {
            organizationId: actor.organizationId,
            domain: "STUDENT",
            entityId: student.id,
            action: "STUDENT_CREATED",
            afterData: {
              studentNumber: values.studentNumber,
              fullName: values.fullName,
              preferredName: values.preferredName ?? null,
              joinedAt: values.joinedAt,
              status: "ACTIVE",
            },
            performedById: actor.id,
          },
        });

        const guardian = guardianDetails(values);
        if (guardian) {
          await createPrimaryGuardian({
            transaction,
            actor,
            studentId: student.id,
            validFrom: values.joinedAt,
            guardian,
          });
        }
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof StudentError) {
      throw error;
    }

    if (hasErrorCode(error, "P2002")) {
      throw new StudentError(
        "STUDENT_NUMBER_IN_USE",
        "Nomor santri tersebut sudah digunakan.",
      );
    }

    throw error;
  }
}

export async function updateStudent(
  actor: AuthenticatedUser,
  input: UpdateStudentInput,
) {
  if (!canManageStudents(actor.roles)) {
    throw new StudentError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mengubah santri.",
    );
  }

  const values = updateStudentSchema.parse(input);

  try {
    await db.$transaction(
      async (transaction) => {
        const student = await transaction.student.findUnique({
          where: {
            id_organizationId: {
              id: values.studentId,
              organizationId: actor.organizationId,
            },
          },
          select: {
            id: true,
            studentNumber: true,
            fullName: true,
            preferredName: true,
            joinedAt: true,
            status: true,
          },
        });

        if (!student) {
          throw studentNotFound();
        }

        if (!canEditStudent(student.status)) {
          throw archivedStudent();
        }

        await transaction.student.update({
          where: {
            id_organizationId: {
              id: student.id,
              organizationId: actor.organizationId,
            },
          },
          data: {
            studentNumber: values.studentNumber,
            fullName: values.fullName,
            preferredName: values.preferredName,
            joinedAt: databaseDate(values.joinedAt),
          },
        });

        await transaction.operationalAuditLog.create({
          data: {
            organizationId: actor.organizationId,
            domain: "STUDENT",
            entityId: student.id,
            action: "STUDENT_UPDATED",
            beforeData: {
              studentNumber: student.studentNumber,
              fullName: student.fullName,
              preferredName: student.preferredName,
              joinedAt: dateInputValue(student.joinedAt),
            },
            afterData: {
              studentNumber: values.studentNumber,
              fullName: values.fullName,
              preferredName: values.preferredName ?? null,
              joinedAt: values.joinedAt,
            },
            performedById: actor.id,
          },
        });

        const guardian = guardianDetails(values);
        if (guardian) {
          await upsertPrimaryGuardian({
            transaction,
            actor,
            studentId: student.id,
            validFrom: values.joinedAt,
            guardian,
          });
        }
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof StudentError) {
      throw error;
    }

    if (hasErrorCode(error, "P2002")) {
      throw new StudentError(
        "STUDENT_NUMBER_IN_USE",
        "Nomor santri tersebut sudah digunakan.",
      );
    }

    throw error;
  }
}

export async function changeStudentStatus(
  actor: AuthenticatedUser,
  input: StudentStatusChangeInput,
) {
  if (!canManageStudents(actor.roles)) {
    throw new StudentError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mengubah status santri.",
    );
  }

  const values = studentStatusChangeSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const student = await transaction.student.findUnique({
        where: {
          id_organizationId: {
            id: values.studentId,
            organizationId: actor.organizationId,
          },
        },
        select: { id: true, status: true },
      });

      if (!student) {
        throw studentNotFound();
      }

      if (
        !canChangeStudentStatus({
          currentStatus: student.status,
          nextStatus: values.status,
        })
      ) {
        if (student.status === "ARCHIVED") {
          throw archivedStudent();
        }

        throw new StudentError(
          "STATUS_UNCHANGED",
          "Status santri sudah sesuai.",
        );
      }

      await transaction.student.update({
        where: {
          id_organizationId: {
            id: student.id,
            organizationId: actor.organizationId,
          },
        },
        data: { status: values.status },
      });

      await transaction.operationalAuditLog.create({
        data: {
          organizationId: actor.organizationId,
          domain: "STUDENT",
          entityId: student.id,
          action: "STUDENT_STATUS_CHANGED",
          beforeData: { status: student.status },
          afterData: { status: values.status },
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

async function upsertPrimaryGuardian({
  transaction,
  actor,
  studentId,
  validFrom,
  guardian,
}: {
  transaction: Prisma.TransactionClient;
  actor: AuthenticatedUser;
  studentId: string;
  validFrom: string;
  guardian: NonNullable<ReturnType<typeof guardianDetails>>;
}) {
  const link = await transaction.studentGuardian.findFirst({
    where: {
      organizationId: actor.organizationId,
      studentId,
      isPrimary: true,
      validUntil: null,
    },
    select: {
      id: true,
      relationship: true,
      guardian: {
        select: { id: true, fullName: true, phone: true, email: true },
      },
    },
    orderBy: { validFrom: "desc" },
  });

  if (!link) {
    await createPrimaryGuardian({
      transaction,
      actor,
      studentId,
      validFrom,
      guardian,
    });
    return;
  }

  await transaction.guardian.update({
    where: {
      id_organizationId: {
        id: link.guardian.id,
        organizationId: actor.organizationId,
      },
    },
    data: {
      fullName: guardian.fullName,
      phone: guardian.phone,
      email: guardian.email,
    },
  });

  await transaction.studentGuardian.update({
    where: { id: link.id },
    data: { relationship: guardian.relationship },
  });

  await transaction.operationalAuditLog.create({
    data: {
      organizationId: actor.organizationId,
      domain: "GUARDIAN",
      entityId: link.guardian.id,
      action: "GUARDIAN_UPDATED",
      beforeData: {
        fullName: link.guardian.fullName,
        phone: link.guardian.phone,
        email: link.guardian.email,
        relationship: link.relationship,
      },
      afterData: guardian,
      performedById: actor.id,
    },
  });
}

async function createPrimaryGuardian({
  transaction,
  actor,
  studentId,
  validFrom,
  guardian,
}: {
  transaction: Prisma.TransactionClient;
  actor: AuthenticatedUser;
  studentId: string;
  validFrom: string;
  guardian: NonNullable<ReturnType<typeof guardianDetails>>;
}) {
  const guardianRecord = await transaction.guardian.create({
    data: {
      organizationId: actor.organizationId,
      fullName: guardian.fullName,
      phone: guardian.phone,
      email: guardian.email,
    },
    select: { id: true },
  });

  const link = await transaction.studentGuardian.create({
    data: {
      organizationId: actor.organizationId,
      studentId,
      guardianId: guardianRecord.id,
      relationship: guardian.relationship,
      isPrimary: true,
      validFrom: databaseDate(validFrom),
    },
    select: { id: true },
  });

  await transaction.operationalAuditLog.createMany({
    data: [
      {
        organizationId: actor.organizationId,
        domain: "GUARDIAN",
        entityId: guardianRecord.id,
        action: "GUARDIAN_CREATED",
        afterData: guardian,
        performedById: actor.id,
      },
      {
        organizationId: actor.organizationId,
        domain: "GUARDIAN",
        entityId: link.id,
        action: "GUARDIAN_LINKED_TO_STUDENT",
        afterData: {
          studentId,
          guardianId: guardianRecord.id,
          relationship: guardian.relationship,
          isPrimary: true,
        },
        performedById: actor.id,
      },
    ],
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
