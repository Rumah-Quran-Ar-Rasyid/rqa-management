import type { GeneratedReportStatus } from "@/generated/prisma/enums";

export type ReportScope = {
  studentId: string;
  academicPeriodId: string | null;
  periodStart: string;
  periodEnd: string;
};

export function hasSameReportScope(first: ReportScope, second: ReportScope) {
  return (
    first.studentId === second.studentId &&
    first.academicPeriodId === second.academicPeriodId &&
    first.periodStart === second.periodStart &&
    first.periodEnd === second.periodEnd
  );
}

export function canSupersedeReport({
  candidateScope,
  candidateStatus,
  nextScope,
}: {
  candidateScope: ReportScope;
  candidateStatus: GeneratedReportStatus;
  nextScope: ReportScope;
}) {
  return candidateStatus === "ISSUED" && hasSameReportScope(candidateScope, nextScope);
}
