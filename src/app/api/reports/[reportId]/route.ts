import { NextResponse } from "next/server";

import { requireUser } from "@/modules/auth/application/session";
import { buildReportPdf } from "@/modules/reports/application/report-pdf";
import {
  getGeneratedReportSnapshot,
  ReportError,
} from "@/modules/reports/application/report-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const actor = await requireUser();
  const { reportId } = await params;

  try {
    const snapshot = await getGeneratedReportSnapshot(actor, reportId);
    const pdf = buildReportPdf(snapshot);
    const filename = `${snapshot.reportNumber ?? "laporan"}.pdf`;
    const disposition = new URL(request.url).searchParams.get("download") === "1"
      ? "attachment"
      : "inline";

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ReportError) {
      return NextResponse.json({ message: "Laporan tidak ditemukan." }, { status: 404 });
    }

    console.error("Report download failed", error);
    return NextResponse.json({ message: "PDF belum dapat dibuat." }, { status: 500 });
  }
}
