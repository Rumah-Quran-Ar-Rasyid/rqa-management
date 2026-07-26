import type { RoleCode } from "@/generated/prisma/enums";
import { PERMISSIONS, hasPermission } from "../../auth/domain/authorization";

export function canAccessHeadDashboard(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.VIEW_ACADEMIC_DASHBOARD);
}
