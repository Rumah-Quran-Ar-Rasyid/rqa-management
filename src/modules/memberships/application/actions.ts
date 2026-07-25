"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/modules/auth/application/session";
import {
  HalaqahMembershipError,
  createOrMoveHalaqahMembership,
} from "./halaqah-membership-service";
import type { CreateHalaqahMembershipInput } from "../domain/halaqah-membership-schemas";

export type HalaqahMembershipActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function createOrMoveHalaqahMembershipAction(
  input: CreateHalaqahMembershipInput,
): Promise<HalaqahMembershipActionResult> {
  try {
    const actor = await requireUser();
    await createOrMoveHalaqahMembership(actor, input);
    revalidatePath("/app");
    revalidatePath("/app/keanggotaan");
    return { success: true, message: "Keanggotaan halaqah berhasil disimpan." };
  } catch (error) {
    if (error instanceof HalaqahMembershipError) {
      return { success: false, message: error.message };
    }

    console.error("Halaqah membership action failed", error);
    return {
      success: false,
      message: "Keanggotaan halaqah belum dapat disimpan. Silakan coba lagi.",
    };
  }
}
