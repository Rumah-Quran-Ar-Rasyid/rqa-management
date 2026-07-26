"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/modules/auth/application/session";
import {
  HalaqahError,
  changeHalaqahStatus,
  createHalaqah,
  updateHalaqah,
} from "./halaqah-service";
import type {
  CreateHalaqahInput,
  HalaqahStatusChangeInput,
  UpdateHalaqahInput,
} from "../domain/halaqah-schemas";

export type HalaqahActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function createHalaqahAction(
  input: CreateHalaqahInput,
): Promise<HalaqahActionResult> {
  return runHalaqahAction(async () => {
    const actor = await requireUser();
    await createHalaqah(actor, input);
    return "Halaqah berhasil dibuat.";
  });
}

export async function updateHalaqahAction(
  input: UpdateHalaqahInput,
): Promise<HalaqahActionResult> {
  return runHalaqahAction(async () => {
    const actor = await requireUser();
    await updateHalaqah(actor, input);
    return "Halaqah berhasil diperbarui.";
  });
}

export async function changeHalaqahStatusAction(
  input: HalaqahStatusChangeInput,
): Promise<HalaqahActionResult> {
  return runHalaqahAction(async () => {
    const actor = await requireUser();
    await changeHalaqahStatus(actor, input);
    return input.status === "ACTIVE"
      ? "Halaqah berhasil diaktifkan."
      : input.status === "INACTIVE"
        ? "Halaqah berhasil dinonaktifkan."
        : "Halaqah berhasil diarsipkan.";
  });
}

async function runHalaqahAction(
  operation: () => Promise<string>,
): Promise<HalaqahActionResult> {
  try {
    const message = await operation();
    revalidatePath("/app");
    revalidatePath("/app/halaqah");
    return { success: true, message };
  } catch (error) {
    if (error instanceof HalaqahError) {
      return { success: false, message: error.message };
    }

    console.error("Halaqah action failed", error);
    return {
      success: false,
      message: "Perubahan halaqah belum dapat disimpan. Silakan coba lagi.",
    };
  }
}
