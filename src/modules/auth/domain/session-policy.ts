import type {
  OrganizationStatus,
  RoleCode,
  UserStatus,
} from "@/generated/prisma/enums";

export type SessionState = {
  expiresAt: Date;
  revokedAt: Date | null;
  organizationStatus: OrganizationStatus;
  userStatus: UserStatus;
  roles: readonly RoleCode[];
};

export function isSessionUsable(
  session: SessionState | null,
  now = new Date(),
) {
  return (
    session !== null &&
    session.revokedAt === null &&
    session.expiresAt > now &&
    session.organizationStatus === "ACTIVE" &&
    session.userStatus === "ACTIVE" &&
    session.roles.length > 0
  );
}
