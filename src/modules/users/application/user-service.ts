import "server-only";

import { hash } from "bcryptjs";

import type { Prisma } from "@/generated/prisma/client";
import type { RoleCode, UserStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import { canManageRole } from "@/modules/auth/domain/authorization";
import {
  canAccessUserDirectory,
  canChangeUserStatus,
  canCreateTeacher,
} from "@/modules/users/domain/user-management-policy";
import {
  createTeacherSchema,
  userRoleChangeSchema,
  userStatusChangeSchema,
  type CreateTeacherInput,
  type UserRoleChangeInput,
  type UserStatusChangeInput,
} from "@/modules/users/domain/user-schemas";

export type UserDirectoryItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  roles: RoleCode[];
};

type UserManagementErrorCode =
  | "FORBIDDEN"
  | "EMAIL_IN_USE"
  | "LAST_HEAD"
  | "ROLE_ALREADY_ASSIGNED"
  | "ROLE_NOT_ASSIGNED"
  | "SELF_STATUS_CHANGE"
  | "STATUS_UNCHANGED"
  | "USER_INACTIVE"
  | "USER_NOT_FOUND";

export class UserManagementError extends Error {
  constructor(
    readonly code: UserManagementErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function userNotFound() {
  return new UserManagementError(
    "USER_NOT_FOUND",
    "Pengguna tidak ditemukan.",
  );
}

async function activeHeadCount(
  organizationId: string,
  transaction: Prisma.TransactionClient,
) {
  return transaction.user.count({
    where: {
      organizationId,
      status: "ACTIVE",
      roles: {
        some: {
          revokedAt: null,
          role: { code: "HEAD" },
        },
      },
    },
  });
}

export async function listUsers(actor: AuthenticatedUser) {
  if (!canAccessUserDirectory(actor.roles)) {
    throw new UserManagementError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk melihat pengguna.",
    );
  }

  const users = await db.user.findMany({
    where: { organizationId: actor.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      roles: {
        where: { revokedAt: null },
        select: { role: { select: { code: true } } },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return users.map((user) => ({
    ...user,
    roles: user.roles.map(({ role }) => role.code),
  }));
}

export async function createTeacherUser(
  actor: AuthenticatedUser,
  input: CreateTeacherInput,
) {
  if (!canCreateTeacher(actor.roles)) {
    throw new UserManagementError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk membuat akun Pengajar.",
    );
  }

  const values = createTeacherSchema.parse(input);
  const passwordHash = await hash(values.password, 12);

  try {
    await db.$transaction(
      async (transaction) => {
        const existingUser = await transaction.user.findUnique({
          where: {
            organizationId_email: {
              organizationId: actor.organizationId,
              email: values.email,
            },
          },
          select: { id: true },
        });

        if (existingUser) {
          throw new UserManagementError(
            "EMAIL_IN_USE",
            "Email tersebut sudah digunakan pada Rumah Qur’an Ar-Rasyid.",
          );
        }

        const teacherRole = await transaction.role.findUnique({
          where: { code: "TEACHER" },
          select: { id: true },
        });

        if (!teacherRole) {
          throw new Error("Role Pengajar belum tersedia.");
        }

        const user = await transaction.user.create({
          data: {
            organizationId: actor.organizationId,
            name: values.name,
            email: values.email,
            phone: values.phone,
            passwordHash,
            status: "ACTIVE",
          },
          select: { id: true },
        });

        await transaction.userRole.create({
          data: {
            organizationId: actor.organizationId,
            userId: user.id,
            roleId: teacherRole.id,
            assignedById: actor.id,
          },
        });

        await transaction.operationalAuditLog.create({
          data: {
            organizationId: actor.organizationId,
            domain: "USER",
            entityId: user.id,
            action: "USER_CREATED",
            afterData: {
              name: values.name,
              email: values.email,
              status: "ACTIVE",
              roles: ["TEACHER"],
            },
            performedById: actor.id,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof UserManagementError) {
      throw error;
    }

    if (hasErrorCode(error, "P2002")) {
      throw new UserManagementError(
        "EMAIL_IN_USE",
        "Email tersebut sudah digunakan pada Rumah Qur’an Ar-Rasyid.",
      );
    }

    throw error;
  }
}

export async function changeUserStatus(
  actor: AuthenticatedUser,
  input: UserStatusChangeInput,
) {
  const values = userStatusChangeSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const target = await transaction.user.findUnique({
        where: {
          id_organizationId: {
            id: values.userId,
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
      });

      if (!target) {
        throw userNotFound();
      }

      const targetRoles = target.roles.map(({ role }) => role.code);
      if (
        !canChangeUserStatus({
          actorId: actor.id,
          actorRoles: actor.roles,
          targetId: target.id,
          targetRoles,
        })
      ) {
        const code = actor.id === target.id ? "SELF_STATUS_CHANGE" : "FORBIDDEN";
        throw new UserManagementError(
          code,
          code === "SELF_STATUS_CHANGE"
            ? "Anda tidak dapat mengubah status akun sendiri."
            : "Anda tidak memiliki hak untuk mengubah status pengguna ini.",
        );
      }

      if (target.status === values.status) {
        throw new UserManagementError(
          "STATUS_UNCHANGED",
          "Status pengguna sudah sesuai.",
        );
      }

      if (values.status !== "ACTIVE" && targetRoles.includes("HEAD")) {
        const heads = await activeHeadCount(actor.organizationId, transaction);

        if (heads <= 1) {
          throw new UserManagementError(
            "LAST_HEAD",
            "Kepala aktif terakhir tidak dapat dinonaktifkan.",
          );
        }
      }

      await transaction.user.update({
        where: {
          id_organizationId: {
            id: target.id,
            organizationId: actor.organizationId,
          },
        },
        data: { status: values.status },
      });

      if (values.status !== "ACTIVE") {
        await transaction.userSession.updateMany({
          where: {
            organizationId: actor.organizationId,
            userId: target.id,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      }

      await transaction.operationalAuditLog.create({
        data: {
          organizationId: actor.organizationId,
          domain: "USER",
          entityId: target.id,
          action: "USER_STATUS_CHANGED",
          beforeData: { status: target.status },
          afterData: { status: values.status },
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function changeUserRole(
  actor: AuthenticatedUser,
  input: UserRoleChangeInput,
) {
  const values = userRoleChangeSchema.parse(input);

  if (!canManageRole(actor.roles, values.role)) {
    throw new UserManagementError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mengubah role ini.",
    );
  }

  await db.$transaction(
    async (transaction) => {
      const [target, role] = await Promise.all([
        transaction.user.findUnique({
          where: {
            id_organizationId: {
              id: values.userId,
              organizationId: actor.organizationId,
            },
          },
          select: { id: true, status: true },
        }),
        transaction.role.findUnique({
          where: { code: values.role },
          select: { id: true },
        }),
      ]);

      if (!target || !role) {
        throw userNotFound();
      }

      const currentRole = await transaction.userRole.findUnique({
        where: {
          organizationId_userId_roleId: {
            organizationId: actor.organizationId,
            userId: target.id,
            roleId: role.id,
          },
        },
        select: { revokedAt: true },
      });

      if (values.operation === "ASSIGN") {
        if (target.status !== "ACTIVE") {
          throw new UserManagementError(
            "USER_INACTIVE",
            "Aktifkan pengguna sebelum memberikan role.",
          );
        }

        if (currentRole?.revokedAt === null) {
          throw new UserManagementError(
            "ROLE_ALREADY_ASSIGNED",
            "Role tersebut sudah aktif pada pengguna ini.",
          );
        }

        await transaction.userRole.upsert({
          where: {
            organizationId_userId_roleId: {
              organizationId: actor.organizationId,
              userId: target.id,
              roleId: role.id,
            },
          },
          update: {
            assignedById: actor.id,
            assignedAt: new Date(),
            revokedAt: null,
          },
          create: {
            organizationId: actor.organizationId,
            userId: target.id,
            roleId: role.id,
            assignedById: actor.id,
          },
        });
      } else {
        if (!currentRole || currentRole.revokedAt !== null) {
          throw new UserManagementError(
            "ROLE_NOT_ASSIGNED",
            "Role tersebut sudah tidak aktif pada pengguna ini.",
          );
        }

        if (values.role === "HEAD" && target.status === "ACTIVE") {
          const heads = await activeHeadCount(actor.organizationId, transaction);

          if (heads <= 1) {
            throw new UserManagementError(
              "LAST_HEAD",
              "Role Kepala aktif terakhir tidak dapat dicabut.",
            );
          }
        }

        await transaction.userRole.update({
          where: {
            organizationId_userId_roleId: {
              organizationId: actor.organizationId,
              userId: target.id,
              roleId: role.id,
            },
          },
          data: { revokedAt: new Date() },
        });

        const remainingRoles = await transaction.userRole.count({
          where: {
            organizationId: actor.organizationId,
            userId: target.id,
            revokedAt: null,
          },
        });

        if (remainingRoles === 0) {
          await transaction.userSession.updateMany({
            where: {
              organizationId: actor.organizationId,
              userId: target.id,
              revokedAt: null,
            },
            data: { revokedAt: new Date() },
          });
        }
      }

      await transaction.operationalAuditLog.create({
        data: {
          organizationId: actor.organizationId,
          domain: "ROLE",
          entityId: target.id,
          action:
            values.operation === "ASSIGN" ? "ROLE_ASSIGNED" : "ROLE_REVOKED",
          beforeData:
            values.operation === "ASSIGN"
              ? { role: values.role, active: false }
              : { role: values.role, active: true },
          afterData:
            values.operation === "ASSIGN"
              ? { role: values.role, active: true }
              : { role: values.role, active: false },
          performedById: actor.id,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

function hasErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
