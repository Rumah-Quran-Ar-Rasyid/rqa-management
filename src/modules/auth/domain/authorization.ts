import type { RoleCode, UserStatus } from "@/generated/prisma/enums";

export const PERMISSIONS = {
  VIEW_OPERATIONAL_AUDIT: "VIEW_OPERATIONAL_AUDIT",
  VIEW_ACADEMIC_AUDIT: "VIEW_ACADEMIC_AUDIT",
  MANAGE_USER: "MANAGE_USER",
  MANAGE_TEACHER_ROLE: "MANAGE_TEACHER_ROLE",
  MANAGE_ADMIN_ROLE: "MANAGE_ADMIN_ROLE",
  MANAGE_HEAD_ROLE: "MANAGE_HEAD_ROLE",
  MANAGE_ACADEMIC_PERIOD: "MANAGE_ACADEMIC_PERIOD",
  CLOSE_ACADEMIC_PERIOD: "CLOSE_ACADEMIC_PERIOD",
  REOPEN_ACADEMIC_PERIOD: "REOPEN_ACADEMIC_PERIOD",
  VIEW_HALAQAH: "VIEW_HALAQAH",
  MANAGE_HALAQAH: "MANAGE_HALAQAH",
  VIEW_STUDENT: "VIEW_STUDENT",
  MANAGE_STUDENT: "MANAGE_STUDENT",
  VIEW_TEACHER_ASSIGNMENT: "VIEW_TEACHER_ASSIGNMENT",
  MANAGE_TEACHER_ASSIGNMENT: "MANAGE_TEACHER_ASSIGNMENT",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type AuthorizationContext = {
  organizationId: string;
  roles: readonly RoleCode[];
  status: UserStatus;
};

const ROLE_PERMISSIONS: Record<RoleCode, ReadonlySet<Permission>> = {
  ADMIN: new Set([
    PERMISSIONS.VIEW_OPERATIONAL_AUDIT,
    PERMISSIONS.MANAGE_USER,
    PERMISSIONS.MANAGE_TEACHER_ROLE,
    PERMISSIONS.MANAGE_ACADEMIC_PERIOD,
    PERMISSIONS.MANAGE_HALAQAH,
    PERMISSIONS.MANAGE_STUDENT,
    PERMISSIONS.MANAGE_TEACHER_ASSIGNMENT,
  ]),
  HEAD: new Set([
    PERMISSIONS.VIEW_ACADEMIC_AUDIT,
    PERMISSIONS.MANAGE_ADMIN_ROLE,
    PERMISSIONS.MANAGE_HEAD_ROLE,
    PERMISSIONS.CLOSE_ACADEMIC_PERIOD,
    PERMISSIONS.REOPEN_ACADEMIC_PERIOD,
    PERMISSIONS.VIEW_HALAQAH,
    PERMISSIONS.VIEW_STUDENT,
    PERMISSIONS.VIEW_TEACHER_ASSIGNMENT,
  ]),
  TEACHER: new Set(),
};

const ROLE_MANAGEMENT_PERMISSIONS: Record<RoleCode, Permission> = {
  ADMIN: PERMISSIONS.MANAGE_ADMIN_ROLE,
  HEAD: PERMISSIONS.MANAGE_HEAD_ROLE,
  TEACHER: PERMISSIONS.MANAGE_TEACHER_ROLE,
};

export function hasPermission(
  roles: readonly RoleCode[],
  permission: Permission,
) {
  return roles.some((role) => ROLE_PERMISSIONS[role].has(permission));
}

export function isAuthorized(
  context: AuthorizationContext,
  permission: Permission,
  resourceOrganizationId: string,
) {
  return (
    context.status === "ACTIVE" &&
    context.organizationId === resourceOrganizationId &&
    hasPermission(context.roles, permission)
  );
}

export function canManageRole(
  actorRoles: readonly RoleCode[],
  targetRole: RoleCode,
) {
  return hasPermission(actorRoles, ROLE_MANAGEMENT_PERMISSIONS[targetRole]);
}

export function canRemoveActiveHead(activeHeadCount: number) {
  return activeHeadCount > 1;
}
