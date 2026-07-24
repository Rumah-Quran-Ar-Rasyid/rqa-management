"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/modules/auth/application/session";
import {
  AcademicPeriodError,
  activateAcademicPeriod,
  closeAcademicPeriod,
  createAcademicPeriod,
  reopenAcademicPeriod,
} from "./academic-period-service";
import type {
  AcademicPeriodIdInput,
  AcademicPeriodReasonInput,
  CreateAcademicPeriodInput,
} from "../domain/academic-period-schemas";

export type AcademicPeriodActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function createAcademicPeriodAction(
  input: CreateAcademicPeriodInput,
): Promise<AcademicPeriodActionResult> {
  return runAcademicPeriodAction(async () => {
    const actor = await requireUser();
    await createAcademicPeriod(actor, input);
    return "Periode berhasil dibuat.";
  });
}

export async function activateAcademicPeriodAction(
  input: AcademicPeriodIdInput,
): Promise<AcademicPeriodActionResult> {
  return runAcademicPeriodAction(async () => {
    const actor = await requireUser();
    await activateAcademicPeriod(actor, input);
    return "Periode berhasil diaktifkan.";
  });
}

export async function closeAcademicPeriodAction(
  input: AcademicPeriodReasonInput,
): Promise<AcademicPeriodActionResult> {
  return runAcademicPeriodAction(async () => {
    const actor = await requireUser();
    await closeAcademicPeriod(actor, input);
    return "Periode berhasil ditutup.";
  });
}

export async function reopenAcademicPeriodAction(
  input: AcademicPeriodReasonInput,
): Promise<AcademicPeriodActionResult> {
  return runAcademicPeriodAction(async () => {
    const actor = await requireUser();
    await reopenAcademicPeriod(actor, input);
    return "Periode berhasil dibuka kembali.";
  });
}

async function runAcademicPeriodAction(
  operation: () => Promise<string>,
): Promise<AcademicPeriodActionResult> {
  try {
    const message = await operation();
    revalidatePath("/app");
    revalidatePath("/app/periode");
    return { success: true, message };
  } catch (error) {
    if (error instanceof AcademicPeriodError) {
      return { success: false, message: error.message };
    }

    console.error("Academic period action failed", error);
    return {
      success: false,
      message: "Perubahan periode belum dapat disimpan. Silakan coba lagi.",
    };
  }
}
