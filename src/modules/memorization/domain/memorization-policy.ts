import type { RoleCode } from "@/generated/prisma/enums";
import { PERMISSIONS, hasPermission } from "../../auth/domain/authorization";

export function canCreateMemorizationRecord(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.CREATE_MEMORIZATION_RECORD);
}

export function isDateWithinRange({
  date,
  validFrom,
  validUntil,
}: {
  date: string;
  validFrom: string;
  validUntil: string | null;
}) {
  return (
    validFrom <= date && (validUntil === null || date <= validUntil)
  );
}
