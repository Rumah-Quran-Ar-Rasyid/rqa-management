import type { RoleCode } from "@/generated/prisma/enums";
import { PERMISSIONS, hasPermission } from "../../auth/domain/authorization";

export function canAccessAcademicPeriods(roles: readonly RoleCode[]) {
  return (
    canManageAcademicPeriods(roles) ||
    hasPermission(roles, PERMISSIONS.CLOSE_ACADEMIC_PERIOD) ||
    hasPermission(roles, PERMISSIONS.REOPEN_ACADEMIC_PERIOD)
  );
}

export function canManageAcademicPeriods(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.MANAGE_ACADEMIC_PERIOD);
}

export function canCloseAcademicPeriod(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.CLOSE_ACADEMIC_PERIOD);
}

export function canReopenAcademicPeriod(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.REOPEN_ACADEMIC_PERIOD);
}
