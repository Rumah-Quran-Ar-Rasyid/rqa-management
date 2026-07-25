import type { RoleCode } from "@/generated/prisma/enums";
import { PERMISSIONS, hasPermission } from "../../auth/domain/authorization";

export function canAccessHalaqahMemberships(roles: readonly RoleCode[]) {
  return (
    canManageHalaqahMemberships(roles) ||
    hasPermission(roles, PERMISSIONS.VIEW_HALAQAH_MEMBERSHIP)
  );
}

export function canManageHalaqahMemberships(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.MANAGE_HALAQAH_MEMBERSHIP);
}

export function canMoveMembership({
  currentValidFrom,
  nextValidFrom,
}: {
  currentValidFrom: string;
  nextValidFrom: string;
}) {
  return nextValidFrom > currentValidFrom;
}
