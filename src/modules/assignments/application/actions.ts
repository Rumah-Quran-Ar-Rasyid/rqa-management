"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/modules/auth/application/session";
import {
  TeacherAssignmentError,
  closeTeacherAssignment,
  createTeacherAssignment,
} from "./teacher-assignment-service";
import type {
  CloseTeacherAssignmentInput,
  CreateTeacherAssignmentInput,
} from "../domain/teacher-assignment-schemas";

export type TeacherAssignmentActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function createTeacherAssignmentAction(
  input: CreateTeacherAssignmentInput,
): Promise<TeacherAssignmentActionResult> {
  return runAssignmentAction(async () => {
    const actor = await requireUser();
    await createTeacherAssignment(actor, input);
    return "Pengajar berhasil ditetapkan.";
  });
}

export async function closeTeacherAssignmentAction(
  input: CloseTeacherAssignmentInput,
): Promise<TeacherAssignmentActionResult> {
  return runAssignmentAction(async () => {
    const actor = await requireUser();
    await closeTeacherAssignment(actor, input);
    return "Penugasan Pengajar berhasil diakhiri.";
  });
}

async function runAssignmentAction(
  operation: () => Promise<string>,
): Promise<TeacherAssignmentActionResult> {
  try {
    const message = await operation();
    revalidatePath("/app");
    revalidatePath("/app/penugasan");
    return { success: true, message };
  } catch (error) {
    if (error instanceof TeacherAssignmentError) {
      return { success: false, message: error.message };
    }

    console.error("Teacher assignment action failed", error);
    return {
      success: false,
      message: "Penugasan belum dapat disimpan. Silakan coba lagi.",
    };
  }
}
