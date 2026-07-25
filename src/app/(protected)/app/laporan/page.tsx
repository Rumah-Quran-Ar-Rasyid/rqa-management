import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/auth/application/session";
import { getReportDirectory, ReportError } from "@/modules/reports/application/report-service";
import { ReportWorkspace } from "./report-workspace";

export const metadata: Metadata = {
  title: "Laporan",
};

export default async function ReportsPage() {
  const actor = await requireUser();
  let directory;

  try {
    directory = await getReportDirectory(actor);
  } catch (error) {
    if (error instanceof ReportError) notFound();
    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <ReportWorkspace directory={directory} />
    </main>
  );
}
