import type { RoleCode } from "@/generated/prisma/enums";
import { hasPermission, PERMISSIONS } from "../../auth/domain/authorization";

export function canGenerateReports(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.GENERATE_REPORT);
}
