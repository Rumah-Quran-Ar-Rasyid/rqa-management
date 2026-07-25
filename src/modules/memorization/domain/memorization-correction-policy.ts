import type {
  AcademicPeriodStatus,
  MemorizationRecordStatus,
  RoleCode,
} from "@/generated/prisma/enums";
import { PERMISSIONS, hasPermission } from "../../auth/domain/authorization";

type RecordAccessContext = {
  academicPeriodStatus: AcademicPeriodStatus;
  actorId: string;
  actorRoles: readonly RoleCode[];
  createdAt: Date;
  recordStatus: MemorizationRecordStatus;
  teacherUserId: string;
};

export function canViewMemorizationRecord(roles: readonly RoleCode[]) {
  return hasPermission(roles, PERMISSIONS.VIEW_MEMORIZATION_RECORD);
}

export function canAccessMemorizationRecord({
  actorId,
  actorRoles,
  teacherUserId,
}: Pick<RecordAccessContext, "actorId" | "actorRoles" | "teacherUserId">) {
  return (
    canViewMemorizationRecord(actorRoles) &&
    (actorId === teacherUserId ||
      actorRoles.includes("ADMIN") ||
      actorRoles.includes("HEAD"))
  );
}

export function isWithinTeacherCorrectionWindow({
  createdAt,
  now,
}: {
  createdAt: Date;
  now: Date;
}) {
  return createdAt.getTime() >= now.getTime() - 24 * 60 * 60 * 1_000;
}

export function canCorrectMemorizationRecord({
  academicPeriodStatus,
  actorId,
  actorRoles,
  createdAt,
  now,
  recordStatus,
  teacherUserId,
}: RecordAccessContext & { now: Date }) {
  if (
    recordStatus !== "ACTIVE" ||
    academicPeriodStatus !== "ACTIVE" ||
    !hasPermission(actorRoles, PERMISSIONS.UPDATE_MEMORIZATION_RECORD)
  ) {
    return false;
  }

  if (hasPermission(actorRoles, PERMISSIONS.VOID_MEMORIZATION_RECORD)) {
    return true;
  }

  return (
    actorId === teacherUserId &&
    isWithinTeacherCorrectionWindow({ createdAt, now })
  );
}

export function canVoidMemorizationRecord({
  academicPeriodStatus,
  actorRoles,
  recordStatus,
}: Pick<
  RecordAccessContext,
  "academicPeriodStatus" | "actorRoles" | "recordStatus"
>) {
  return (
    recordStatus === "ACTIVE" &&
    academicPeriodStatus === "ACTIVE" &&
    hasPermission(actorRoles, PERMISSIONS.VOID_MEMORIZATION_RECORD)
  );
}
