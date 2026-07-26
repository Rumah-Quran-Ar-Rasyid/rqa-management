import type { MasterDataStatus, RoleCode } from "@/generated/prisma/enums";
import { PERMISSIONS, hasPermission } from "../../auth/domain/authorization";

export function canAccessHalaqahDirectory(roles: readonly RoleCode[]) {
  return (
    canManageHalaqahs(roles) || hasPermission(roles, PERMISSIONS.VIEW_HALAQAH)
  );
}

export function canManageHalaqahs(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.MANAGE_HALAQAH);
}

export function canEditHalaqah(status: MasterDataStatus) {
  return status !== "ARCHIVED";
}

export function canChangeHalaqahStatus({
  currentStatus,
  nextStatus,
}: {
  currentStatus: MasterDataStatus;
  nextStatus: MasterDataStatus;
}) {
  return currentStatus !== "ARCHIVED" && currentStatus !== nextStatus;
}
