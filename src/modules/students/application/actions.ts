"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/modules/auth/application/session";
import {
  StudentError,
  changeStudentStatus,
  createStudent,
  updateStudent,
} from "./student-service";
import type {
  CreateStudentInput,
  StudentStatusChangeInput,
  UpdateStudentInput,
} from "../domain/student-schemas";

export type StudentActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function createStudentAction(
  input: CreateStudentInput,
): Promise<StudentActionResult> {
  return runStudentAction(async () => {
    const actor = await requireUser();
    await createStudent(actor, input);
    return "Santri berhasil dibuat.";
  });
}

export async function updateStudentAction(
  input: UpdateStudentInput,
): Promise<StudentActionResult> {
  return runStudentAction(async () => {
    const actor = await requireUser();
    await updateStudent(actor, input);
    return "Santri berhasil diperbarui.";
  });
}

export async function changeStudentStatusAction(
  input: StudentStatusChangeInput,
): Promise<StudentActionResult> {
  return runStudentAction(async () => {
    const actor = await requireUser();
    await changeStudentStatus(actor, input);
    return input.status === "ACTIVE"
      ? "Santri berhasil diaktifkan."
      : input.status === "INACTIVE"
        ? "Santri berhasil dinonaktifkan."
        : "Santri berhasil diarsipkan.";
  });
}

async function runStudentAction(
  operation: () => Promise<string>,
): Promise<StudentActionResult> {
  try {
    const message = await operation();
    revalidatePath("/app");
    revalidatePath("/app/santri");
    return { success: true, message };
  } catch (error) {
    if (error instanceof StudentError) {
      return { success: false, message: error.message };
    }

    console.error("Student action failed", error);
    return {
      success: false,
      message: "Perubahan santri belum dapat disimpan. Silakan coba lagi.",
    };
  }
}
