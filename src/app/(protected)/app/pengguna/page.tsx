import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import { canManageRole } from "@/modules/auth/domain/authorization";
import {
  canAccessUserDirectory,
  canCreateTeacher,
} from "@/modules/users/domain/user-management-policy";
import { listUsers } from "@/modules/users/application/user-service";
import { UsersManagement } from "./users-management";

export const metadata: Metadata = {
  title: "Pengguna",
};

const roleCodes = ["TEACHER", "ADMIN", "HEAD"] as const;

export default async function UsersPage() {
  const actor = await requireUser();

  if (!canAccessUserDirectory(actor.roles)) {
    notFound();
  }

  const users = await listUsers(actor);
  const manageableRoles = roleCodes.filter((role) =>
    canManageRole(actor.roles, role),
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <UsersManagement
        actorId={actor.id}
        actorRoles={actor.roles}
        canCreate={canCreateTeacher(actor.roles)}
        manageableRoles={manageableRoles}
        users={users}
      />
    </main>
  );
}
