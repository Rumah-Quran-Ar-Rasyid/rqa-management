"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/modules/auth/application/session";
import {
  correctMemorizationRecord,
  MemorizationError,
  createMemorizationRecord,
  voidMemorizationRecord,
} from "./memorization-service";
import type {
  CorrectMemorizationRecordInput,
  CreateMemorizationRecordInput,
  VoidMemorizationRecordInput,
} from "../domain/memorization-schemas";

export type MemorizationActionResult =
  | { success: true; message: string }
  | {
      success: false;
      message: string;
      requiresDuplicateOverride?: boolean;
    };

export async function createMemorizationRecordAction(
  input: CreateMemorizationRecordInput,
): Promise<MemorizationActionResult> {
  try {
    const actor = await requireUser();
    await createMemorizationRecord(actor, input);
    revalidatePath("/app");
    revalidatePath("/app/setoran");
    return { success: true, message: "Setoran berhasil disimpan." };
  } catch (error) {
    if (error instanceof MemorizationError) {
      return {
        success: false,
        message: error.message,
        requiresDuplicateOverride:
          error.code === "DUPLICATE_OVERRIDE_REQUIRED",
      };
    }

    console.error("Memorization record action failed", error);
    return {
      success: false,
      message: "Setoran belum dapat disimpan. Silakan coba lagi.",
    };
  }
}

export async function correctMemorizationRecordAction(
  input: CorrectMemorizationRecordInput,
): Promise<MemorizationActionResult> {
  return runMemorizationAction(async () => {
    const actor = await requireUser();
    await correctMemorizationRecord(actor, input);
    return "Koreksi setoran berhasil disimpan.";
  }, input.recordId);
}

export async function voidMemorizationRecordAction(
  input: VoidMemorizationRecordInput,
): Promise<MemorizationActionResult> {
  return runMemorizationAction(async () => {
    const actor = await requireUser();
    await voidMemorizationRecord(actor, input);
    return "Setoran berhasil dibatalkan.";
  }, input.recordId);
}

async function runMemorizationAction(
  operation: () => Promise<string>,
  recordId?: string,
): Promise<MemorizationActionResult> {
  try {
    const message = await operation();
    revalidatePath("/app");
    revalidatePath("/app/setoran");
    if (recordId) {
      revalidatePath(`/app/riwayat-setoran/${recordId}`);
    }
    return { success: true, message };
  } catch (error) {
    if (error instanceof MemorizationError) {
      return { success: false, message: error.message };
    }

    console.error("Memorization record action failed", error);
    return {
      success: false,
      message: "Perubahan setoran belum dapat disimpan. Silakan coba lagi.",
    };
  }
}
