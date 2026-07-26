"use server";

import { requireUser } from "@/modules/auth/application/session";
import {
  generateReport,
  previewReport,
  ReportError,
  type ReportPreview,
} from "./report-service";
import type { ReportRequestInput } from "../domain/report-schemas";

export type ReportPreviewActionResult =
  | { success: true; preview: ReportPreview }
  | { success: false; message: string };

export type GenerateReportActionResult =
  | {
      success: true;
      reportId: string;
      reportNumber: string;
      version: number;
      reusedExisting: boolean;
      message: string;
    }
  | { success: false; message: string };

export async function previewReportAction(
  input: ReportRequestInput,
): Promise<ReportPreviewActionResult> {
  try {
    const actor = await requireUser();
    return { success: true, preview: await previewReport(actor, input) };
  } catch (error) {
    if (error instanceof ReportError) return { success: false, message: error.message };
    console.error("Report preview action failed", error);
    return { success: false, message: "Pratinjau laporan belum dapat dibuat. Silakan coba lagi." };
  }
}

export async function generateReportAction(
  input: ReportRequestInput,
): Promise<GenerateReportActionResult> {
  try {
    const actor = await requireUser();
    const report = await generateReport(actor, input);
    return {
      success: true,
      reportId: report.id,
      reportNumber: report.reportNumber,
      version: report.version,
      reusedExisting: report.reusedExisting,
      message: report.reusedExisting
        ? "Laporan yang masih berlaku siap diunduh."
        : "Laporan PDF berhasil diterbitkan.",
    };
  } catch (error) {
    if (error instanceof ReportError) return { success: false, message: error.message };
    console.error("Report generation action failed", error);
    return { success: false, message: "Laporan belum dapat dibuat. Silakan coba lagi." };
  }
}
