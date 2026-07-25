import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import {
  getHeadStudentDetail,
  HeadDashboardError,
} from "@/modules/dashboard/application/head-dashboard-service";
import { HeadStudentDetailView } from "./head-student-detail";

export const metadata: Metadata = {
  title: "Detail Santri",
};

export default async function HeadStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const actor = await requireUser();
  const { studentId } = await params;

  let student;

  try {
    student = await getHeadStudentDetail(actor, studentId);
  } catch (error) {
    if (error instanceof HeadDashboardError) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <HeadStudentDetailView student={student} />
    </main>
  );
}
