import { z } from "zod";

export const createTeacherSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  email: z
    .string()
    .trim()
    .email("Format email belum benar.")
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(30, "Nomor telepon maksimal 30 karakter.")
    .transform((value) => value || undefined),
  password: z
    .string()
    .min(12, "Kata sandi awal minimal 12 karakter.")
    .max(128, "Kata sandi awal maksimal 128 karakter."),
});

export const userStatusChangeSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const userRoleChangeSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "HEAD", "TEACHER"]),
  operation: z.enum(["ASSIGN", "REVOKE"]),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UserStatusChangeInput = z.infer<typeof userStatusChangeSchema>;
export type UserRoleChangeInput = z.infer<typeof userRoleChangeSchema>;
