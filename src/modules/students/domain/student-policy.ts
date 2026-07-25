import type { MasterDataStatus, RoleCode } from "@/generated/prisma/enums";
import { PERMISSIONS, hasPermission } from "../../auth/domain/authorization";

export function canAccessStudentDirectory(roles: readonly RoleCode[]) {
  return (
    canManageStudents(roles) || hasPermission(roles, PERMISSIONS.VIEW_STUDENT)
  );
}

export function canManageStudents(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.MANAGE_STUDENT);
}

export function canEditStudent(status: MasterDataStatus) {
  return status !== "ARCHIVED";
}

export function canChangeStudentStatus({
  currentStatus,
  nextStatus,
}: {
  currentStatus: MasterDataStatus;
  nextStatus: MasterDataStatus;
}) {
  return currentStatus !== "ARCHIVED" && currentStatus !== nextStatus;
}
