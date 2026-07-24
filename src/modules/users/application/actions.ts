"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/modules/auth/application/session";
import {
  UserManagementError,
  changeUserRole,
  changeUserStatus,
  createTeacherUser,
} from "./user-service";
import type {
  CreateTeacherInput,
  UserRoleChangeInput,
  UserStatusChangeInput,
} from "../domain/user-schemas";

export type UserActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function createTeacherAction(
  input: CreateTeacherInput,
): Promise<UserActionResult> {
  return runUserAction(async () => {
    const actor = await requireUser();
    await createTeacherUser(actor, input);
    return "Akun Pengajar berhasil dibuat.";
  });
}

export async function changeUserStatusAction(
  input: UserStatusChangeInput,
): Promise<UserActionResult> {
  return runUserAction(async () => {
    const actor = await requireUser();
    await changeUserStatus(actor, input);
    return input.status === "ACTIVE"
      ? "Pengguna berhasil diaktifkan."
      : "Pengguna berhasil dinonaktifkan.";
  });
}

export async function changeUserRoleAction(
  input: UserRoleChangeInput,
): Promise<UserActionResult> {
  return runUserAction(async () => {
    const actor = await requireUser();
    await changeUserRole(actor, input);
    return input.operation === "ASSIGN"
      ? "Role berhasil diberikan."
      : "Role berhasil dicabut.";
  });
}

async function runUserAction(
  operation: () => Promise<string>,
): Promise<UserActionResult> {
  try {
    const message = await operation();
    revalidatePath("/app");
    revalidatePath("/app/pengguna");
    return { success: true, message };
  } catch (error) {
    if (error instanceof UserManagementError) {
      return { success: false, message: error.message };
    }

    console.error("User management action failed", error);
    return {
      success: false,
      message: "Perubahan belum dapat disimpan. Silakan coba lagi.",
    };
  }
}
