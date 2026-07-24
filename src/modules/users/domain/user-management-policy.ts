import type { RoleCode } from "@/generated/prisma/enums";
import {
  PERMISSIONS,
  canManageRole,
  hasPermission,
} from "../../auth/domain/authorization";

export function canAccessUserDirectory(roles: readonly RoleCode[]) {
  return (
    hasPermission(roles, PERMISSIONS.MANAGE_USER) ||
    hasPermission(roles, PERMISSIONS.MANAGE_ADMIN_ROLE) ||
    hasPermission(roles, PERMISSIONS.MANAGE_HEAD_ROLE)
  );
}

export function canCreateTeacher(roles: readonly RoleCode[]) {
  return (
    hasPermission(roles, PERMISSIONS.MANAGE_USER) &&
    canManageRole(roles, "TEACHER")
  );
}

export function canChangeUserStatus({
  actorId,
  actorRoles,
  targetId,
  targetRoles,
}: {
  actorId: string;
  actorRoles: readonly RoleCode[];
  targetId: string;
  targetRoles: readonly RoleCode[];
}) {
  if (
    actorId === targetId ||
    !hasPermission(actorRoles, PERMISSIONS.MANAGE_USER)
  ) {
    return false;
  }

  return !targetRoles.includes("HEAD") || canManageRole(actorRoles, "HEAD");
}
