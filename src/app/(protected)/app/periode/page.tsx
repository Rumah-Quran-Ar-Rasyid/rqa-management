import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import {
  canAccessAcademicPeriods,
  canCloseAcademicPeriod,
  canManageAcademicPeriods,
  canReopenAcademicPeriod,
} from "@/modules/periods/domain/academic-period-policy";
import { listAcademicPeriods } from "@/modules/periods/application/academic-period-service";
import { AcademicPeriodManagement } from "./academic-period-management";

export const metadata: Metadata = {
  title: "Periode",
};

export default async function AcademicPeriodsPage() {
  const actor = await requireUser();

  if (!canAccessAcademicPeriods(actor.roles)) {
    notFound();
  }

  const periods = await listAcademicPeriods(actor);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <AcademicPeriodManagement
        canCreate={canManageAcademicPeriods(actor.roles)}
        canActivate={canManageAcademicPeriods(actor.roles)}
        canClose={canCloseAcademicPeriod(actor.roles)}
        canReopen={canReopenAcademicPeriod(actor.roles)}
        periods={periods}
      />
    </main>
  );
}
