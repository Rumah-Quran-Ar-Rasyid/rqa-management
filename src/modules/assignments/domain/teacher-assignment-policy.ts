import type { RoleCode, TeacherAssignmentType } from "@/generated/prisma/enums";
import { PERMISSIONS, hasPermission } from "../../auth/domain/authorization";

export function canAccessTeacherAssignments(roles: readonly RoleCode[]) {
  return (
    canManageTeacherAssignments(roles) ||
    hasPermission(roles, PERMISSIONS.VIEW_TEACHER_ASSIGNMENT)
  );
}

export function canManageTeacherAssignments(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.MANAGE_TEACHER_ASSIGNMENT);
}

export function assignmentRangesOverlap({
  firstStart,
  firstEnd,
  secondStart,
  secondEnd,
}: {
  firstStart: string;
  firstEnd: string | null;
  secondStart: string;
  secondEnd: string | null;
}) {
  return (
    (firstEnd === null || firstEnd >= secondStart) &&
    (secondEnd === null || secondEnd >= firstStart)
  );
}

export function requiresEndDate(type: TeacherAssignmentType) {
  return type === "SUBSTITUTE";
}
