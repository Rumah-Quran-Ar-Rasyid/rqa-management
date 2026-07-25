"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/modules/auth/application/session";
import {
  MemorizationError,
  createMemorizationRecord,
} from "./memorization-service";
import type { CreateMemorizationRecordInput } from "../domain/memorization-schemas";

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
