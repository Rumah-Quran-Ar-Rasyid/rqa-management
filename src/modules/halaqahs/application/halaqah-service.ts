import "server-only";

import type { MasterDataStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { AuthenticatedUser } from "@/modules/auth/application/session";
import {
  canAccessHalaqahDirectory,
  canChangeHalaqahStatus,
  canEditHalaqah,
  canManageHalaqahs,
} from "@/modules/halaqahs/domain/halaqah-policy";
import {
  createHalaqahSchema,
  halaqahStatusChangeSchema,
  updateHalaqahSchema,
  type CreateHalaqahInput,
  type HalaqahStatusChangeInput,
  type UpdateHalaqahInput,
} from "@/modules/halaqahs/domain/halaqah-schemas";

export type HalaqahDirectoryItem = {
  id: string;
  name: string;
  description: string | null;
  status: MasterDataStatus;
};

type HalaqahErrorCode =
  | "FORBIDDEN"
  | "HALAQAH_ARCHIVED"
  | "HALAQAH_NAME_IN_USE"
  | "HALAQAH_NOT_FOUND"
  | "STATUS_UNCHANGED";

export class HalaqahError extends Error {
  constructor(
    readonly code: HalaqahErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function halaqahNotFound() {
  return new HalaqahError("HALAQAH_NOT_FOUND", "Halaqah tidak ditemukan.");
}

function archivedHalaqah() {
  return new HalaqahError(
    "HALAQAH_ARCHIVED",
    "Halaqah yang sudah diarsipkan tidak dapat diubah.",
  );
}

export async function listHalaqahs(actor: AuthenticatedUser) {
  if (!canAccessHalaqahDirectory(actor.roles)) {
    throw new HalaqahError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk melihat halaqah.",
    );
  }

  return db.halaqah.findMany({
    where: { organizationId: actor.organizationId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createHalaqah(
  actor: AuthenticatedUser,
  input: CreateHalaqahInput,
) {
  if (!canManageHalaqahs(actor.roles)) {
    throw new HalaqahError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk membuat halaqah.",
    );
  }

  const values = createHalaqahSchema.parse(input);

  try {
    await db.$transaction(
      async (transaction) => {
        const halaqah = await transaction.halaqah.create({
          data: {
            organizationId: actor.organizationId,
            name: values.name,
            description: values.description,
          },
          select: { id: true },
        });

        await transaction.operationalAuditLog.create({
          data: {
            organizationId: actor.organizationId,
            domain: "HALAQAH",
            entityId: halaqah.id,
            action: "HALAQAH_CREATED",
            afterData: {
              name: values.name,
              description: values.description ?? null,
              status: "ACTIVE",
            },
            performedById: actor.id,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof HalaqahError) {
      throw error;
    }

    if (hasErrorCode(error, "P2002")) {
      throw new HalaqahError(
        "HALAQAH_NAME_IN_USE",
        "Nama halaqah tersebut sudah digunakan.",
      );
    }

    throw error;
  }
}

export async function updateHalaqah(
  actor: AuthenticatedUser,
  input: UpdateHalaqahInput,
) {
  if (!canManageHalaqahs(actor.roles)) {
    throw new HalaqahError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mengubah halaqah.",
    );
  }

  const values = updateHalaqahSchema.parse(input);

  try {
    await db.$transaction(
      async (transaction) => {
        const halaqah = await transaction.halaqah.findUnique({
          where: {
            id_organizationId: {
              id: values.halaqahId,
              organizationId: actor.organizationId,
            },
          },
          select: { id: true, name: true, description: true, status: true },
        });

        if (!halaqah) {
          throw halaqahNotFound();
        }

        if (!canEditHalaqah(halaqah.status)) {
          throw archivedHalaqah();
        }

        await transaction.halaqah.update({
          where: {
            id_organizationId: {
              id: halaqah.id,
              organizationId: actor.organizationId,
            },
          },
          data: {
            name: values.name,
            description: values.description,
          },
        });

        await transaction.operationalAuditLog.create({
          data: {
            organizationId: actor.organizationId,
            domain: "HALAQAH",
            entityId: halaqah.id,
            action: "HALAQAH_UPDATED",
            beforeData: {
              name: halaqah.name,
              description: halaqah.description,
            },
            afterData: {
              name: values.name,
              description: values.description ?? null,
            },
            performedById: actor.id,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error instanceof HalaqahError) {
      throw error;
    }

    if (hasErrorCode(error, "P2002")) {
      throw new HalaqahError(
        "HALAQAH_NAME_IN_USE",
        "Nama halaqah tersebut sudah digunakan.",
      );
    }

    throw error;
  }
}

export async function changeHalaqahStatus(
  actor: AuthenticatedUser,
  input: HalaqahStatusChangeInput,
) {
  if (!canManageHalaqahs(actor.roles)) {
    throw new HalaqahError(
      "FORBIDDEN",
      "Anda tidak memiliki hak untuk mengubah status halaqah.",
    );
  }

  const values = halaqahStatusChangeSchema.parse(input);

  await db.$transaction(
    async (transaction) => {
      const halaqah = await transaction.halaqah.findUnique({
        where: {
          id_organizationId: {
            id: values.halaqahId,
            organizationId: actor.organizationId,
          },
        },
        select: { id: true, status: true },
      });

      if (!halaqah) {
        throw halaqahNotFound();
      }

      if (
        !canChangeHalaqahStatus({
          currentStatus: halaqah.status,
          nextStatus: values.status,
        })
      ) {
        if (halaqah.status === "ARCHIVED") {
          throw archivedHalaqah();
        }

        throw new HalaqahError(
          "STATUS_UNCHANGED",
          "Status halaqah sudah sesuai.",
        );
      }

      await transaction.halaqah.update({
        where: {
          id_organizationId: {
            id: halaqah.id,
            organizationId: actor.organizationId,
          },
        },
        data: { status: values.status },
      });

      await transaction.operationalAuditLog.create({
        data: {
          organizationId: actor.organizationId,
          domain: "HALAQAH",
          entityId: halaqah.id,
          action: "HALAQAH_STATUS_CHANGED",
          beforeData: { status: halaqah.status },
          afterData: { status: values.status },
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
